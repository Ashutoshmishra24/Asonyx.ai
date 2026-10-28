# Firebase Auth development setup

The app code uses Firebase only for Authentication. It does not use Firestore, Storage, Analytics, or any other Firebase product.

## Firebase console

1. Create or select a Firebase project.
2. Add an Android app with package name `com.asonyx.ai` and an iOS app with bundle ID `com.asonyx.ai`.
3. Download `google-services.json` into the repository root and `GoogleService-Info.plist` into the repository root.
4. In **Authentication → Sign-in method**, enable **Phone**, **Email/Password**, and **Google**.
5. Set the Phone Authentication SMS region policy for the countries you want to support.
6. Add the Android development and release SHA-1 and SHA-256 fingerprints to the Firebase Android app, then download a fresh `google-services.json`.
7. Copy the Web client ID from Firebase/Google Cloud OAuth credentials into a root `.env.local` file:

   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=000000000000-example.apps.googleusercontent.com
   ```

## App config

After adding the downloaded files, add these fields to `app.json`:

```json
"ios": {
  "googleServicesFile": "./GoogleService-Info.plist"
},
"android": {
  "googleServicesFile": "./google-services.json"
}
```

The paths are intentionally not enabled before the files exist, because Expo prebuild would otherwise fail immediately.

## Run the native development build

Firebase phone and Google authentication do not work in Expo Go. Rebuild the native app after adding or changing Firebase config:

```bash
npx expo run:android
# or
npx expo run:ios
```

For phone-auth development without sending real SMS messages, configure Firebase Authentication test phone numbers and their fixed test codes in the Firebase console. The app itself contains no bypass OTP or fake password.
