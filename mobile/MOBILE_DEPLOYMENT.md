# BeBrilliant Mobile App — Deployment & Execution Guide

This guide documents how to run, test, build, and deploy the **BeBrilliant Mobile App** on physical Android and iOS devices connected to the **Hostinger VPS backend**.

---

## 1. Prerequisites & Stack Architecture

* **Framework**: React Native with Expo SDK 57 (Expo Router v50+)
* **Styling**: NativeWind v4 (Tailwind CSS for React Native)
* **Auth & Data**: Next.js API Gateway (`/api/auth/...`) + Supabase Client (`@supabase/supabase-js`)
* **State & Secure Storage**: `expo-secure-store` for JWT persistence
* **Push Notifications**: Expo Notifications SDK with EAS Project ID (`172bbc8e-e251-490e-95b4-d54ccbc100a4`)
* **Backend VPS**: Hostinger VPS (`89.116.33.188`)
  - **Next.js Web API**: `https://bebrilliant.in` (Port 3010)
  - **Supabase Kong Gateway**: `https://supabase.bebrilliant.in` (Port 8000)

---

## 2. Environment Configuration (`mobile/.env`)

Ensure `mobile/.env` contains valid production or staging endpoints:

```env
# Primary Next.js API & Web App Endpoint
EXPO_PUBLIC_SITE_URL=https://bebrilliant.in

# Supabase API Gateway Endpoint (Kong)
EXPO_PUBLIC_SUPABASE_URL=https://supabase.bebrilliant.in
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI3NjcsImV4cCI6MjA4OTY2ODc2N30.HNfd1KC2BLM-BdMBRa5rNHaZYAzbRwtOacqjuNZuPdI
```

---

## 3. How to Run & Test on Physical Devices

### Method A: Testing via Expo Go (Fastest Development Workflow)

1. **Install Expo Go** on your physical mobile device:
   - Android: Download from Google Play Store.
   - iOS: Download from Apple App Store.

2. **Start Expo Dev Server**:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. **Connect Device**:
   - Open Expo Go app on your phone.
   - Scan the QR code displayed in your terminal.
   - Ensure your phone and computer are on the same Wi-Fi network (or pass `--tunnel` flag if testing across different networks: `npx expo start --tunnel`).

---

### Method B: Generating a Standalone Android APK (`.apk` for Direct Installation)

To create an installable `.apk` file for testing directly on Android phones without Expo Go:

1. **Install EAS CLI** (if not installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo Account**:
   ```bash
   eas login
   ```

3. **Build Preview APK**:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
   *EAS will compile the standalone APK in the cloud and provide a direct download link once finished.*

---

### Method C: Production Build for Google Play Store & Apple App Store

1. **Build Android App Bundle (`.aab`)**:
   ```bash
   eas build -p android --profile production
   ```

2. **Build iOS App Store Bundle (`.ipa`)**:
   ```bash
   eas build -p ios --profile production
   ```

3. **Submit to App Stores**:
   ```bash
   eas submit -p android
   eas submit -p ios
   ```

---

## 4. Connectivity & Security Checklist for VPS

| Check | Target Endpoint | Verification Command | Status |
| :--- | :--- | :--- | :--- |
| **Next.js Auth & API** | `https://bebrilliant.in/api/auth/me` | `curl -I https://bebrilliant.in/api/auth/me` | HTTP 200/401 OK |
| **Supabase Gateway** | `https://supabase.bebrilliant.in/rest/v1/` | `curl -I https://supabase.bebrilliant.in/rest/v1/` | HTTP 200/401 OK |
| **Cleartext Policy** | `mobile/app.json` | `"usesCleartextTraffic": true` | Configured |
| **Push Tokens** | `/api/mobile/push-token` | POST request with Expo Push Token | Supported |

---

## 5. Troubleshooting Mobile Connection Issues

* **Error: `Network Request Failed` when tapping Login**:
  - Verify `EXPO_PUBLIC_SITE_URL` in `mobile/.env` is set to `https://bebrilliant.in` (NOT port 3000 or port 8001).
  - Verify your mobile phone has active internet access.

* **Error: `Supabase URL must start with http/https`**:
  - Ensure `EXPO_PUBLIC_SUPABASE_URL` is defined in `mobile/.env` and loaded by Metro bundler.

* **Expo Push Tokens Warning on Simulator**:
  - Push notifications require a physical device. Simulators do not return valid Expo Push Tokens.
