"""Exercise backend activation without touching the host service or database."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

AWS = Path(__file__).resolve().parents[1]
ROOT = AWS.parents[1]


class MaintenanceActivationTests(unittest.TestCase):
    def activate(self, fail=False, running=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            incoming = root/'incoming'; incoming.mkdir()
            binaries = root/'bin'; binaries.mkdir()
            for name in ('backend.jar', 'backend.env', 'transport-platform-backend.service', 'transport-platform-privacy-maintenance.service'):
                (incoming/name).write_text('fixture')
            (incoming/'setup-rds-truststore.sh').write_text('exit 0\n')
            (incoming/'sanitize-logs.py').write_text('print("sanitized maintenance diagnostics")\n')
            script = (AWS/'activate-backend.sh').read_text()
            script = script.replace('[[ "$EUID" -eq 0 ]]', 'true')
            script = script.replace('^/home/[a-z_][a-z0-9_-]*/\\.cache/transport-platform-deploy/transport-backend\\.[a-zA-Z0-9]+$', '^'+str(incoming)+'$')
            script = script.replace('[[ "$(/usr/bin/java -version 2>&1)" == *\'"25\'* ]]', 'true')
            script = script.replace('/var/lock/transport-platform-deploy.lock', str(root/'lock'))
            script = script.replace('app=/opt/transport-platform', 'app='+str(root/'app'))
            script = script.replace('unit=/etc/systemd/system/$service', 'unit='+str(root/'backend.service'))
            script = script.replace('/etc/systemd/system/transport-platform-privacy-maintenance.service', str(root/'maintenance.service'))
            (root/'activate.sh').write_text(script)
            for name in ('flock', 'id', 'ss'):
                path=binaries/name; path.write_text('#!/bin/sh\nexit 0\n'); path.chmod(0o755)
            install=binaries/'install'
            install.write_text(f'#!{sys.executable}\n'+'''import pathlib,shutil,sys
args=sys.argv[1:]; paths=[]; i=0
while i<len(args):
 if args[i] in ('-o','-g','-m'): i+=2
 elif args[i]=='-d': i+=1
 else: paths.append(pathlib.Path(args[i])); i+=1
if '-d' in args:
 for p in paths: p.mkdir(parents=True,exist_ok=True)
else: shutil.copyfile(paths[-2],paths[-1])
'''); install.chmod(0o755)
            curl=binaries/'curl'; curl.write_text('#!/bin/sh\necho \'{"status":"UP"}\'\n'); curl.chmod(0o755)
            control=binaries/'systemctl'
            control.write_text('''#!/bin/sh
echo "$*" >> "$TEST_COMMANDS"
case "$1" in
 show) case "$*" in *ActiveState*) echo "$TEST_MAINTENANCE_STATE" ;; *) echo transport ;; esac ;;
 is-active) test -e "$TEST_ACTIVE" ;;
 is-failed) exit 1 ;;
 stop) rm -f "$TEST_ACTIVE" ;;
 start) test "$FAIL_MAINTENANCE" != 1 ;;
 restart) touch "$TEST_ACTIVE" ;;
esac
'''); control.chmod(0o755)
            log=root/'commands'
            result=subprocess.run(['bash',str(root/'activate.sh'),str(incoming),'release-test'],env=dict(os.environ,PATH=str(binaries)+os.pathsep+os.environ['PATH'],TEST_COMMANDS=str(log),TEST_ACTIVE=str(root/'active'),FAIL_MAINTENANCE='1' if fail else '0',TEST_MAINTENANCE_STATE='activating' if running else 'inactive'),capture_output=True,text=True,timeout=15)
            return result,log.read_text(),(root/'active').exists()

    def test_maintenance_completes_before_backend_start(self):
        result,commands,active=self.activate()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertLess(commands.index('start transport-platform-privacy-maintenance.service'),commands.index('restart transport-platform-backend.service'))
        self.assertTrue(active)
        self.assertEqual(commands.count('reset-failed transport-platform-backend.service'),1)
        self.assertLess(commands.index('reset-failed transport-platform-backend.service'),commands.index('restart transport-platform-backend.service'))

    def test_failure_keeps_backend_stopped_without_unsafe_jar_rollback(self):
        result,commands,active=self.activate(fail=True)
        self.assertNotEqual(result.returncode,0)
        self.assertNotIn('restart transport-platform-backend.service',commands)
        self.assertFalse(active)
        self.assertIn('Automatic JAR rollback is unsafe',result.stderr)

    def test_interrupted_deployment_cannot_replace_a_running_maintenance_release(self):
        result,commands,active=self.activate(running=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('still running',result.stderr)
        self.assertNotIn('stop transport-platform-backend.service',commands)
        self.assertFalse(active)

    def test_offline_unit_uses_service_environment_without_shell_sourcing(self):
        unit=(ROOT/'deployment/transport-platform-privacy-maintenance.service').read_text()
        self.assertIn('User=transport',unit)
        self.assertIn('EnvironmentFile=/opt/transport-platform/.env',unit)
        self.assertIn('Conflicts=transport-platform-backend.service',unit)
        self.assertIn('PropertiesLauncher --ensure-ready',unit)
        self.assertIn('database-truststore.jks',unit)
        self.assertNotIn('/bin/bash',unit)

    def test_backend_restart_budget_is_three_total_starts_one_minute_apart(self):
        import configparser
        config=configparser.ConfigParser(interpolation=None)
        config.read(ROOT/'deployment/transport-platform-backend.service')
        self.assertEqual(config['Unit']['StartLimitBurst'],'3')
        self.assertEqual(config['Unit']['StartLimitIntervalSec'],'infinity')
        self.assertEqual(config['Service']['Restart'],'on-failure')
        self.assertEqual(config['Service']['RestartSec'],'60')
