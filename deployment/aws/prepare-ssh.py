#!/usr/bin/env python3
import base64
import os
import subprocess
import sys
from pathlib import Path
from production_config import required
root = Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True, mode=0o700)
key = os.environ.get('LIGHTSAIL_SSH_KEY', '').replace('\\n', '\n').replace('\r', '')
if os.environ.get('LIGHTSAIL_SSH_KEY_B64'):
    try:
        key = base64.b64decode(''.join(os.environ['LIGHTSAIL_SSH_KEY_B64'].split()), validate=True).decode().replace('\r', '')
    except (ValueError, UnicodeError):
        raise SystemExit('LIGHTSAIL_SSH_KEY_B64 must encode a complete private key')
if not key.strip():
    raise SystemExit('Configure the deployment SSH key')
key_path = root / 'key'
key_path.write_text(key.rstrip() + '\n')
key_path.chmod(0o600)
hosts = root / 'known_hosts'
hosts.write_text(required(os.environ, 'LIGHTSAIL_KNOWN_HOSTS').strip() + '\n')
hosts.chmod(0o600)
for command, message in [
    (['ssh-keygen', '-y', '-P', '', '-f', str(key_path)], 'Invalid or encrypted SSH deployment key'),
    (['ssh-keygen', '-F', required(os.environ, 'LIGHTSAIL_HOST'), '-f', str(hosts)], 'Verified known_hosts entries do not contain LIGHTSAIL_HOST'),
]:
    if subprocess.run(command, capture_output=True).returncode:
        raise SystemExit(message)
print('SSH material prepared with pinned host verification.')
