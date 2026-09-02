# The Scene 🎬🎵

## Connecting Entertainment Creatives

The Scene is a networking and dating platform built specifically for professionals in the entertainment industry. It is designed to help creatives connect, collaborate, network, and build meaningful relationships within the worlds of music, film, television, comedy, gaming, fashion, photography, and other creative fields.

Unlike traditional dating apps, The Scene focuses on the entertainment ecosystem by allowing users to showcase their creative careers, portfolios, skills, and industry experience while connecting with people who share similar passions and goals.

---

## 🚀 Vision

The goal of The Scene is to become a centralized community where entertainment professionals can discover collaborators, industry connections, and potential relationships in a space built around creativity.

Whether you are a producer looking for an artist, a filmmaker looking for talent, a comedian looking for collaborators, or a creative looking for meaningful connections, The Scene brings the entertainment community together.

---

## ✨ Core Features

### Authentication
- User registration and login
- Secure authentication flow structure
- Age verification support
- Protected account routing

### Creative Onboarding
Users can identify their entertainment background and select roles across industries such as:

- Music
- Television
- Film
- Comedy
- Gaming
- Fashion
- Photography
- Theater
- Other creative industries

### Creative Profiles
Implemented and planned profile features include:
- Profile creation onboarding flow
- Bio and entertainment background details
- Entertainment categories and role selection
- Location selection with US state and city support
- Portfolio and social link fields
- Looking-for preferences
- Profile display page and dashboard redirect flow

---

## 🔥 Planned Features

- Creative discovery system
- Matching algorithm
- Swipe-based discovery
- Advanced search filters
- Messaging system
- Profile visitors
- Premium subscription features
- Portfolio showcase
- Industry networking tools

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- CSS

### Backend
- Firebase Authentication
- Firestore Database
- Cloud Storage
- LocalStorage is used only for a small compatibility fallback when Firebase is unavailable

### Mobile Expansion
- Capacitor for iOS and Android deployment

---

## ✅ What We Completed So Far

Current progress includes:
- Added a first-time profile onboarding flow at `src/features/auth/onboarding/CreateProfile.tsx`
- Built the profile display page under `src/features/auth/profile/Profile.tsx`
- Created localStorage-based profile persistence in `src/services/firebase.ts`
- Implemented profile completion gating in `src/features/auth/authService.ts`
- Built modular shared form controls in `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`, and `src/components/ui/Checkbox.tsx`
- Implemented nickname, gender, entertainment category, dynamic role selection, bio, location, portfolio, social links, and looking-for options
- Added US state and city selection support in the profile form using `country-state-city`
- Added first-login routing logic so new users are redirected to profile setup and returning users go to `/dashboard`
- Added registration error handling to `src/features/auth/Register.tsx`
- Replaced prototype authentication with Firebase email/password authentication
- Added Firebase auth-state listeners and singleton Firebase initialization
- Added environment-based Firebase configuration and protected Storage rules
- Added Firestore rules for users, profiles, and guarded future app collections
- Temporarily disabled photo uploads until Cloud Storage is enabled and configured
- Verified lint and production builds

---

## 📂 Current Development Status

Currently built:

✅ React + TypeScript foundation  
✅ Application architecture  
✅ Splash screen experience  
✅ Firebase email/password authentication
✅ Registration workflow  
✅ First-login profile onboarding  
✅ Modular shared UI form components  
✅ Firebase auth-state route guards
✅ Firestore user/profile persistence
⬜ Cloud Storage photo uploads (temporarily unavailable)
⬜ User discovery and matching  
⬜ Messaging system  
⬜ Premium subscription features  

---

## 🎯 Project Goal

The Scene aims to bridge the gap between entertainment networking and modern social connection by creating a platform where creatives can meet, collaborate, and grow together.

---

Built with React + TypeScript.

## Firebase Setup

The app uses Firebase Authentication and Cloud Firestore for its primary account and profile data. Copy the Firebase configuration into a `.env` file at the project root (see `.env.example`). The real `.env` file is ignored by git.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Create the Firebase services

In the Firebase Console for project `the-scene-fddae`:

1. Enable **Authentication → Sign-in method → Email/Password**.
2. Create **Build → Firestore Database** using the **Standard** edition and the default `(default)` database.
3. Choose a database region and keep it consistent with future services where possible.
4. Enable Cloud Storage only when the project is ready for the Blaze billing plan. Photo uploads are currently disabled in the app.

Cloud Firestore creates collections and documents on the first write. The current app writes:

```text
users/{uid}
profiles/{uid}
```

The planned data model includes:

```text
likes/{likeId}
matches/{matchId}
conversations/{conversationId}/messages/{messageId}
notifications/{uid}/items/{notificationId}
subscriptions/{uid}
reports/{reportId}
blocks/{blockId}
```

### Deploy security rules

Install and authenticate with the Firebase CLI, then deploy the Firestore and Storage rules from this repository:

```bash
firebase login
firebase deploy --only firestore,storage --project the-scene-fddae
npm run dev
```

The rules are stored in `firestore.rules` and `storage.rules`. Firestore rules restrict account writes to the authenticated user, while future match, chat, notification, subscription, report, and block data has restrictive defaults until each feature is implemented.

Cloud Storage uses `storage.cors.json` for browser origins. Apply it after installing Google Cloud CLI and creating the Storage bucket:

```bash
gcloud storage buckets update gs://the-scene-fddae.firebasestorage.app --cors-file=storage.cors.json
```

Until Storage is enabled and configured, users can create profiles without profile or cover photos. Photo uploads can be re-enabled later without changing the Firestore profile document shape.
