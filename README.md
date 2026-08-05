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
Planned profile features include:
- Profile images
- Bio and background details
- Entertainment categories
- Professional roles
- Portfolio links
- Social connections
- Collaboration goals

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

### Backend (Planned)
- Firebase Authentication
- Firestore Database
- Cloud Storage

### Mobile Expansion
- Capacitor for iOS and Android deployment

---

## ✅ What We Completed So Far

Today’s progress includes:
- Added a first-time profile onboarding flow at `src/features/auth/onboarding/CreateProfile.tsx`
- Built modular shared form controls in `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`, and `src/components/ui/Checkbox.tsx`
- Implemented nickname, gender, entertainment category, dynamic role selection, bio, location, portfolio, social links, and looking-for options
- Added US state and city selection support in the profile form using `country-state-city`
- Added first-login routing logic so new users are redirected to profile setup and returning users go to `/dashboard`
- Added localStorage-based auth stubs in `src/features/auth/authService.ts`
- Updated login and register flows to route the user into onboarding or dashboard based on profile completion
- Added registration error handling to `src/features/auth/Register.tsx`
- Fixed TypeScript syntax and verified compile success

---

## 📂 Current Development Status

Currently built:

✅ React + TypeScript foundation  
✅ Application architecture  
✅ Splash screen experience  
✅ Authentication flow structure  
✅ Registration workflow  
✅ First-login profile onboarding  
✅ Modular shared UI form components  
✅ Local profile state and route guards  
⬜ Firebase backend integration  
⬜ User discovery and matching  
⬜ Messaging system  
⬜ Premium subscription features  

---

## 🎯 Project Goal

The Scene aims to bridge the gap between entertainment networking and modern social connection by creating a platform where creatives can meet, collaborate, and grow together.

---

Built with React + TypeScript.
