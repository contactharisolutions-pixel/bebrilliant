# BeBrilliant: Mobile App PWA Migration Implementation Plan
**Document Version:** 1.0  
**Status:** COMPLETED & DEPLOYED  
**Target:** Deprecate & Remove React Native / Expo Native Mobile Architecture and Transition to Unified Mobile Progressive Web Apps (PWAs) with Zero Offline Data Persistence.

---

## 1. Executive Summary & Objective

### 1.1 Objective
Transition the **BeBrilliant** mobile ecosystem from the standalone **Cross-Platform Native (React Native 0.86 / Expo SDK 57 / MVVM)** codebase (`mobile/`) into a modern, responsive, installable **Progressive Web App (PWA)** suite running directly on the existing **Next.js 15 App Router** platform.

### 1.2 Core Constraints & Guiding Principles
1. **Zero Offline Data Persistence ("No Offline Data")**:
   - Academic integrity, live Computer-Based Tests (CBT), anti-cheat telemetry, OMR grading, and fee settlements require real-time server authority.
   - The Service Worker and client storage **must NOT cache API responses, student records, exam questions, or financial data** offline.
   - When the device goes offline or loses connectivity, the app must immediately show a friendly, styled **"Internet Connection Required"** overlay or screen rather than serving stale or compromised cached data.
2. **Multi-Persona Mobile Experience (Student, Teacher, Parent)**:
   - Provide native-app-like ergonomics (bottom navigation tabs, mobile app header, notch/safe-area handling, smooth transitions, pull-to-refresh) for mobile viewports across all three roles.
   - Provide parity for features that previously existed in the mobile app (specifically the Parent Portal UI and mobile bottom bars).
3. **PWA Standalone Installability**:
   - Web App Manifest configured for `display: "standalone"`, splash screens, orientation locks, theme colors, and high-definition icons for iOS and Android home screens.
   - Custom in-app "Install App" triggers (Add to Home Screen banner and iOS Safari guide modal).
4. **Zero Unapproved Fixes**:
   - Strict audit and planning phase first. No code or folder deletions until the user explicitly reviews and approves the execution steps.

---

## 2. Current Architecture vs. Target PWA Architecture

| Dimension | Current Architecture (`mobile/`) | Target PWA Architecture (Next.js 15) |
| :--- | :--- | :--- |
| **Framework & Engine** | React Native 0.86, Expo SDK 57, Metro Bundler | Next.js 15 (App Router, React 19), Turbopack |
| **Distribution** | App Store (`.ipa`), Google Play (`.aab`), APK builds via EAS | Direct install via browser ("Add to Home Screen"), instant OTA updates |
| **Styling** | NativeWind v4 (Tailwind CSS for React Native) | Tailwind CSS v4, Lucide React, Shadcn/Radix primitives |
| **Maintenance Burden** | 2 parallel codebases (Web + Native Mobile) | 1 unified responsive codebase for Web, Tablet, and Mobile |
| **Offline Policy** | Relied on SecureStore & React Query cache | **Strict Zero Offline Data**. Network-only API policy with offline warning screen |
| **Push Notifications** | Expo Notifications (EAS Project ID) | Web Push API (VAPID / Service Worker Push Events) + WhatsApp API |
| **App Shell & Routing**| Expo Router (`app/(student)`, `app/(teacher)`, `app/(parent)`) | Next.js App Router (`/student/*`, `/teacher/*`, `/parent/*`, `/dashboard/*`) |

---

## 3. Feature & Screen Parity Audit (Mobile to Web)

Before removing the `mobile/` directory, all flows present in the native app must be confirmed to have parity in the web platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PARITY AUDIT CHECKLIST                             │
├───────────────────┬───────────────────────────────┬─────────────────────────┤
│ Role              │ Mobile App Feature (`mobile/`)│ Web Platform Parity     │
├───────────────────┼───────────────────────────────┼─────────────────────────┤
│ **Student**       │ • Dashboard & stats summary   │ Available in Web        │
│                   │ • CBT Online Exam Interface   │ Available in Web        │
│                   │ • Study Material Vault        │ Available in Web        │
│                   │ • Weakness / Topic Analytics  │ Available in Web        │
│                   │ • Mobile Bottom Navigation    │ Needs Web Mobile Shell  │
├───────────────────┼───────────────────────────────┼─────────────────────────┤
│ **Teacher**       │ • Dashboard & class summary   │ Available in Web        │
│                   │ • Offline/OMR evaluation hub  │ Available in Web        │
│                   │ • Question paper creator      │ Available in Web        │
│                   │ • Student attendance tracker  │ Available in Web        │
│                   │ • Mobile Bottom Navigation    │ Needs Web Mobile Shell  │
├───────────────────┼───────────────────────────────┼─────────────────────────┤
│ **Parent**        │ • Multi-child switcher        │ Available via API       │
│                   │ • Child academic scorecard    │ Available via API       │
│                   │ • Fee clearance & payment     │ Needs Web UI Viewport   │
│                   │ • Dedicated Parent Dashboard  │ Needs Web Route (`/parent`)│
└───────────────────┴───────────────────────────────┴─────────────────────────┘
```

---

## 4. Phase-by-Phase Implementation Plan

### Phase 1: Progressive Web App (PWA) Foundation & Metadata
*Goal: Enable standard PWA standalone installability across iOS, Android, and Desktop browsers.*

1. **Web App Manifest (`src/app/manifest.ts` or `public/manifest.webmanifest`)**:
   - `name`: "BeBrilliant — Institutional Excellence Platform"
   - `short_name`: "BeBrilliant"
   - `start_url`: `/` (or dynamic role landing page based on session)
   - `display`: `standalone`
   - `background_color`: `#020B18` (matching platform dark theme)
   - `theme_color`: `#020B18`
   - `orientation`: `portrait` (with landscape allowed for CBT exam mode)
   - `icons`:
     - 192x192 PNG (standard)
     - 512x512 PNG (high resolution splash)
     - 512x512 maskable PNG (Android adaptive icon compliance)
   - `shortcuts`: Quick actions for "My Exams", "Attendance", "Parent Portal".

2. **Viewport & Apple Mobile Meta Configuration (`src/app/layout.tsx`)**:
   - Configure Next.js 15 `viewport` export:
     ```ts
     export const viewport: Viewport = {
       width: 'device-width',
       initialScale: 1,
       maximumScale: 1,
       userScalable: false,
       viewportFit: 'cover',
       themeColor: '#020B18',
     }
     ```
   - Add Apple Touch Icons (`apple-touch-icon.png`) and PWA web-app-capable headers:
     - `mobile-web-app-capable: yes`
     - `apple-mobile-web-app-status-bar-style: black-translucent`

---

### Phase 2: Service Worker Architecture — Strict "No Offline Data" Enforcement
*Goal: Support PWA installation and immediate background updates without caching any dynamic user or academic data.*

```
                              HTTP Request
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   Service Worker Proxy    │
                      └─────────────┬─────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
        [API / Data Route]                      [Static Core Shell]
     (/api/*, /dashboard/*, etc.)            (icons, manifest, fonts)
                │                                       │
         Network-Only                       Stale-While-Revalidate
                │                                       │
     ┌──────────┴──────────┐                            │
     │ Is Device Online?   │                            ▼
     ├── YES ──────────────┼───────────► Fetch Fresh Live Data
     │                     │
     └── NO ───────────────┼───────────► Return HTTP 503 / Offline Fallback
                           │             (ZERO Cache / ZERO Stored Exams)
                           ▼
            ┌─────────────────────────────┐
            │   "Connection Required"     │
            │      Full-Screen Modal      │
            └─────────────────────────────┘
```

1. **Caching Strategy Specification (`public/sw.js`)**:
   - **Static Assets Only**: Cache app icons, splash graphics, and web fonts purely to satisfy Chromium PWA installation requirements and enable rapid splash rendering.
   - **Network-Only for ALL Dynamic Routes & APIs**:
     - `/*` data routes, `/api/*`, `/student/*`, `/teacher/*`, `/parent/*`, `/dashboard/*` are strictly **Network-Only**.
     - **No IndexedDB or LocalStorage persistence** for exam questions, marks, student databases, or fee records.
2. **Global Offline Fallback Provider (`src/components/pwa/OfflineGuard.tsx`)**:
   - Listens to `window.addEventListener('online')` and `'offline'`.
   - When connection drops:
     - Freezes interaction on sensitive tasks (e.g. CBT timer pauses with security notice).
     - Displays an elegant, branded overlay: *"Internet Connection Required — Reconnecting to BeBrilliant secure servers..."*
     - Automatically resumes and syncs state the instant `online` fires.
3. **PWA Registration & Installation Banner (`src/components/pwa/PwaInstallPrompt.tsx`)**:
   - Intercepts `beforeinstallprompt` event on Android/Chrome.
   - Detects iOS Safari standalone status (`window.navigator.standalone === false`) to display an intuitive "Tap Share → Add to Home Screen" bottom sheet.

---

### Phase 3: Mobile-First Responsive App Shell for Student, Teacher & Parent
*Goal: Ensure mobile viewports (`< 768px`) deliver a true app-like navigation and interaction experience.*

1. **Safe-Area Inset Handling**:
   - Incorporate `pb-[env(safe-area-inset-bottom)]` and `pt-[env(safe-area-inset-top)]` in layouts to avoid clash with iOS home indicators and Android navigation bars.
2. **Mobile Bottom Navigation Bar Component (`src/components/mobile/MobileBottomNav.tsx`)**:
   - Renders on mobile screens for authenticated users according to their active role:
     - **Student**: Home / Dashboard, My Exams, Study Material, Performance Analytics, Profile.
     - **Teacher**: Dashboard, OMR / Evaluation, Exam Hub, Students, Profile.
     - **Parent**: Home, Child Switcher, Report Card, Fee Payments, Profile.
3. **Dedicated Web Parent Portal Route (`src/app/parent/page.tsx` & `/dashboard/parent/*`)**:
   - Build responsive web views for the Parent Companion portal:
     - Multi-child switcher dropdown.
     - Subject-wise score breakdown and exam attendance tracker.
     - 1-click Razorpay fee payment integration.

---

### Phase 4: Push Notification Strategy (Web Push API)
*Goal: Replace Expo EAS Push Notifications with standard Web Push notifications.*

1. **VAPID Key Pair Setup**:
   - Configure Web Push server-side keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
2. **Service Worker Push Listener**:
   - Implement `self.addEventListener('push', ...)` and `notificationclick` in `sw.js` for exam schedule reminders, report card publications, and fee receipts.
3. **Omnichannel Fallback**:
   - Retain BeBrilliant's existing automated WhatsApp Cloud API notifications as the primary delivery channel for parents and teachers.

---

### Phase 5: Decommissioning & Removal of Native Expo Mobile Codebase
*Goal: Cleanly eliminate the redundant React Native / Expo repository and build configurations without leaving dead references.*

> [!CAUTION]
> **Safety Guard**: These actions will only be initiated after Phases 1–4 are validated and explicit user approval is granted.

1. **Archive / Snapshot Creation**:
   - Create a compressed backup of `d:\MyProjects\BeBrilliant\mobile\` to ensure no historical native assets or algorithms are lost.
2. **Directory Deletion**:
   - Delete `d:\MyProjects\BeBrilliant\mobile\` (including `android/`, `app/`, `contexts/`, `eas.json`, `app.json`, `package.json`).
3. **Documentation & Config Cleanup**:
   - Update `docs/PLATFORM_FEATURE_AUDIT.md` to reflect that the mobile ecosystem is delivered via unified responsive PWA.
   - Remove Expo EAS deployment instructions from `mobile/MOBILE_DEPLOYMENT.md` or replace with PWA deployment guide.
   - Clean up any unused root dependencies or scripts referencing Expo.

---

## 5. Verification & Acceptance Testing Protocol

| Test Case | Method | Expected Result |
| :--- | :--- | :--- |
| **PWA Installability** | Run Chrome DevTools Lighthouse Audit on `/` and `/student/dashboard` | 100% PWA installable score; Web App Manifest recognized; Valid icons detected. |
| **No Offline Data Check** | Open DevTools Application tab → Storage → Cache Storage & IndexedDB; simulate offline mode in Network tab. | **Zero** exam questions, student profiles, or API payloads cached. Clean offline fallback screen is shown immediately. |
| **iOS Add to Home Screen** | Open Safari on iOS device; tap "Add to Home Screen"; launch from home screen. | Opens in standalone window (no Safari address bar/navigation tabs); correct splash background and status bar. |
| **Android Chrome Install** | Open Chrome on Android; click custom "Install BeBrilliant App" button. | Native installation prompt appears; adds standalone icon to Android app drawer. |
| **Multi-Role UX Test** | Log in as Student, Teacher, Parent on mobile viewport (`390px` width). | Bottom navigation bar displays appropriate role shortcuts; touch targets ≥ 48px; no horizontal overflow. |
| **Exam Anti-Cheat Integrity** | Start online CBT test and simulate network disconnection. | Test pauses securely with alert; zero client-side manipulation permitted; resumes on reconnection. |

---

## 6. Execution Decision Gates (User Approval Required)

Please review the above plan. Before executing any phase, please indicate your preferences or approve the plan to proceed:

1. **Gate 1**: Approve Phase 1 & 2 (PWA Manifest, No-Offline Service Worker, and Offline Guard).
2. **Gate 2**: Approve Phase 3 (Mobile Shell Bottom Navigation & Parent Web Portal).
3. **Gate 3**: Approve Phase 5 (Archiving and removing the `mobile/` React Native folder).
