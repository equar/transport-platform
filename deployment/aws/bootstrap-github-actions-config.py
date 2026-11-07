#!/usr/bin/env python3
"""Import explicit transport deployment settings without shell evaluation."""
import os
from pathlib import Path
import subprocess
import sys
from production_config import SECRET_KEYS, VARIABLE_KEYS
path = Path(sys.argv[1])
values = {}
for number, line in enumerate(path.read_text().splitlines(), 1):
    if not line.strip() or line.lstrip().startswith('#'):
        continue
    key, separator, value = line.partition('=')
    if not separator or key not in SECRET_KEYS | VARIABLE_KEYS:
        raise SystemExit(f'Unknown or malformed configuration key at line {number}')
    if key in values:
        raise SystemExit('Duplicate configuration key: ' + key)
    if value.startswith(('REPLACE_', 'YOUR_')):
        raise SystemExit('Replace placeholder for ' + key)
    if not value:
        continue  # Optional settings use documented defaults; do not erase stored secrets.
    values[key] = value
repo = os.environ.get('GH_REPO')
if not repo:
    repo = subprocess.check_output(['gh', 'repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], text=True).strip()
subprocess.run(['gh', 'auth', 'status'], check=True, stdout=subprocess.DEVNULL)
# Parse the entire file before making any repository changes.
for key, value in values.items():
    kind = 'secret' if key in SECRET_KEYS else 'variable'
    if key == 'LIGHTSAIL_KNOWN_HOSTS':
        value = value.replace('\\n', '\n')
    subprocess.run(['gh', kind, 'set', key, '--repo', repo], input=value, text=True, check=True)
    print('Configured ' + kind + ': ' + key)
