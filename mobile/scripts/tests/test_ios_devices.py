import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('ios_devices', Path(__file__).resolve().parents[1] / 'connected-ios-devices.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DeviceDiscoveryTest(unittest.TestCase):
    def device(self, reality='physical', state='connected', pairing='paired'):
        return {'properties': {'hardware': {'reality': reality, 'platform': 'iOS', 'udid': 'phone-1'},
                               'connection': {'state': state, 'pairingState': pairing}}}

    def test_current_output_excludes_simulators_offline_and_unpaired(self):
        devices = [self.device('simulated'), self.device(state='disconnected'),
                   self.device(pairing='unpaired'), self.device(), self.device()]
        self.assertEqual(list(module.connected_devices({'result': {'devices': devices}})), ['phone-1'])

    def test_legacy_xcode_output(self):
        device = {'hardwareProperties': {'reality': 'physical', 'platform': 'iOS', 'udid': 'legacy-phone'},
                  'connectionProperties': {'tunnelState': 'connected', 'pairingState': 'paired'}}
        self.assertEqual(list(module.connected_devices({'result': {'devices': [device]}})), ['legacy-phone'])

    def test_empty_list(self):
        self.assertEqual(list(module.connected_devices({'result': {'devices': []}})), [])
