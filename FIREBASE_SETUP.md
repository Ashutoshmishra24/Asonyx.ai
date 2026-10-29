# Firebase Authentication setup

The app uses the Firebase JavaScript SDK for email/password authentication, which works in Expo Go. Google sign-in and phone OTP are not currently included. A clearly labelled demo-mode button opens the UI without authentication for event demonstrations.

## Firebase Console

1. Create or select a Firebase project.
2. Register a Firebase **Web app** and copy its public configuration into `.env.local` using `.env.example` as the template.
3. Under **Authentication → Sign-in method**, enable **Email/Password**.

## Local files

Copy the template and fill in your own values:

```bash
cp .env.example .env.local
```

`.env.local`, `google-services.json`, and `GoogleService-Info.plist` are ignored by Git. The two platform Firebase files are not used by the current JavaScript-only authentication implementation, but remain ignored in case native Firebase is added later.

## Run

```bash
npm install
npm start
```

`npm start` is pinned to Expo Go mode. The Expo Go app installed on the phone must support the same Expo SDK version as the project.
