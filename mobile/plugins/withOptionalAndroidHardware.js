const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = ['android.hardware.screen.portrait', 'android.hardware.wifi'];

function setOptionalHardwareFeatures(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };
  const features = manifest['uses-feature'] || [];
  for (const name of OPTIONAL_FEATURES) {
    const matches = features.filter(feature => feature.$?.['android:name'] === name);
    const feature = matches[0] || { $: { 'android:name': name } };
    feature.$['android:required'] = 'false';
    // A lower-priority library must not turn the optional feature into a requirement.
    const replace = new Set((feature.$['tools:replace'] || '').split(',').map(value => value.trim()).filter(Boolean));
    replace.add('android:required');
    feature.$['tools:replace'] = [...replace].join(',');
    manifest['uses-feature'] = (manifest['uses-feature'] || []).filter(item => item.$?.['android:name'] !== name);
    manifest['uses-feature'].push(feature);
  }
  return androidManifest;
}

module.exports = function withOptionalAndroidHardware(config) {
  return withAndroidManifest(config, modConfig => {
    modConfig.modResults = setOptionalHardwareFeatures(modConfig.modResults);
    return modConfig;
  });
};
module.exports.setOptionalHardwareFeatures = setOptionalHardwareFeatures;
module.exports.OPTIONAL_FEATURES = OPTIONAL_FEATURES;
