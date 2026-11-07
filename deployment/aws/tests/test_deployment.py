import importlib.util
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import tarfile
import unittest

AWS = Path(__file__).resolve().parents[1]
ROOT = AWS.parents[1]
sys.path.insert(0, str(AWS))
from production_config import settings, runtime_settings, write_environment, SECRET_KEYS, VARIABLE_KEYS
spec = importlib.util.spec_from_file_location('changes', AWS / 'detect-deployment-changes.py')
changes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(changes)


def environment():
    return dict(APP_PUBLIC_URL='https://transport.example.invalid', APP_ADMIN_URL='https://admin.transport.example.invalid', VITE_API_BASE_URL='/api',
        APP_SECURITY_ALLOWED_ORIGINS='https://transport.example.invalid,https://admin.transport.example.invalid',
        LIGHTSAIL_HOST='host.example.invalid', LIGHTSAIL_USER='ubuntu',
        LIGHTSAIL_SSH_KEY_B64='dummy-key', LIGHTSAIL_KNOWN_HOSTS='host.example.invalid ssh-ed25519 dummy',
        MYSQL_HOST='db.example.invalid', MYSQL_USER='transport', MYSQL_PASSWORD='private-db-value',
        APP_SECURITY_JWT_SECRET='random-signing-secret-value-32-bytes-long')


class SelectionTests(unittest.TestCase):
    def test_independent_targets_and_no_mobile_deploy(self):
        for path, expected in [
            ('backend/src/Main.java', {'backend'}), ('frontend/src/App.tsx', {'frontend'}),
            ('mobile/app/login.tsx', set()), ('frontend/README.md', set()),
            ('frontend/src/content.md', {'frontend'}), ('docs/review.md', set()),
            ('deployment/aws/activate-backend.sh', {'backend'}),
            ('deployment/aws/activate-frontend.sh', {'frontend'}),
            ('.github/workflows/deploy.yml', {'backend', 'frontend'}),
        ]:
            self.assertEqual(changes.affected([path]), expected, path)

    def test_manual_targets_without_git_history(self):
        with tempfile.TemporaryDirectory() as directory:
            for target, expected in [('backend', {'backend'}), ('frontend', {'frontend'}), ('all', {'backend', 'frontend'})]:
                output = Path(directory) / target
                subprocess.run([sys.executable, str(AWS/'detect-deployment-changes.py'), '--target', target],
                    cwd=directory, env=dict(os.environ, GITHUB_OUTPUT=str(output)), check=True, capture_output=True)
                for app in ('backend', 'frontend'):
                    self.assertIn(f'{app}={str(app in expected).lower()}', output.read_text())

    def test_pr_pages_cover_all_commits_and_previous_rename_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            pages = [[{'filename': 'docs/setup.md'}], [{'filename': 'backend/New.java', 'previous_filename': 'frontend/Old.ts'}]]
            (root/'files.json').write_text(json.dumps(pages))
            subprocess.run([sys.executable, str(AWS/'detect-deployment-changes.py'), '--paths-json', str(root/'files.json')],
                cwd=root, env=dict(os.environ, GITHUB_OUTPUT=str(root/'outputs')), check=True, capture_output=True)
            self.assertIn('backend=true', (root/'outputs').read_text())
            self.assertIn('frontend=true', (root/'outputs').read_text())

    def test_deleted_and_renamed_paths_are_selected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                subprocess.run(['git', *args], cwd=root, check=True, capture_output=True)
            git('init'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test')
            (root/'frontend').mkdir(); (root/'frontend/old.ts').write_text('test')
            git('add', '.'); git('commit', '-m', 'initial')
            (root/'backend').mkdir(); (root/'frontend/old.ts').rename(root/'backend/new.java')
            git('add', '-A'); git('commit', '-m', 'move')
            subprocess.run([sys.executable, str(AWS/'detect-deployment-changes.py')], cwd=root,
                env=dict(os.environ, GITHUB_OUTPUT=str(root/'outputs')), check=True, capture_output=True)
            self.assertIn('backend=true', (root/'outputs').read_text())
            self.assertIn('frontend=true', (root/'outputs').read_text())


class ConfigurationTests(unittest.TestCase):
    def test_safe_defaults_and_runtime_tls(self):
        runtime = runtime_settings(settings(environment()))
        self.assertEqual(runtime['SPRING_PROFILES_ACTIVE'], 'prod')
        self.assertEqual(runtime['SERVER_ADDRESS'], '127.0.0.1')
        self.assertEqual(runtime['APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED'], 'false')
        self.assertEqual(runtime['SPRING_FLYWAY_LOCATIONS'], 'classpath:db/migration')
        self.assertIn('sslMode=VERIFY_IDENTITY', runtime['SPRING_DATASOURCE_URL'])
        self.assertEqual(runtime['APP_AUTH_PASSWORD_RESET_BASE_URL'], 'https://admin.transport.example.invalid/reset-password')

    def test_websites_require_distinct_origins_and_admin_recovery(self):
        values = environment()
        values['APP_ADMIN_URL'] = values['APP_PUBLIC_URL']
        with self.assertRaises(ValueError): settings(values)
        values = environment()
        values['APP_SECURITY_ALLOWED_ORIGINS'] = values['APP_PUBLIC_URL']
        with self.assertRaises(ValueError): settings(values)
        values = environment()
        values['APP_AUTH_PASSWORD_RESET_BASE_URL'] = values['APP_PUBLIC_URL'] + '/reset-password'
        with self.assertRaises(ValueError): settings(values)

    def test_frontend_only_needs_no_database_or_jwt_credentials(self):
        values = environment()
        for key in ('MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'APP_SECURITY_JWT_SECRET'):
            values.pop(key)
        settings(values, target='frontend')
        with self.assertRaises(ValueError): settings(values, target='backend')

    def test_invalid_production_settings_are_rejected_without_values(self):
        for key, value in [('APP_PUBLIC_URL', 'http://localhost:3007'), ('VITE_API_BASE_URL', 'https://unrelated.invalid'),
            ('MYSQL_DATABASE', 'bingo'), ('MYSQL_PORT', '70000'), ('APP_SECURITY_JWT_SECRET', 'short'),
            ('APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED', 'true'), ('APP_LOGGING_LEVEL_SQL_BIND', 'TRACE'),
            ('APP_LOGGING_LEVEL_APP', 'DEBUG'), ('MYSQL_PASSWORD', 'sentinel-secret\nSERVER_PORT=1234')]:
            env = environment(); env[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError) as failure: settings(env)
            self.assertNotIn('sentinel-secret', str(failure.exception))

    def test_manual_deployment_accepts_verified_existing_ssh_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root/'key').write_text('key'); (root/'hosts').write_text('verified')
            env = environment(); env.pop('LIGHTSAIL_SSH_KEY_B64'); env.pop('LIGHTSAIL_KNOWN_HOSTS')
            env.update(SSH_KEY=str(root/'key'), SSH_KNOWN_HOSTS_FILE=str(root/'hosts'))
            settings(env)

    def test_environment_values_are_literal_and_private(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'runtime.env'
            secret = 'quoted " password $HOME $(touch NEVER) `whoami` \\ # literal'
            write_environment(path, {'MYSQL_PASSWORD': secret})
            self.assertEqual(shlex.split(path.read_text().split('=', 1)[1])[0], secret)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertFalse((Path(directory)/'NEVER').exists())

    def test_delivery_configuration_is_checked(self):
        env = environment(); env.update(APP_PUSH_ENABLED='true', APP_PUSH_PROVIDER='expo')
        settings(env)
        env.update(APP_EMAIL_ENABLED='true', APP_EMAIL_PROVIDER='microsoft-graph')
        with self.assertRaises(ValueError): settings(env)
        env.update(APP_EMAIL_FROM='dispatch@example.invalid', MICROSOFT_GRAPH_CLIENT_ID='client',
            MICROSOFT_GRAPH_TENANT_ID='tenant', MICROSOFT_GRAPH_CLIENT_SECRET='private-graph')
        runtime = runtime_settings(settings(env))
        self.assertEqual(runtime['APP_PUSH_ENABLED'], 'true')
        self.assertEqual(runtime['MICROSOFT_GRAPH_CLIENT_SECRET'], 'private-graph')

    def test_example_importer_keys_match_supported_configuration(self):
        for line in (AWS/'github-actions.env.example').read_text().splitlines():
            if line and not line.startswith('#'):
                self.assertIn(line.split('=', 1)[0], SECRET_KEYS | VARIABLE_KEYS)

    def test_importer_rejects_whole_file_before_any_repository_write(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); path = root/'settings'
            path.write_text('MYSQL_PASSWORD=sentinel-secret\nUNRECOGNIZED=bad\n')
            result = subprocess.run([sys.executable, str(AWS/'bootstrap-github-actions-config.py'), str(path)],
                env=dict(os.environ, GH_REPO='owner/transport'), text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Unknown', result.stderr)
            self.assertNotIn('sentinel-secret', result.stdout + result.stderr)


class DeploymentScriptTests(unittest.TestCase):
    def test_first_frontend_release_and_subsequent_switch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            incoming = root/'incoming'; incoming.mkdir()
            binaries = root/'bin'; binaries.mkdir()
            for name in ('nginx', 'flock', 'chown'):
                path = binaries/name
                path.write_text('#!/bin/sh\nexit 0\n'); path.chmod(0o755)
            # Exercise GNU mv's atomic rename on macOS too.
            path = binaries/'mv'
            path.write_text(f'#!{sys.executable}\nimport os,sys\nos.replace(sys.argv[-2],sys.argv[-1])\n')
            path.chmod(0o755)
            script = (AWS/'activate-frontend.sh').read_text()
            script = script.replace('[[ "$EUID" -eq 0 ]]', 'true')
            script = script.replace('^/tmp/transport-frontend\\.[a-zA-Z0-9]+$', '^'+str(incoming)+'$')
            script = script.replace('/var/www/', str(root)+'/')
            script = script.replace('/var/lock/transport-platform-deploy.lock', str(root/'deploy.lock'))
            activation = root/'activate.sh'; activation.write_text(script)
            for release in ('first', 'second'):
                for site in ('public', 'admin'):
                    (incoming/site).mkdir(exist_ok=True)
                    (incoming/site/'index.html').write_text('<html>'+site+release+'</html>')
                (incoming/'release.json').write_text(json.dumps({'release': release}))
                with tarfile.open(incoming/'frontend.tar.gz', 'w:gz') as archive:
                    for name in ('public', 'admin', 'release.json'):
                        archive.add(incoming/name, arcname=name)
                result = subprocess.run(['bash', str(activation), str(incoming), release],
                    env=dict(os.environ, PATH=str(binaries)+os.pathsep+os.environ['PATH']),
                    capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual((root/'transport-platform').resolve(), root/'transport-platform-releases'/release)
            self.assertEqual((root/'transport-platform.previous').resolve(), root/'transport-platform-releases/first')

    def fixture(self, directory):
        root = Path(directory); aws = root/'deployment/aws'; aws.mkdir(parents=True)
        for name in ('deploy-common.sh', 'deploy-frontend.sh', 'activate-frontend.sh', 'validate-config.py', 'production_config.py'):
            shutil.copy(AWS/name, aws/name)
        dist = root/'frontend/dist'; dist.mkdir(parents=True)
        for site in ('public', 'admin'):
            (dist/site).mkdir(); (dist/site/'index.html').write_text('<html>'+site+'</html>')
        binaries = root/'bin'; binaries.mkdir(); log = root/'commands'; payload = root/'remote-payload'
        for command in ('ssh', 'scp', 'curl', 'sleep'):
            script = binaries/command
            script.write_text('''#!/bin/bash
printf '%s %s\\n' "$(basename "$0")" "$*" >> "$DEPLOY_TEST_LOG"
case "$(basename "$0")" in
 ssh) if [[ "$*" == *mktemp* ]]; then echo /tmp/transport-frontend.ABCDEFGH; else cat >> "$DEPLOY_TEST_PAYLOAD"; fi ;;
 curl) if [[ "$*" == *release.json* ]]; then printf '{"release":"%s"}' "${TEST_RELEASE:-release-123}"; else echo '{"status":"UP"}'; fi ;;
esac
'''); script.chmod(0o755)
        key = root/'key'; key.write_text('dummy'); hosts = root/'known_hosts'; hosts.write_text('verified')
        env = dict(os.environ, **environment(), PATH=str(binaries)+os.pathsep+os.environ['PATH'],
            DEPLOY_TEST_LOG=str(log), DEPLOY_TEST_PAYLOAD=str(payload), DEPLOY_ID='release-123',
            SSH_KEY=str(key), SSH_KNOWN_HOSTS_FILE=str(hosts))
        return root, env, log, payload

    def test_frontend_activation_and_verified_host_options(self):
        with tempfile.TemporaryDirectory() as directory:
            root, env, log, _ = self.fixture(directory)
            result = subprocess.run(['bash', str(root/'deployment/aws/deploy-frontend.sh')], env=env, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('StrictHostKeyChecking=yes', log.read_text())
            self.assertIn('activate-frontend.sh', log.read_text())
            self.assertIn('/release.json', log.read_text())
            self.assertNotIn('private-db-value', result.stdout + result.stderr)

    def test_wrong_public_release_fails_and_requests_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            root, env, _, payload = self.fixture(directory)
            env['TEST_RELEASE'] = 'old-release'
            result = subprocess.run(['bash', str(root/'deployment/aws/deploy-frontend.sh')], env=env, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('verification failed', result.stderr)
            self.assertIn('Previous frontend restored', payload.read_text())

    def test_all_local_and_remote_scripts_parse(self):
        for path in (ROOT/'deployment').rglob('*.sh'):
            subprocess.run(['bash', '-n', str(path)], check=True, capture_output=True)


if __name__ == '__main__':
    unittest.main()
