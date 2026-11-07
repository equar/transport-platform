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
            rendered = template.replace('${APP_DOMAIN}', 'transport.example.invalid').replace('${ADMIN_DOMAIN}', 'admin.transport.example.invalid').replace(
                '/etc/letsencrypt/live/transport-platform', str(root/'certs'))
            self.assertIn('$host$request_uri', rendered)
            self.assertIn('server_name admin.transport.example.invalid;', rendered)
            self.assertIn('root /var/www/transport-platform/public;', rendered)
            self.assertIn('root /var/www/transport-platform/admin;', rendered)
            self.assertIn('https://admin.transport.example.invalid$request_uri', rendered)
            self.assertIn('X-Robots-Tag', rendered)
            self.assertIn('fonts.googleapis.com', rendered)
            self.assertIn('fonts.gstatic.com', rendered)
            self.assertIn('~^(200|304):/assets/', rendered)
            self.assertIn('proxy_pass http://127.0.0.1:8082', rendered)
            self.assertNotIn('listen 3007', rendered)
            self.assertIn('location ^~ /api/actuator/ { return 404; }', rendered)
            self.assertIn('location = /index.html { try_files $uri =404; }', rendered)
            # Distribution builds can default to /var/log/nginx/access.log,
            # which an unprivileged CI runner cannot open even with -p set.
            (root/'nginx.conf').write_text(
                f'pid {root}/nginx.pid;\nerror_log stderr;\nevents {{}}\n'
                f'http {{\naccess_log {root}/logs/access.log;\n{rendered}\n}}\n')
            result = subprocess.run(['nginx', '-e', 'stderr', '-t', '-p', str(root)+'/', '-c', str(root/'nginx.conf')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_live_vhosts_serve_separate_sites_and_redirect_legacy_account_links(self):
        import socket
        import ssl
        import time
        import urllib.request
        import urllib.error
        with tempfile.TemporaryDirectory(prefix='transport-vhosts-') as directory:
            root = Path(directory).resolve()
            (root/'certs').mkdir(); (root/'logs').mkdir()
            for site in ('public', 'admin'):
                (root/'site'/site).mkdir(parents=True)
                (root/'site'/site/'index.html').write_text(site + ' application')
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                '-keyout', str(root/'certs/privkey.pem'), '-out', str(root/'certs/fullchain.pem'),
                '-subj', '/CN=transport.example.invalid', '-days', '1'], check=True, capture_output=True)
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0)); http_port = sock.getsockname()[1]
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0)); https_port = sock.getsockname()[1]
            rendered = (ROOT/'deployment/nginx-transport-platform.conf.template').read_text()
            for before, after in [
                ('${APP_DOMAIN}', 'transport.example.invalid'),
                ('${ADMIN_DOMAIN}', 'admin.transport.example.invalid'),
                ('/etc/letsencrypt/live/transport-platform', str(root/'certs')),
                ('/var/www/transport-platform', str(root/'site')),
                ('listen [::]:80;', ''), ('listen [::]:443 ssl http2;', ''),
                ('listen 80;', f'listen 127.0.0.1:{http_port};'),
                ('listen 443 ssl http2;', f'listen 127.0.0.1:{https_port} ssl;'),
            ]:
                rendered = rendered.replace(before, after)
            config = root/'nginx.conf'
            config.write_text(f'pid {root}/nginx.pid;\nerror_log stderr;\nevents {{}}\nhttp {{ access_log {root}/logs/access.log;\n{rendered}\n}}')
            process = subprocess.Popen(['nginx', '-e', 'stderr', '-p', str(root)+'/', '-c', str(config), '-g', 'daemon off;'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # Trust is deliberately disabled only for this loopback fixture's self-signed certificate.
            context = ssl._create_unverified_context()
            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, *args): return None
            opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPSHandler(context=context))
            def request(host, path):
                req = urllib.request.Request(f'https://127.0.0.1:{https_port}'+path, headers={'Host': host})
                try: return opener.open(req, timeout=2)
                except urllib.error.HTTPError as error: return error
            try:
                for _ in range(50):
                    try:
                        with request('transport.example.invalid', '/health') as response:
                            if response.status == 200: break
                    except OSError: pass
                    time.sleep(0.1)
                else: self.fail('Test Nginx did not start')
                for host, expected in [('transport.example.invalid', b'public application'), ('admin.transport.example.invalid', b'admin application')]:
                    with request(host, '/') as response:
                        self.assertEqual(response.status, 200)
                        self.assertEqual(response.read(), expected)
                        self.assertEqual(response.headers.get('X-Robots-Tag'), 'noindex, nofollow' if expected.startswith(b'admin') else None)
                with request('transport.example.invalid', '/reset-password?token=example') as response:
                    self.assertEqual(response.status, 302)
                    self.assertEqual(response.headers['Location'], 'https://admin.transport.example.invalid/reset-password?token=example')
                (root/'site/public/index.html').unlink()
                with request('transport.example.invalid', '/missing-route') as response:
                    self.assertEqual(response.status, 404)
            finally:
                process.terminate()
                process.communicate(timeout=10)
