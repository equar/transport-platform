import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]


@unittest.skipUnless(shutil.which('nginx') and shutil.which('openssl'), 'Nginx and OpenSSL required')
class NginxTemplateTest(unittest.TestCase):
    def test_rendered_transport_proxy_is_valid(self):
        with tempfile.TemporaryDirectory(prefix='transport-nginx-') as directory:
            root = Path(directory)
            (root/'logs').mkdir(); (root/'certs').mkdir()
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                '-keyout', str(root/'certs/privkey.pem'), '-out', str(root/'certs/fullchain.pem'),
                '-subj', '/CN=transport.example.invalid', '-days', '1'], check=True, capture_output=True)
            template = (ROOT/'deployment/nginx-transport-platform.conf.template').read_text()
            rendered = template.replace('${APP_DOMAIN}', 'transport.example.invalid').replace(
                '/etc/letsencrypt/live/transport-platform', str(root/'certs'))
            self.assertIn('$host$request_uri', rendered)
            self.assertIn('fonts.googleapis.com', rendered)
            self.assertIn('fonts.gstatic.com', rendered)
            self.assertIn('~^(200|304):/assets/', rendered)
            self.assertIn('proxy_pass http://127.0.0.1:8087', rendered)
            self.assertNotIn('listen 3007', rendered)
            self.assertIn('location ^~ /api/actuator/ { return 404; }', rendered)
            # Distribution builds can default to /var/log/nginx/access.log,
            # which an unprivileged CI runner cannot open even with -p set.
            (root/'nginx.conf').write_text(
                f'pid {root}/nginx.pid;\nerror_log stderr;\nevents {{}}\n'
                f'http {{\naccess_log {root}/logs/access.log;\n{rendered}\n}}\n')
            result = subprocess.run(['nginx', '-e', 'stderr', '-t', '-p', str(root)+'/', '-c', str(root/'nginx.conf')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
