# Asonyx AI app preview

Expo Router app for Android and iOS. The app preview uses the declared Expo and UI packages; it does not connect to cloud, payment, Bluetooth, or account services. GPS directions open the device's installed Maps app.

The Document Vault uses Expo's document picker and file system to import PDFs and images into private, persistent app storage on the device. It supports searching, filtering, opening, and deleting those files. Files are not uploaded, and uninstalling the app removes its private storage.

## Run in PowerShell

```powershell
Set-Location 'C:\asonyxnewapp\asonyx'
npm.cmd start
```

Scan the QR code with Expo Go on a compatible device on the same network. Press `a` in the Expo terminal to open an Android emulator. The iOS Simulator requires macOS and Xcode.

The phone camera requests permission when opened, captures still photos only when tapped, and can save them to the local Document Vault. It does not record video or upload images. The sign-in screen is an offline preview: use code `1234`, or password `asonyx123`. These are demo credentials, not secure authentication. Google and X buttons show their brand marks but do not authenticate accounts yet. Payment, SOS dispatch, helmet sensor readings, Bluetooth pairing, voice recording, and support phone details are not live integrations. Plan prices are a UI preview; billing and plan access are not connected. The battery card shows a reading only after supported helmet hardware reports one; it does not invent a percentage.
