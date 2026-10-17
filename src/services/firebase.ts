import { entertainmentRoles, type EntertainmentCategory } from "../data/entertainmentRoles";
import type {
  GenderOption,
  LookingForOption,
  SocialMediaLinks,
  UserProfile,
} from "../types/profile";
import { normalizeProfileUrl, validateUserProfile } from "../features/auth/validation";
import { initFirebase } from "./firebaseClient";

const PROFILE_STORAGE_PREFIX = "the-scene-profile-";
const genders: readonly GenderOption[] = ["Male", "Female", "Non-binary", "Prefer not to say"];
const lookingForOptions: readonly LookingForOption[] = ["Friends", "Networking", "Relationship"];
const socialMediaKeys = ["instagram", "tiktok", "youtube", "twitter", "website"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntertainmentCategory(value: string): value is EntertainmentCategory {
  return Object.hasOwn(entertainmentRoles, value);
}

function isGenderOption(value: unknown): value is GenderOption {
  return typeof value === "string" && genders.some((gender) => gender === value);
}

function isLookingForOption(value: unknown): value is LookingForOption {
  return typeof value === "string" && lookingForOptions.some((option) => option === value);
}

function safeStoredImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return normalizeProfileUrl(value);
  } catch {
    return undefined;
  }
}

function normalizeStoredProfile(value: unknown, userId: string): UserProfile {
  const data = isRecord(value) ? value : {};
  const rawCategory = typeof data.entertainmentCategory === "string" ? data.entertainmentCategory : "";
  const socialData = isRecord(data.socialMedia) ? data.socialMedia : {};
  const socialMedia: SocialMediaLinks = {};

  for (const key of socialMediaKeys) {
    if (typeof socialData[key] === "string") socialMedia[key] = socialData[key];
  }

  return {
    userId,
    displayName: typeof data.displayName === "string" ? data.displayName : typeof data.nickname === "string" ? data.nickname : "",
    nickname: typeof data.nickname === "string" ? data.nickname : undefined,
    gender: isGenderOption(data.gender)
      ? data.gender
      : "Prefer not to say",
    entertainmentCategory: isEntertainmentCategory(rawCategory) ? rawCategory : undefined,
    roles: Array.isArray(data.roles)
      ? data.roles.filter((role): role is string => typeof role === "string").slice(0, 20)
      : [],
    bio: typeof data.bio === "string" ? data.bio : "",
    stateCode: typeof data.stateCode === "string" ? data.stateCode : undefined,
    city: typeof data.city === "string" ? data.city : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
    portfolioUrl: typeof data.portfolioUrl === "string" ? data.portfolioUrl : "",
    socialMedia,
    lookingFor: Array.isArray(data.lookingFor)
      ? data.lookingFor.filter(isLookingForOption)
      : [],
    createdAt: typeof data.createdAt === "string" && Number.isFinite(Date.parse(data.createdAt))
      ? data.createdAt
      : "",
    profilePhotoUrl: safeStoredImageUrl(data.profilePhotoUrl),
    coverPhotoUrl: safeStoredImageUrl(data.coverPhotoUrl),
  };
}

function normalizeOptionalUrl(value: string | undefined) {
  return value?.trim() ? normalizeProfileUrl(value) : "";
}

async function saveProfileToFirestore(userId: string, profile: UserProfile) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");
  if (client.auth.currentUser?.uid !== userId) {
    throw new Error("You can only save a profile for the signed-in account.");
  }

  const { firestore } = client;
  const { doc, setDoc } = await import("firebase/firestore");
  const ref = doc(firestore, "profiles", userId);
  await setDoc(ref, profile);
}

async function fetchProfileFromFirestore(userId: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");
  if (client.auth.currentUser?.uid !== userId) {
    throw new Error("You can only read the signed-in account's profile.");
  }

  const { firestore } = client;
  const { doc, getDoc } = await import("firebase/firestore");
  const ref = doc(firestore, "profiles", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeStoredProfile(snap.data(), userId);
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  if (!userId) throw new Error("User ID is required to save a profile.");

  const normalizedProfile: UserProfile = {
    ...profile,
    userId,
    displayName: profile.displayName?.trim() || profile.nickname?.trim() || "",
    nickname: profile.nickname?.trim() || undefined,
    bio: profile.bio.trim(),
    stateCode: profile.stateCode?.trim().toUpperCase() ?? "",
    city: profile.city?.trim() ?? "",
    location: profile.location?.trim() ?? "",
    portfolioUrl: normalizeOptionalUrl(profile.portfolioUrl),
    profilePhotoUrl: normalizeOptionalUrl(profile.profilePhotoUrl),
    coverPhotoUrl: normalizeOptionalUrl(profile.coverPhotoUrl),
    socialMedia: {
      instagram: normalizeOptionalUrl(profile.socialMedia?.instagram),
      tiktok: normalizeOptionalUrl(profile.socialMedia?.tiktok),
      youtube: normalizeOptionalUrl(profile.socialMedia?.youtube),
      twitter: normalizeOptionalUrl(profile.socialMedia?.twitter),
      website: normalizeOptionalUrl(profile.socialMedia?.website),
    },
  };
  const validationError = validateUserProfile(normalizedProfile, userId);
  if (validationError) throw new Error(validationError);

  const client = await initFirebase();
  if (client) {
    await saveProfileToFirestore(userId, normalizedProfile);
    return;
  }

  try {
    const data = JSON.stringify(normalizedProfile);
    window.localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${userId}`, data);
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to save profile: ${msg}`, { cause: err });
  }
}

export async function fetchUserProfile(userId: string) {
  if (!userId) throw new Error("User ID is required to load a profile.");

  const client = await initFirebase();
  if (client) return fetchProfileFromFirestore(userId);

  const raw = window.localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return normalizeStoredProfile(JSON.parse(raw) as unknown, userId);
  } catch {
    throw new Error("The saved local profile is invalid and could not be loaded.");
  }
}
