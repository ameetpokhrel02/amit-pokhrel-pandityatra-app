# Android Development Environment Setup

The error you are seeing (`ANDROID_HOME is set to a non-existing path` and `spawn adb ENOENT`) indicates that the Android SDK and Platform Tools are not installed or not found on your system.

## Option 1: Run on Physical Device (Wireless) - Easiest
If you just want to test the app on your phone using the **Expo Go** app:
1. Run `pnpm start` (or `npx expo start`).
2. Scan the QR code with the Expo Go app on your Android phone.
3. You do **not** need the Android SDK for this method.

## Option 2: Fix the Error (For Emulator or USB Debugging)
To run the app on an Emulator or via USB using `pnpm android`, you need to set up the Android development environment.

### 1. Install Java (JDK)
React Native requires Java. Run this command to install OpenJDK 17:
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### 2. Install Android Studio
1. Download Android Studio from: https://developer.android.com/studio
2. Extract the downloaded tar.gz file (e.g., to `/opt` or your home folder).
3. Run `bin/studio.sh` from the extracted folder.
4. Follow the setup wizard. **Important:** Ensure "Android SDK" and "Android SDK Platform" are selected.
5. Note the SDK path shown in the wizard (usually `/home/amit/Android/Sdk`).

### 3. Configure Environment Variables
Once the SDK is installed, add these lines to your shell configuration file (`~/.zshrc` since you are using zsh):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Run this command to apply the changes:
```bash
source ~/.zshrc
```

### 4. Verify Installation
Run these commands to verify everything is working:
```bash
java -version
adb --version
```

If `adb` returns a version number, you can try running your app again with:
```bash
pnpm android
```
