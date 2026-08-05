import type { UserProfile } from "../types/profile";

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const PROFILE_STORAGE_PREFIX = "the-scene-profile-";
const PROFILE_COMPLETE_KEY = "the-scene-profile-complete";

export async function saveUserProfile(userId: string, profile: UserProfile) {
  if (!userId) {
    throw new Error("User ID is required to save a profile.");
  }

  window.localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${userId}`, JSON.stringify(profile));
  window.localStorage.setItem(PROFILE_COMPLETE_KEY, "true");

  return Promise.resolve();
}

export async function fetchUserProfile(userId: string) {
  if (!userId) {
    return Promise.resolve<UserProfile | null>(null);
  }

  const raw = window.localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`);
  if (!raw) {
    return Promise.resolve(null);
  }

  try {
    return Promise.resolve(JSON.parse(raw) as UserProfile);
  } catch {
    return Promise.resolve(null);
  }
}
