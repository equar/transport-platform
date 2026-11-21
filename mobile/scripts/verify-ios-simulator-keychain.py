#!/usr/bin/env python3
"""Reject simulator binaries that cannot use the iOS Keychain."""
import plistlib
from pathlib import Path
import struct
import sys


def slices(binary):
    fat = {b'\xca\xfe\xba\xbe': ('>', False), b'\xbe\xba\xfe\xca': ('<', False),
           b'\xca\xfe\xba\xbf': ('>', True), b'\xbf\xba\xfe\xca': ('<', True)}
    if binary[:4] not in fat:
        return [binary]
    endian, wide = fat[binary[:4]]
    count = struct.unpack_from(endian + 'I', binary, 4)[0]
    if not 1 <= count <= 16:
        raise ValueError('Invalid simulator architecture table.')
    result = []
    for index in range(count):
        entry = 8 + index * (32 if wide else 20)
        offset, size = struct.unpack_from(endian + ('QQ' if wide else 'II'), binary, entry + 8)
        if size == 0 or offset + size > len(binary):
            raise ValueError('Invalid simulator architecture range.')
        result.append(binary[offset:offset + size])
    return result


def entitlements(binary):
    if binary[:4] != b'\xcf\xfa\xed\xfe':
        raise ValueError('Expected a 64-bit simulator executable.')
    count = struct.unpack_from('<I', binary, 16)[0]
    cursor = 32
    for _ in range(count):
        command, length = struct.unpack_from('<II', binary, cursor)
        if length < 8 or cursor + length > len(binary):
            raise ValueError('Invalid simulator load command.')
        if command == 0x19:  # LC_SEGMENT_64
            sections = struct.unpack_from('<I', binary, cursor + 64)[0]
            for index in range(sections):
                section = cursor + 72 + index * 80
                if section + 80 > cursor + length:
                    raise ValueError('Invalid simulator section table.')
                name = binary[section:section + 16].rstrip(b'\0')
                if name == b'__entitlements':
                    size = struct.unpack_from('<Q', binary, section + 40)[0]
                    offset = struct.unpack_from('<I', binary, section + 48)[0]
                    if offset + size > len(binary):
                        raise ValueError('Invalid entitlement range.')
                    return plistlib.loads(binary[offset:offset + size].rstrip(b'\0'))
        cursor += length
    raise ValueError('Simulator executable has no embedded Keychain entitlements.')


def verify(app):
    app = Path(app)
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    if 'iPhoneSimulator' not in info.get('CFBundleSupportedPlatforms', []):
        raise ValueError('This check applies only to simulator apps.')
    bundle_id = info['CFBundleIdentifier']
    executable = info['CFBundleExecutable']
    if Path(executable).name != executable:
        raise ValueError('Invalid bundle executable.')
    for binary in slices((app / executable).read_bytes()):
        identity = entitlements(binary).get('application-identifier', '')
        if not isinstance(identity, str) or not (identity == bundle_id or identity.endswith('.' + bundle_id)):
            raise ValueError('Simulator Keychain identity does not match the app bundle.')


if __name__ == '__main__':
    try:
        verify(sys.argv[1])
    except (OSError, ValueError, KeyError, IndexError, struct.error) as error:
        print(f'Simulator Keychain verification failed: {error} Rebuild with npm run ios; do not install an unsigned app.', file=sys.stderr)
        sys.exit(1)
    print('Simulator Keychain entitlements verified for every architecture.')
