import type { UserProfile } from "../types/profile";
import { uploadDataUrlToStorage, initFirebase } from "./firebaseClient";

const PROFILE_STORAGE_PREFIX = "the-scene-profile-";
const PROFILE_COMPLETE_KEY = "the-scene-profile-complete";

async function useFirestoreSave(userId: string, profile: UserProfile) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");

  const { firestore } = client as any;
  const { doc, setDoc } = await import("firebase/firestore");
  const ref = doc(firestore, "profiles", userId);
  await setDoc(ref, profile);
}

async function useFirestoreFetch(userId: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");

  const { firestore } = client as any;
  const { doc, getDoc } = await import("firebase/firestore");
  const ref = doc(firestore, "profiles", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  if (!userId) throw new Error("User ID is required to save a profile.");

  // If images are data URLs and firebase is configured, upload them to Storage
  try {
    const firebaseAvailable = !!import.meta.env.VITE_FIREBASE_API_KEY;
    if (firebaseAvailable) {
      // upload images if present
      if (profile.profilePhotoUrl && profile.profilePhotoUrl.startsWith("data:")) {
        try {
          const url = await uploadDataUrlToStorage(profile.profilePhotoUrl, `profiles/${userId}/profile.jpg`);
          profile.profilePhotoUrl = url;
        } catch (err) {
          console.warn("upload profile photo failed, keeping data url", err);
        }
      }
      if (profile.coverPhotoUrl && profile.coverPhotoUrl.startsWith("data:")) {
        try {
          const url = await uploadDataUrlToStorage(profile.coverPhotoUrl, `profiles/${userId}/cover.jpg`);
          profile.coverPhotoUrl = url;
        } catch (err) {
          console.warn("upload cover photo failed, keeping data url", err);
        }
      }

      // save to Firestore
      await useFirestoreSave(userId, profile);
      // mark profile complete locally as well
      window.localStorage.setItem(PROFILE_COMPLETE_KEY, "true");
      return;
    }
  } catch (err) {
    console.warn("Firebase save path failed, falling back to localStorage", err);
  }

  // Fallback: localStorage
  try {
    const data = JSON.stringify(profile);
    window.localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${userId}`, data);
    window.localStorage.setItem(PROFILE_COMPLETE_KEY, "true");
    return;
  } catch (err) {
    console.error("saveUserProfile error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to save profile: ${msg}`);
  }
}

export async function fetchUserProfile(userId: string) {
  if (!userId) return null;

  try {
    const firebaseAvailable = !!import.meta.env.VITE_FIREBASE_API_KEY;
    if (firebaseAvailable) {
      try {
        const p = await useFirestoreFetch(userId);
        if (p) return p;
      } catch (err) {
        console.warn("Firestore fetch failed, falling back to localStorage", err);
      }
    }
  } catch (err) {
    console.warn(err);
  }

  const raw = window.localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}
