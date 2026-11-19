const { withXcodeProject } = require('expo/config-plugins');

function unquote(value) {
  return typeof value === 'string' ? value.replace(/^["']|["']$/g, '') : value;
}

module.exports = function withIosAutomaticSigning(config) {
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const bundleIdentifier = modConfig.ios?.bundleIdentifier;
    const teamId = modConfig.ios?.appleTeamId;
    const applicationTargets = Object.entries(project.pbxNativeTargetSection())
      .filter(([, target]) =>
        target?.isa === 'PBXNativeTarget' &&
        unquote(target.productType) === 'com.apple.product-type.application',
      )
      .map(([targetId]) => targetId);

    if (!bundleIdentifier || applicationTargets.length === 0) {
      throw new Error('Unable to identify the iOS app target for signing configuration.');
    }

    let updatedConfigurations = 0;
    for (const { buildSettings, name } of Object.values(project.pbxXCBuildConfigurationSection())) {
      if (!buildSettings) {
        continue;
      }
      delete buildSettings['CODE_SIGN_IDENTITY[sdk=iphoneos*]'];
      if (unquote(buildSettings?.PRODUCT_BUNDLE_IDENTIFIER) !== bundleIdentifier) {
        continue;
      }

      buildSettings.CODE_SIGN_STYLE = 'Automatic';
      const codeSignIdentity = unquote(name) === 'Debug'
        ? '"Apple Development"'
        : '"Apple Distribution"';
      buildSettings.CODE_SIGN_IDENTITY = codeSignIdentity;
      for (const key of [
        'PROVISIONING_PROFILE',
        'PROVISIONING_PROFILE_SPECIFIER',
        'PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]',
      ]) {
        delete buildSettings[key];
      }
      if (teamId) {
        buildSettings.DEVELOPMENT_TEAM = teamId;
      }
      updatedConfigurations += 1;
    }

    if (updatedConfigurations === 0) {
      throw new Error(`No Xcode build settings found for ${bundleIdentifier}.`);
    }

    for (const projectObject of Object.values(project.pbxProjectSection())) {
      if (projectObject?.isa !== 'PBXProject') {
        continue;
      }
      const targetAttributes = projectObject.attributes?.TargetAttributes;
      if (!targetAttributes) {
        continue;
      }
      for (const targetId of applicationTargets) {
        const attributes = targetAttributes[targetId] || (targetAttributes[targetId] = {});
        attributes.ProvisioningStyle = 'Automatic';
        if (teamId) {
          attributes.DevelopmentTeam = teamId;
        }
      }
    }

    return modConfig;
  });
};
