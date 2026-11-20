#!/usr/bin/env node
const path = require('node:path');
const { AndroidConfig } = require('expo/config-plugins');
const { OPTIONAL_FEATURES, setOptionalHardwareFeatures } = require('../plugins/withOptionalAndroidHardware');

async function main() {
  const check = process.argv[2] === '--check';
  const file = check ? process.argv[3] : process.argv[2];
  if (check && !file) throw new Error('Pass the merged Android manifest to --check.');
  const manifestPath = file || path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
  const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(manifestPath);
  if (check) {
    for (const name of OPTIONAL_FEATURES) {
      const features = (manifest.manifest['uses-feature'] || []).filter(feature => feature.$?.['android:name'] === name);
      if (features.length !== 1 || features[0].$['android:required'] !== 'false') {
        throw new Error(`Release manifest must declare ${name} exactly once with android:required="false".`);
      }
    }
    console.log('Android portrait and Wi-Fi hardware are optional in the merged manifest.');
  } else {
    await AndroidConfig.Manifest.writeAndroidManifestAsync(manifestPath, setOptionalHardwareFeatures(manifest));
    console.log('Applied optional Android hardware declarations.');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
