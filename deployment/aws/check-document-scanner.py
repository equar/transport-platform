#!/usr/bin/env python3
"""Bounded, fail-closed ClamD readiness check; never evaluates environment files."""
import argparse
import os
from pathlib import Path
import shlex
import socket
import sys
import time

KEYS = {'APP_DOCUMENT_SCAN_ENABLED', 'APP_DOCUMENT_SCAN_HOST', 'APP_DOCUMENT_SCAN_PORT'}


def configuration(env_file=None):
    values = {} if env_file else dict(os.environ)
    if env_file:
        # Only read scanner keys from the generated systemd EnvironmentFile.
        for line in Path(env_file).read_text().splitlines():
            key, separator, _ = line.partition('=')
            if separator and key in KEYS:
                tokens = shlex.split(line, comments=False)
                if len(tokens) != 1:
                    raise ValueError('Invalid document scanner setting: ' + key)
                values[key] = tokens[0].partition('=')[2]
    if values.get('APP_DOCUMENT_SCAN_ENABLED', 'true').lower() != 'true':
        raise ValueError('Production document scanning must remain enabled.')
    host = values.get('APP_DOCUMENT_SCAN_HOST', '127.0.0.1')
    if host not in ('127.0.0.1', 'localhost', '::1'):
        raise ValueError('Document scanner must use a loopback host.')
    port = int(values.get('APP_DOCUMENT_SCAN_PORT', '3310'))
    if not 1 <= port <= 65535:
        raise ValueError('Document scanner port must be between 1 and 65535.')
    return host, port


def ping(host, port):
    with socket.create_connection((host, port), timeout=3) as connection:
        connection.settimeout(3)
        connection.sendall(b'zPING\0')
        response = bytearray()
        while len(response) < 5:
            block = connection.recv(5 - len(response))
            if not block:
                break
            response.extend(block)
        if response != b'PONG\0':
            raise OSError('Scanner did not return a complete ClamD PONG response.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file')
    args = parser.parse_args()
    try:
        host, port = configuration(args.env_file)
    except (OSError, ValueError) as error:
        print('Document scanner configuration failed: ' + str(error), file=sys.stderr)
        return 1
    for attempt in range(3):
        try:
            ping(host, port)
            print('Document scanner is ready.')
            return 0
        except OSError:
            if attempt < 2:
                time.sleep(1)
    print(f'Document scanner unavailable at {host}:{port}. Start or repair ClamAV clamd, '
          'check its signature database and loopback TCP configuration, then retry deployment. '
          'Document scanning must not be disabled.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
