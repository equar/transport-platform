"""Scan a Maven dependency:tree JSON file against OSV (public package names/versions only).
Usage: python3 scripts/check-maven-vulnerabilities.py tree.json report.json
Network failures and untriaged vulnerabilities fail the check; no credentials are sent.
API: https://google.github.io/osv.dev/post-v1-querybatch/
"""
import datetime
import concurrent.futures
import json
import pathlib
import sys
import urllib.request


def request(url, body=None):
    req = urllib.request.Request(url, None if body is None else json.dumps(body).encode(),
                                 {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)


def main():
    root = json.loads(pathlib.Path(sys.argv[1]).read_text())
    packages = {}
    def visit(node):
        if node.get('scope') != 'test' and node is not root:
            name = node['groupId'] + ':' + node['artifactId']
            packages[(name, node['version'])] = {'package': {'name': name, 'ecosystem': 'Maven'}, 'version': node['version']}
        for child in node.get('children', []):
            if child.get('scope') != 'test':
                visit(child)
    visit(root)
    findings = []
    for key, query in packages.items():
        findings.append({'name': key[0], 'version': key[1], 'query': query, 'ids': set()})
    pending = list(range(len(findings)))
    for _ in range(30):
        if not pending:
            break
        response = request('https://api.osv.dev/v1/querybatch', {'queries': [findings[i]['query'] for i in pending]})
        assert len(response['results']) == len(pending), 'Incomplete scanner response'
        more = []
        for i, result in zip(pending, response['results']):
            findings[i]['ids'].update(v['id'] for v in result.get('vulns', []))
            if result.get('next_page_token'):
                findings[i]['query']['page_token'] = result['next_page_token']
                more.append(i)
        pending = more
    if pending:
        raise RuntimeError('Scanner pagination limit exceeded')
    affected = [f for f in findings if f['ids']]
    ids = sorted({v for f in affected for v in f['ids']})
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        details = dict(zip(ids, executor.map(lambda v: request('https://api.osv.dev/v1/vulns/' + v), ids)))
    report = {'scannedPackages': len(findings), 'affected': [{k: sorted(v) if isinstance(v, set) else v
              for k, v in f.items() if k != 'query'} for f in affected], 'advisories': details}
    pathlib.Path(sys.argv[2]).write_text(json.dumps(report, indent=2) + '\n')
    assessment_path = pathlib.Path(__file__).resolve().parent.parent / 'security/maven-advisory-assessments.json'
    assessments = json.loads(assessment_path.read_text()) if assessment_path.exists() else {}
    untriaged = []
    for finding in affected:
        for advisory in finding['ids']:
            assessment = assessments.get(advisory, {})
            applies = (assessment.get('package') == finding['name'] and assessment.get('version') == finding['version']
                and datetime.date.fromisoformat(assessment.get('expires', '1970-01-01')) >= datetime.date.today()
                and (assessment_path.parent.parent / assessment.get('guard', 'missing')).is_file())
            if not applies:
                untriaged.append({'name': finding['name'], 'id': advisory})
    report['untriaged'] = untriaged
    report['assessments'] = assessments
    pathlib.Path(sys.argv[2]).write_text(json.dumps(report, indent=2) + '\n')
    print('Scanned', len(findings), 'production Maven packages;', len(affected), 'affected packages.')
    for f in affected:
        print(f['name'], f['version'], ', '.join(sorted(f['ids'])))
    return bool(untriaged)


if __name__ == '__main__':
    sys.exit(main())
