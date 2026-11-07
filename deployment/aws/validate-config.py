#!/usr/bin/env python3
import argparse
from production_config import settings, runtime_settings, write_environment
parser = argparse.ArgumentParser()
parser.add_argument('--target', choices=['all', 'backend', 'frontend'], default='all')
parser.add_argument('--write-env')
parser.add_argument('--without-ssh', action='store_true', help='Only for preparing a host runtime file')
args = parser.parse_args()
try:
    env = settings(target=args.target, require_ssh=not args.without_ssh)
    if args.write_env:
        if args.target == 'frontend':
            raise ValueError('A frontend-only deployment has no backend environment file')
        write_environment(args.write_env, runtime_settings(env))
except ValueError as error:
    raise SystemExit(str(error))
print('Transport production configuration validated; secret values are not displayed.')
