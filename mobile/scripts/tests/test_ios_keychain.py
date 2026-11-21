import importlib.util
from pathlib import Path
import plistlib
import struct
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'verify-ios-simulator-keychain.py'
spec = importlib.util.spec_from_file_location('ios_keychain', SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def executable(identity=None):
    if identity is None:
        return struct.pack('<8I', 0xfeedfacf, 0x100000c, 0, 2, 0, 0, 0, 0)
    payload = plistlib.dumps({'application-identifier': identity})
    header = struct.pack('<8I', 0xfeedfacf, 0x100000c, 0, 2, 1, 152, 0, 0)
    segment = struct.pack('<II16sQQQQIIII', 0x19, 152, b'__TEXT', 0, 0, 0, 0, 0, 0, 1, 0)
    section = struct.pack('<16s16sQQIIIIIIII', b'__entitlements', b'__TEXT', 0, len(payload), 184, 0, 0, 0, 0, 0, 0, 0)
    return header + segment + section + payload


class SimulatorKeychainTests(unittest.TestCase):
    def verify(self, binary):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory)
            (app / 'Info.plist').write_bytes(plistlib.dumps({'CFBundleIdentifier': 'com.example.test', 'CFBundleExecutable': 'App', 'CFBundleSupportedPlatforms': ['iPhoneSimulator']}))
            (app / 'App').write_bytes(binary)
            checker.verify(app)

    def test_accepts_a_matching_keychain_identity(self):
        self.verify(executable('TEAM.com.example.test'))

    def test_rejects_the_unsigned_build_that_causes_securestore_failure(self):
        with self.assertRaisesRegex(ValueError, 'no embedded'):
            self.verify(executable())

    def test_rejects_another_apps_identity(self):
        with self.assertRaisesRegex(ValueError, 'does not match'):
            self.verify(executable('TEAM.com.example.other'))

    def test_verifies_every_architecture_in_a_universal_app(self):
        good, bad = executable('TEAM.com.example.test'), executable()
        start = 48
        fat = struct.pack('>II', 0xcafebabe, 2)
        fat += struct.pack('>IIIII', 0x100000c, 0, start, len(good), 0)
        fat += struct.pack('>IIIII', 0x1000007, 0, start + len(good), len(bad), 0)
        with self.assertRaisesRegex(ValueError, 'no embedded'):
            self.verify(fat + good + bad)


if __name__ == '__main__':
    unittest.main()
