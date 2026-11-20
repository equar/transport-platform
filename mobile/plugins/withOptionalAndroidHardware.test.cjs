const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setOptionalHardwareFeatures, OPTIONAL_FEATURES } = require('./withOptionalAndroidHardware');

test('adds explicit optional declarations without changing permissions or orientation', () => {
  const manifest = { manifest: { $: {}, 'uses-permission': [{ $: { 'android:name': 'android.permission.ACCESS_WIFI_STATE' } }], application: [{ activity: [{ $: { 'android:screenOrientation': 'portrait' } }] }] } };
  setOptionalHardwareFeatures(manifest);
  for (const name of OPTIONAL_FEATURES) assert.equal(manifest.manifest['uses-feature'].find(item => item.$['android:name'] === name).$['android:required'], 'false');
  assert.equal(manifest.manifest.application[0].activity[0].$['android:screenOrientation'], 'portrait');
  assert.equal(manifest.manifest['uses-permission'][0].$['android:name'], 'android.permission.ACCESS_WIFI_STATE');
});
test('overrides existing requirements, removes duplicate declarations and survives repeated prebuilds', () => {
  const manifest = { manifest: { 'uses-feature': [
    { $: { 'android:name': 'android.hardware.wifi', 'android:required': 'true' } },
    { $: { 'android:name': 'android.hardware.wifi' } },
    { $: { 'android:name': 'android.hardware.camera', 'android:required': 'false' } },
  ] } };
  setOptionalHardwareFeatures(manifest);
  const first = JSON.stringify(manifest);
  setOptionalHardwareFeatures(manifest);
  assert.equal(JSON.stringify(manifest), first);
  assert.equal(manifest.manifest['uses-feature'].length, 3);
  assert.equal(manifest.manifest['uses-feature'].find(item => item.$['android:name'] === 'android.hardware.wifi').$['tools:replace'], 'android:required');
});
test('release guard rejects restrictive manifests and accepts a synchronized manifest', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { spawnSync } = require('node:child_process');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'transport-manifest-test-'));
  const manifestPath = path.join(directory, 'AndroidManifest.xml');
  const script = path.resolve(__dirname, '../scripts/sync-android-hardware-features.cjs');
  try {
    fs.writeFileSync(manifestPath, '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-feature android:name="android.hardware.wifi" android:required="true"/><application><activity android:name=".MainActivity" android:screenOrientation="portrait"/></application></manifest>');
    assert.equal(spawnSync(process.execPath, [script, '--check', manifestPath]).status, 1);
    assert.equal(spawnSync(process.execPath, [script, manifestPath]).status, 0);
    assert.equal(spawnSync(process.execPath, [script, '--check', manifestPath]).status, 0);
    assert.match(fs.readFileSync(manifestPath, 'utf8'), /android:screenOrientation="portrait"/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
