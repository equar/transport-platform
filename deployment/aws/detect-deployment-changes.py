"""Select independently deployable applications from a merged commit's diff."""
import argparse
import json
import os
import subprocess
from pathlib import Path


def affected(paths):
    selected = set()
    for path in paths:
        if path.startswith(('docs/', 'deployment/aws/tests/')) or (path.endswith('.md') and not path.startswith(('frontend/src/', 'backend/src/'))):
            continue
        for folder, target in [('backend/', 'backend'), ('frontend/', 'frontend')]:
            if path.startswith(folder):
                selected.add(target)
        if path == '.github/workflows/deploy.yml':
            selected.update(('backend', 'frontend'))
        elif path in ('deployment/transport-platform-backend.service', 'deployment/deploy-backend-aws.sh'):
            selected.add('backend')
        elif path in ('deployment/nginx-transport-platform.conf.template', 'deployment/deploy-frontend-aws.sh'):
            selected.add('frontend')
        elif path.startswith('deployment/') and not path.startswith('deployment/aws/'):
            selected.update(('backend', 'frontend'))
        elif path.startswith('deployment/aws/'):
            if Path(path).name in ('deploy-backend.sh', 'activate-backend.sh', 'setup-rds-truststore.sh', 'sanitize-logs.py'):
                selected.add('backend')
            elif Path(path).name in ('deploy-frontend.sh', 'activate-frontend.sh'):
                selected.add('frontend')
            else:
                selected.update(('backend', 'frontend'))
    return selected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', default='auto', choices=['auto', 'all', 'backend', 'frontend'])
    parser.add_argument("--paths-json", help="Paginated GitHub PR files JSON, including previous filenames")
    args = parser.parse_args()
    if args.target == 'auto':
        if args.paths_json:
            pages = json.loads(Path(args.paths_json).read_text())
            files = [entry for page in pages for entry in page]
            paths = []
            for entry in files:
                paths.append(entry['filename'])
                if entry.get('previous_filename'):
                    paths.append(entry['previous_filename'])
            # Conservative fallback if a large API response may be truncated.
            selected = {'backend', 'frontend'} if len(files) >= 3000 else affected(paths)
        else:
            # CLI fallback for a normal merge/squash commit when no PR metadata is supplied.
            paths = subprocess.check_output(['git', 'diff', '--name-only', '--no-renames', '-z', 'HEAD^1', 'HEAD']).decode().split('\0')
            selected = affected(paths)
    elif args.target == 'all':
        selected = {'backend', 'frontend'}
    elif args.target == 'frontend':
        selected = {'frontend'}
    else:
        selected = {args.target}
    values = {target: str(target in selected).lower() for target in ('backend', 'frontend')}
    values['any'] = str(bool(selected)).lower()
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for key, value in values.items():
            output.write(f'{key}={value}\n')
    print('Deploy: ' + (', '.join(sorted(selected)) or 'nothing (no application changes)'))


if __name__ == '__main__':
    main()
