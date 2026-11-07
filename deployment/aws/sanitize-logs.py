#!/usr/bin/env python3
"""Print transport startup diagnostics with runtime secret values removed."""
import re
import shlex
import subprocess
from pathlib import Path
secrets = []
for name in ('.env', '.env.previous'):
    path = Path('/opt/transport-platform') / name
    if not path.exists():
        continue
    for line in path.read_text().splitlines():
        if '=' not in line:
            continue
        key, value = line.split('=', 1)
        if re.search('PASSWORD|SECRET|KEY|TOKEN', key):
            parsed = shlex.split(value)
            if parsed and parsed[0]:
                secrets.append(parsed[0])
result = subprocess.run(['journalctl', '-u', 'transport-platform-backend.service', '-n', '100', '--no-pager', '-o', 'cat'], capture_output=True, text=True)
output = result.stdout + result.stderr
for value in sorted(secrets, key=len, reverse=True):
    output = output.replace(value, '[REDACTED]')
print(output)
