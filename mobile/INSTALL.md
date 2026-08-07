# Mobile installation

The native application uses Expo SDK 54 with checked-in Android and iOS projects. Run commands from `mobile/`.

## Prerequisites

- Node.js 20 or newer
- Backend running on port 8087
- Android: Android Studio, SDK 35, platform tools, an emulator or USB-debug-enabled device, and JDK 17 or 21
- iOS: macOS, Xcode, CocoaPods, and an installed simulator runtime
- Physical iOS: Apple Development signing identity, Team ID, trusted device, and Developer Mode

Check the local toolchains:

```bash
npm run setup:check
```

Install dependencies and compile native projects:

```bash
npm run setup:android
npm run setup:ios
```

## Choosing a backend: local or AWS

All install scripts accept an `--env local|aws` flag (default `local`) that
selects which backend API URL gets embedded in the build:

- `--env local` — targets a backend running on your machine (or LAN, for
  physical devices).
- `--env aws` — targets the deployed AWS backend
  (`https://transport.bakaroo.com/api` by default, override with
  `AWS_API_BASE_URL`).

An explicit `--api-url <url>` always takes precedence over `--env`.

```bash
# Emulator/simulator against the local backend (default)
npm run android
npm run ios

# Emulator/simulator against the deployed AWS backend
npm run android -- --env aws
npm run ios -- --env aws

# Physical device against your machine's LAN backend
LOCAL_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8087/api npm run android:device -- --env local
LOCAL_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8087/api npm run ios:device -- --env local

# Physical device against the deployed AWS backend
npm run android:device -- --env aws
npm run ios:device -- --env aws
```

## Android emulator

Start an Android Studio emulator, then run:

```bash
npm run android
```

The script automatically uses `http://10.0.2.2:8087/api` for `--env local`
(default) or the AWS backend for `--env aws`, detects the emulator CPU
architecture, builds a standalone APK, installs it, and launches it.

## Physical Android device

The phone and computer must be on the same network. The backend must listen on a non-loopback interface and its CORS/security settings must allow the mobile client.

```bash
LOCAL_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8087/api npm run android:device -- --env local
```

Use `ANDROID_SERIAL=...` or `--serial ...` when several devices are connected.

To build a release against the deployed AWS backend, install it on the connected
physical device, and launch it:

```bash
npm run android:release
```

This command defaults to `--env aws`: it verifies
`https://transport.bakaroo.com/api/actuator/health`, embeds
`https://transport.bakaroo.com/api`, and disables Android cleartext traffic. Set
`AWS_API_BASE_URL` only when deploying the mobile app against another production
HTTPS environment. Pass `--env local` to `android:release` (with
`LOCAL_API_BASE_URL` set) to build a release-signed APK against a local backend
instead. Local release APKs use the debug key unless `TRANSPORT_UPLOAD_*` Gradle
properties are configured; never distribute a debug-signed artifact through an
app store.

## iOS Simulator

```bash
npm run ios
```

The script boots an available simulator when needed, builds a standalone Release
app using `http://127.0.0.1:8087/api` for `--env local` (default) or the AWS
backend for `--env aws`, installs it, and launches it. Set `SIMULATOR_UDID` to
select a specific simulator.

## Physical iPhone or iPad

Connect and trust the device, enable Developer Mode, then run:

```bash
DEVELOPMENT_TEAM=YOUR_TEAM_ID \
LOCAL_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8087/api \
npm run ios:device -- --env local
```

Or against the deployed AWS backend:

```bash
DEVELOPMENT_TEAM=YOUR_TEAM_ID npm run ios:device -- --env aws
```

Set `IOS_DEVICE_UDID` if automatic selection does not choose the intended device. Xcode manages development provisioning automatically. App Store/TestFlight distribution still requires an Archive with the correct distribution profile.

## Local HTTP networking

Local Android builds permit cleartext traffic so a standalone release can reach
a development backend. Production builds should use HTTPS and pass
`-PtransportUsesCleartextTraffic=false` in the release pipeline. iOS permits
local-network access; use an HTTPS API endpoint for production devices.

