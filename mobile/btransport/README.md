# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Android installation and packaging

These commands are intended for the Transport Platform mobile app built with Expo and the Android native project.

### Default production API URL

Release builds must target the production AWS backend and not a local backend deployment.

```bash
export AWS_API_BASE_URL="https://transport.bakaroo.com/api"
```

The installation scripts default to this URL automatically, but you can set it explicitly if needed.

### Install on an Android emulator

```bash
cd mobile
npm run android -- --env aws
```

This installs the app onto a running emulator and points it at the production AWS backend.

For a release-style emulator install:

```bash
cd mobile
npm run android -- --prod --env aws
```

### Install on a physical Android device

```bash
cd mobile
npm run android:device -- --env aws
```

For a local backend (developer-only; not for release builds):

```bash
cd mobile
npm run android:device -- --env local
```

### Build a manual APK for local testing

Local backend testing should target your running local backend instead of the AWS production API.

```bash
cd mobile
npm run android:apk -- --dev --env local --emulator
```

For an explicit custom local backend URL:

```bash
cd mobile
AWS_API_BASE_URL="http://10.0.2.2:8082/api" npm run android:apk -- --dev --env local --emulator
```

For a physical device using a LAN IP instead of localhost:

```bash
cd mobile
LOCAL_API_BASE_URL="http://192.168.1.50:8082/api" npm run android:apk -- --dev --env local --device
```

This produces a debug APK linked to the local backend, which is suitable for local validation.

### Build a manual APK for distribution

```bash
cd mobile
npm run android:apk -- --prod
```

This produces:

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

Manual install to an attached emulator or device:

```bash
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Release build for Play Store or signed distribution

Set the signing environment variables first:

```bash
export TRANSPORT_UPLOAD_STORE_FILE="~/keys/transport-upload.jks"
export TRANSPORT_UPLOAD_STORE_PASSWORD="<store-password>"
export TRANSPORT_UPLOAD_KEY_ALIAS="transport-upload"
export TRANSPORT_UPLOAD_KEY_PASSWORD="<key-password>"
```

Then run:

```bash
cd mobile
npm run android:playstore
```

This runs the release wrapper which validates that the app is pointed at the AWS production backend and enforces the required upload keystore.

### Script options

```bash
cd mobile
npm run android -- --prod --env aws
npm run android -- --dev --env local
npm run android:device -- --prod --env aws
npm run android:device -- --dev --env local
npm run android:apk -- --prod
npm run android:apk -- --dev
npm run android:playstore
```

Notes:

- `--prod` and `--release` are for production-aligned release builds.
- `--dev` and `--debug` are for local developer builds.
- `--env aws` targets the production backend.
- `--env local` targets a local backend and is not allowed for release packaging.
- Release builds reject local backend overrides intentionally to avoid shipping a build that points at localhost.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
