#!/usr/bin/env python3
"""Print connected physical iOS UDIDs from devicectl's JSON output."""
import json
import sys


def connected_devices(payload):
    seen = set()
    for device in payload['result']['devices']:
        properties = device.get('properties', {})
        hardware = properties.get('hardware', device.get('hardwareProperties', {}))
        connection = properties.get('connection', device.get('connectionProperties', {}))
        state = connection.get('state', connection.get('tunnelState'))
        if (hardware.get('reality') != 'physical'
                or hardware.get('platform') != 'iOS'
                or state != 'connected'
                or connection.get('pairingState') != 'paired'):
            continue
        udid = hardware.get('udid')
        if udid and udid not in seen:
            seen.add(udid)
            yield udid


if __name__ == '__main__':
    try:
        print('\n'.join(connected_devices(json.load(sys.stdin))))
    except (KeyError, TypeError, ValueError) as error:
        sys.exit(f'Could not read Xcode device discovery output: {error}')
