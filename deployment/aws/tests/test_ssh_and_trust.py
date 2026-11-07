import base64
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
AWS = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which('ssh-keygen'), 'OpenSSH required')
class SSHPreparationTest(unittest.TestCase):
    def test_base64_crlf_key_is_normalized_and_host_is_pinned(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); key = root/'source-key'
            subprocess.run(['ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-f', str(key)], check=True, capture_output=True)
            encoded = base64.b64encode(key.read_text().replace('\n', '\r\n').encode()).decode()
            env = dict(os.environ, LIGHTSAIL_HOST='transport.example.invalid', LIGHTSAIL_SSH_KEY_B64=encoded,
                LIGHTSAIL_KNOWN_HOSTS='transport.example.invalid '+(root/'source-key.pub').read_text())
            prepared = root/'prepared'
            result = subprocess.run([sys.executable, str(AWS/'prepare-ssh.py'), str(prepared)], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((prepared/'key').stat().st_mode & 0o777, 0o600)
            self.assertNotIn('\r', (prepared/'key').read_text())
            self.assertNotIn('PRIVATE KEY', result.stdout + result.stderr)
            env['LIGHTSAIL_HOST'] = 'different.example.invalid'
            result = subprocess.run([sys.executable, str(AWS/'prepare-ssh.py'), str(prepared)], env=env, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('do not contain', result.stderr)


@unittest.skipUnless(shutil.which('keytool') and shutil.which('openssl'), 'Java keytool and OpenSSL required')
class TruststoreTest(unittest.TestCase):
    def test_invalid_ca_bundle_never_replaces_existing_truststore(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); bundle = root/'bundle'; bundle.write_text('not a certificate')
            destination = root/'truststore'; destination.write_bytes(b'previous-valid-store')
            result = subprocess.run(['bash', str(AWS/'setup-rds-truststore.sh')], env=dict(os.environ,
                TRANSPORT_RDS_CA_BUNDLE_FILE=str(bundle), TRANSPORT_TRUSTSTORE_PATH=str(destination)), capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('no valid root certificates', result.stderr)
            self.assertEqual(destination.read_bytes(), b'previous-valid-store')

    def test_valid_ca_bundle_preserves_existing_public_roots(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cert = root/'root.pem'; key = root/'root.key'
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', str(key),
                '-out', str(cert), '-subj', '/CN=Transport test root', '-days', '1',
                '-addext', 'basicConstraints=critical,CA:TRUE'], check=True, capture_output=True)
            public = root/'public-roots.jks'
            subprocess.run(['keytool', '-importcert', '-noprompt', '-alias', 'fixture-public-root', '-file', str(cert),
                '-keystore', str(public), '-storepass', 'changeit'], check=True, capture_output=True)
            destination = root/'database-truststore.jks'
            result = subprocess.run(['bash', str(AWS/'setup-rds-truststore.sh')], env=dict(os.environ,
                TRANSPORT_RDS_CA_BUNDLE_FILE=str(cert), TRANSPORT_JAVA_CACERTS=str(public),
                TRANSPORT_TRUSTSTORE_PATH=str(destination)), capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            listed = subprocess.check_output(['keytool', '-list', '-keystore', str(destination), '-storepass', 'changeit'], text=True)
            self.assertIn('fixture-public-root', listed)
            self.assertIn('transport-rds-', listed)
