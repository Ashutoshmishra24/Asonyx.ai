# Asonyx AI

An Expo Router mobile app for the Asonyx smart-helmet experience. It includes helmet and document interfaces, settings and support screens, plan previews, and Firebase Authentication.

## Authentication

- Email/password account creation and sign-in use the Firebase JavaScript SDK.
- Google Sign-In uses browser OAuth through Expo AuthSession, then signs into Firebase with the returned Google ID token.
- Phone OTP is not currently included.
- Firebase is not used for Firestore, Storage, Analytics, or Cloud Functions.

Email/password works in Expo Go. Google OAuth requires a development or production build on mobile because Expo Go cannot provide the application-specific OAuth callback scheme.

## Requirements

- Node.js and npm
- Expo Go for UI and email/password development
- A Firebase project with Email/Password and Google providers enabled
- Android Studio or EAS Build for Android development builds
- Xcode on macOS or EAS Build for iOS development builds

## Installation

```bash
git clone https://github.com/Ashutoshmishra24/Asonyx.ai.git
cd Asonyx.ai
npm install
cp .env.example .env.local
```

Fill `.env.local` with the Firebase Web app configuration and Google OAuth client IDs. Detailed instructions are in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Run with Expo Go

```bash
npm start
```

Scan the QR code with Expo Go. In this mode, the application UI and Firebase email/password authentication can be tested. Test Google OAuth in a development build.

## Development builds

Android:

```bash
npx expo run:android
```

iOS on macOS:

```bash
npx expo run:ios
```

The application identifiers are:

```text
Android package: com.asonyx.ai
iOS bundle ID:   com.asonyx.ai
URI scheme:      asonyxai
```

Generated `android/` and `ios/` directories are ignored. Configure native behavior through `app.json` and Expo config plugins.

## Environment and Firebase files

The following local configuration files are ignored and must not be committed:

```text
.env
.env.*
google-services.json
GoogleService-Info.plist
```

`.env.example` contains safe placeholders and is committed as the setup template. Never commit service-account credentials, OAuth client secrets, signing keys, or private keys.

## Checks

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
```

## Current scope

The Document Vault stores imported files in the app's private on-device storage. Payment processing, live helmet Bluetooth/sensor integration, SOS dispatch, voice services, and plan billing remain UI previews or local interactions unless explicitly connected later.
