import { entertainmentRoles, type EntertainmentCategory } from "../data/entertainmentRoles";
import {
  SHAREABLE_FIELDS,
  type LookingForOption,
  type PublicLinks,
  type PublicProfile,
  type ShareableField,
  type SocialMediaLinks,
  type UserProfile,
} from "../types/profile";
import { normalizeProfileUrl } from "../features/auth/validation";
import { initFirebase } from "./firebaseClient";
import type { QueryConstraint } from "firebase/firestore";

export const DISCOVERY_PAGE_SIZE = 12;

const lookingForOptions: readonly LookingForOption[] = ["Friends", "Networking", "Relationship"];

export type DiscoveryFilters = {
  category?: EntertainmentCategory | "";
  role?: string;
  stateCode?: string;
  lookingFor?: LookingForOption | "";
};

export type DiscoveryCursor = unknown;

export type DiscoveryPage = {
  profiles: PublicProfile[];
  cursor: DiscoveryCursor | null;
  hasMore: boolean;
};

export const DEFAULT_SHARED_FIELDS: readonly ShareableField[] = ["bio", "location", "lookingFor"];

const socialKeys: readonly (keyof SocialMediaLinks)[] = ["instagram", "tiktok", "youtube", "twitter", "website"];

export function buildPublicProfile(
  profile: UserProfile,
  userId: string,
  discoverable: boolean,
  sharedFields: readonly ShareableField[] = DEFAULT_SHARED_FIELDS,
): PublicProfile {
  if (!profile.entertainmentCategory) throw new Error("An entertainment category is required.");
  const shared = SHAREABLE_FIELDS.filter((field) => sharedFields.includes(field));
  const has = (field: ShareableField) => shared.includes(field);

  const publicProfile: PublicProfile = {
    userId,
    displayName: profile.displayName?.trim() || profile.nickname?.trim() || "",
    entertainmentCategory: profile.entertainmentCategory,
    roles: [...profile.roles],
    bio: has("bio") ? profile.bio.trim() : "",
    stateCode: profile.stateCode?.trim().toUpperCase() ?? "",
    city: has("location") ? (profile.city?.trim() ?? "") : "",
    lookingFor: has("lookingFor") ? [...profile.lookingFor] : [],
    discoverable,
    shared,
    createdAt: profile.createdAt,
  };
  if (has("links")) {
    publicProfile.links = {
      portfolioUrl: profile.portfolioUrl ?? "",
      socialMedia: Object.fromEntries(socialKeys.map((key) => [key, profile.socialMedia?.[key] ?? ""])),
    };
  }
  if (profile.profilePhotoUrl) publicProfile.profilePhotoUrl = profile.profilePhotoUrl;
  if (profile.photos) publicProfile.photos = [...profile.photos];
  return publicProfile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return normalizeProfileUrl(value);
  } catch {
    return undefined;
  }
}

function normalizeLinks(value: unknown): PublicLinks | undefined {
  if (!isRecord(value)) return undefined;
  const social = isRecord(value.socialMedia) ? value.socialMedia : {};
  const socialMedia: SocialMediaLinks = {};
  for (const key of socialKeys) {
    const url = safeUrl(social[key]);
    if (url) socialMedia[key] = url;
  }
  return { portfolioUrl: safeUrl(value.portfolioUrl) ?? "", socialMedia };
}

export function normalizePublicProfile(value: unknown, userId: string): PublicProfile | null {
  if (!isRecord(value) || value.discoverable !== true) return null;
  const category = value.entertainmentCategory;
  if (typeof category !== "string" || !Object.hasOwn(entertainmentRoles, category)) return null;

  const profile: PublicProfile = {
    userId,
    displayName: stringOrEmpty(value.displayName),
    entertainmentCategory: category as EntertainmentCategory,
    roles: Array.isArray(value.roles)
      ? value.roles.filter((role): role is string => typeof role === "string").slice(0, 20)
      : [],
    bio: stringOrEmpty(value.bio),
    stateCode: stringOrEmpty(value.stateCode),
    city: stringOrEmpty(value.city),
    lookingFor: Array.isArray(value.lookingFor)
      ? value.lookingFor.filter((option): option is LookingForOption =>
          lookingForOptions.some((allowed) => allowed === option),
        )
      : [],
    discoverable: true,
    // Documents written before per-field sharing exposed these three fields.
    shared: Array.isArray(value.shared)
      ? SHAREABLE_FIELDS.filter((field) => (value.shared as unknown[]).includes(field))
      : [...DEFAULT_SHARED_FIELDS],
    createdAt: stringOrEmpty(value.createdAt),
  };
  const links = profile.shared.includes("links") ? normalizeLinks(value.links) : undefined;
  if (links) profile.links = links;
  const photo = safeUrl(value.profilePhotoUrl);
  if (photo) profile.profilePhotoUrl = photo;
  if (Array.isArray(value.photos)) {
    profile.photos = value.photos
      .map(safeUrl)
      .filter((url): url is string => Boolean(url))
      .slice(0, 6);
  }
  return profile;
}

export type PublicSettings = { discoverable: boolean; shared: ShareableField[] };

export async function fetchPublicSettings(userId: string): Promise<PublicSettings | null> {
  const client = await initFirebase();
  if (!client) return null;
  const { doc, getDoc } = await import("firebase/firestore");
  const snapshot = await getDoc(doc(client.firestore, "publicProfiles", userId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    discoverable: data.discoverable === true,
    shared: Array.isArray(data.shared)
      ? SHAREABLE_FIELDS.filter((field) => (data.shared as unknown[]).includes(field))
      : [...DEFAULT_SHARED_FIELDS],
  };
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const client = await initFirebase();
  if (!client) throw new Error("Profiles require Firebase to be configured.");
  const { doc, getDoc } = await import("firebase/firestore");
  const snapshot = await getDoc(doc(client.firestore, "publicProfiles", userId));
  return snapshot.exists() ? normalizePublicProfile(snapshot.data(), userId) : null;
}

// Rules cannot filter results, so every query must include discoverable == true.
// Default document-ID ordering keeps paging deterministic without composite indexes;
// the lookingFor filter and self-exclusion run on the client.
export async function searchPublicProfiles(
  filters: DiscoveryFilters,
  currentUserId: string,
  cursor: DiscoveryCursor | null = null,
): Promise<DiscoveryPage> {
  const client = await initFirebase();
  if (!client) throw new Error("Discovery requires Firebase to be configured.");
  if (client.auth.currentUser?.uid !== currentUserId) {
    throw new Error("You must be signed in to browse profiles.");
  }

  const { collection, getDocs, limit, query, startAfter, where } = await import("firebase/firestore");
  const constraints: QueryConstraint[] = [where("discoverable", "==", true)];
  if (filters.category) constraints.push(where("entertainmentCategory", "==", filters.category));
  if (filters.stateCode) constraints.push(where("stateCode", "==", filters.stateCode));
  if (filters.role) constraints.push(where("roles", "array-contains", filters.role));
  if (cursor) constraints.push(startAfter(cursor as Parameters<typeof startAfter>[0]));
  constraints.push(limit(DISCOVERY_PAGE_SIZE));

  const snapshot = await getDocs(query(collection(client.firestore, "publicProfiles"), ...constraints));
  const profiles: PublicProfile[] = [];
  for (const document of snapshot.docs) {
    if (document.id === currentUserId) continue;
    const profile = normalizePublicProfile(document.data(), document.id);
    if (!profile) continue;
    if (filters.lookingFor && !profile.lookingFor.includes(filters.lookingFor)) continue;
    profiles.push(profile);
  }

  return {
    profiles,
    cursor: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === DISCOVERY_PAGE_SIZE,
  };
}
