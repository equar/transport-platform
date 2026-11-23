"""Select independently deployable applications from a merged commit's diff."""
import argparse
import json
import os
import subprocess
import re
import urllib.request
import urllib.parse
from pathlib import Path


def affected(paths):
    selected = set()
    for path in paths:
        if path.startswith(('docs/', 'deployment/aws/tests/')) or (path.endswith('.md') and not path.startswith(('frontend/src/', 'backend/src/'))):
            continue
        for folder, target in [('backend/', 'backend'), ('frontend/', 'frontend')]:
            if path.startswith(folder):
                selected.add(target)
        # Workflow edits change orchestration, not deployed application bytes.
        # Operators can explicitly redeploy an application when required.
        if path in ('deployment/transport-platform-backend.service', 'deployment/transport-platform-privacy-maintenance.service', 'deployment/deploy-backend-aws.sh'):
            selected.add('backend')
        elif path in ('deployment/nginx-transport-platform.conf.template', 'deployment/deploy-frontend-aws.sh'):
            selected.add('frontend')
        elif path.startswith('deployment/') and not path.startswith('deployment/aws/'):
            selected.update(('backend', 'frontend'))
        elif path.startswith('deployment/aws/'):
            if Path(path).name in ('deploy-backend.sh', 'activate-backend.sh', 'setup-rds-truststore.sh', 'sanitize-logs.py'):
                selected.add('backend')
            elif Path(path).name in ('deploy-frontend.sh', 'activate-frontend.sh', 'setup-web-host.sh'):
                selected.add('frontend')
            else:
                selected.update(('backend', 'frontend'))
    return selected


def frontend_backlog(release_url):
    """Compare against the deployed UI, including changes missed by failed rollouts."""
    try:
        parsed=urllib.parse.urlparse(release_url)
        if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError('Invalid release URL')
        request=urllib.request.Request(release_url,headers={'Cache-Control':'no-cache'})
        with urllib.request.urlopen(request,timeout=10) as response:
            payload=response.read(65537)
        if len(payload)>65536: raise ValueError('Release metadata too large')
        release=json.loads(payload)['release']
        match=re.fullmatch(r'([0-9a-f]{40})(?:-[A-Za-z0-9._-]+)?',release)
        if not match: raise ValueError('Invalid release ID')
        paths=subprocess.check_output(['git','diff','--name-only','--no-renames','-z',match[1],'HEAD'],stderr=subprocess.DEVNULL).decode().split('\0')
        return 'frontend' in affected(paths)
    except Exception:
        # A missing/unverifiable baseline must not silently leave an incompatible UI live.
        print('Frontend release baseline unavailable; including frontend conservatively.')
        return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', default='auto', choices=['auto', 'all', 'backend', 'frontend'])
    parser.add_argument("--paths-json", help="Paginated GitHub PR files JSON, including previous filenames")
    parser.add_argument("--frontend-release-url", help="Live admin release metadata for recovery of missed frontend changes")
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
    if args.target == 'auto' and args.frontend_release_url and frontend_backlog(args.frontend_release_url):
        selected.add('frontend')
    values = {target: str(target in selected).lower() for target in ('backend', 'frontend')}
    values['any'] = str(bool(selected)).lower()
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for key, value in values.items():
            output.write(f'{key}={value}\n')
    print('Deploy: ' + (', '.join(sorted(selected)) or 'nothing (no application changes)'))


if __name__ == '__main__':
    main()
