const { expo } = require('./app.json');
const fs = require('fs');
const path = require('path');

function getExpoProjectId() {
  const candidate =
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    expo.extra?.eas?.projectId ||
    '';

  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveAndroidGoogleServicesFile() {
  const candidates = [
    process.env.EXPO_ANDROID_GOOGLE_SERVICES_FILE,
    process.env.GOOGLE_SERVICES_JSON,
    './google-services.json',
    './android/app/google-services.json',
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalizedCandidate = candidate.trim();
    if (!normalizedCandidate) {
      continue;
    }

    const absoluteCandidate = path.isAbsolute(normalizedCandidate)
      ? normalizedCandidate
      : path.resolve(__dirname, normalizedCandidate);

    if (fs.existsSync(absoluteCandidate)) {
      return path.relative(__dirname, absoluteCandidate);
    }
  }

  return undefined;
}

function normalizeApiBaseUrl(value) {
  const resolved = (value || '').trim();
  if (!resolved) {
    return 'https://transport.bakaroo.com/api';
  }
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
}

module.exports = () => {
  const googleMapsApiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      expo.extra?.apiBaseUrl ||
      'https://transport.bakaroo.com/api',
  );
  const simulatorSessionStorage =
    (process.env.EXPO_PUBLIC_SIMULATOR_SESSION_STORAGE || '').trim().toLowerCase() === 'true'
      ? 'true'
      : 'false';
  const projectId = getExpoProjectId();
  const androidGoogleServicesFile = resolveAndroidGoogleServicesFile();

  return {
    ...expo,
    ios: {
      ...(expo.ios || {}),
      ...(googleMapsApiKey
        ? {
            config: {
              ...(expo.ios?.config || {}),
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: {
      ...(expo.android || {}),
      ...(androidGoogleServicesFile
        ? { googleServicesFile: androidGoogleServicesFile }
        : {}),
      ...(googleMapsApiKey
        ? {
            config: {
              ...(expo.android?.config || {}),
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    extra: {
      ...(expo.extra || {}),
      apiBaseUrl,
      simulatorSessionStorage,
      eas: {
        ...((expo.extra && expo.extra.eas) || {}),
        ...(projectId ? { projectId } : {}),
      },
    },
  };
};
