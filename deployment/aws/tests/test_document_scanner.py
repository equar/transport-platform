import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

SCRIPT = Path(__file__).resolve().parents[1] / 'check-document-scanner.py'
spec = importlib.util.spec_from_file_location('document_scanner_check', SCRIPT)
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


class DocumentScannerCheckTests(unittest.TestCase):
    def test_fragmented_complete_pong_is_accepted(self):
        connection = MagicMock()
        connection.recv.side_effect = [b'PO', b'NG', b'\0']
        with patch.object(scanner.socket, 'create_connection') as connect:
            connect.return_value.__enter__.return_value = connection
            scanner.ping('127.0.0.1', 3310)
        connection.sendall.assert_called_once_with(b'zPING\0')

    def test_truncated_or_wrong_protocol_response_is_rejected(self):
        for reply in ([b'PONG', b''], [b'ERROR']):
            connection = MagicMock()
            connection.recv.side_effect = reply
            with patch.object(scanner.socket, 'create_connection') as connect:
                connect.return_value.__enter__.return_value = connection
                with self.assertRaises(OSError):
                    scanner.ping('127.0.0.1', 3310)

    def test_connection_refusal_has_actionable_output_without_a_traceback(self):
        with patch.object(scanner.sys, 'argv', ['check']), patch.dict(os.environ, {'APP_DOCUMENT_SCAN_ENABLED': 'true'}, clear=True), \
             patch.object(scanner.socket, 'create_connection', side_effect=ConnectionRefusedError()), \
             patch.object(scanner.time, 'sleep'), patch('sys.stderr') as error:
            self.assertEqual(scanner.main(), 1)
        output = ''.join(call.args[0] for call in error.write.call_args_list)
        self.assertIn('127.0.0.1:3310', output)
        self.assertIn('ClamAV clamd', output)
        self.assertNotIn('Traceback', output)

    def test_staged_settings_are_read_without_evaluating_unrelated_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / 'backend.env'
            env.write_text('APP_DOCUMENT_SCAN_HOST="::1"\nAPP_DOCUMENT_SCAN_PORT="3320"\n'
                           'APP_DOCUMENT_SCAN_ENABLED="true"\nPASSWORD="$(exit 1) `exit 1`"\n')
            self.assertEqual(scanner.configuration(env), ('::1', 3320))

    def test_disabled_or_default_scanning_never_connects_to_clamav(self):
        for settings in ({}, {'APP_DOCUMENT_SCAN_ENABLED': 'false'}):
            with patch.dict(os.environ, settings, clear=True), patch.object(scanner.sys, 'argv', ['check']), \
                 patch.object(scanner.socket, 'create_connection') as connection:
                self.assertEqual(scanner.main(), 0)
                connection.assert_not_called()

    def test_enabled_scanning_requires_local_valid_configuration(self):
        for settings in ({'APP_DOCUMENT_SCAN_ENABLED': 'invalid'},
                         {'APP_DOCUMENT_SCAN_ENABLED': 'true', 'APP_DOCUMENT_SCAN_HOST': 'scanner.example.com'},
                         {'APP_DOCUMENT_SCAN_ENABLED': 'true', 'APP_DOCUMENT_SCAN_PORT': '0'}):
            with patch.dict(os.environ, settings, clear=True), self.assertRaises(ValueError):
                scanner.configuration()

    def test_both_services_use_the_shared_readiness_check(self):
        deployment = SCRIPT.parents[1]
        for name in ('transport-platform-backend.service', 'transport-platform-privacy-maintenance.service'):
            unit = (deployment / name).read_text()
            self.assertIn('ExecStartPre=/usr/bin/python3 /opt/transport-platform/check-document-scanner.py', unit)
            self.assertNotIn('python3 -c', unit)


if __name__ == '__main__':
    unittest.main()
