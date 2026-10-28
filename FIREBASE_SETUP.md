# Firebase Authentication setup

The app uses the Firebase JavaScript SDK for Authentication. Email/password works in Expo Go. Google uses Expo AuthSession and a browser OAuth flow, which requires an installed development or production build for a reliable mobile redirect. Phone OTP is not currently included.

## Firebase Console

1. Create or select a Firebase project.
2. Register a Firebase **Web app** and copy its public configuration into `.env.local` using `.env.example` as the template.
3. Under **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
4. Set the Google provider support email and save it.

## Google OAuth clients

Set these environment variables:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=000000000000-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=000000000000-android.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=000000000000-ios.apps.googleusercontent.com
```

- The web client comes from **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**.
- The Android client must use package `com.asonyx.ai` plus the development/release SHA-1 certificate.
- The iOS client must use bundle ID `com.asonyx.ai`.

The web ID is enough for Google authentication on Expo Web. Installed Android/iOS builds require their corresponding platform client IDs.

## Local files

Copy the template and fill in your own values:

```bash
cp .env.example .env.local
```

`.env.local`, `google-services.json`, and `GoogleService-Info.plist` are ignored by Git. The two platform Firebase files are not used by the current JavaScript-only authentication implementation, but remain ignored in case native Firebase is added later.

## Run

Email/password in Expo Go:

```bash
npm install
npm start
```

Google browser OAuth on a mobile device requires a development build so the callback can return to the application-specific URI scheme.

For Android:

```bash
npx expo run:android
```

For iOS on macOS:

```bash
npx expo run:ios
```

Rebuild after changing the application scheme, package/bundle identifiers, or OAuth native client configuration.
