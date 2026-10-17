import { entertainmentRoles } from "../../data/entertainmentRoles";
import { usStates } from "../../data/usStates";
import type { UserProfile } from "../../types/profile";

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
const lookingForOptions = ["Friends", "Networking", "Relationship"];

export function normalizeProfileUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Links must use HTTP or HTTPS.");
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error("Enter a valid website URL.");
  }
}

export function validateUserProfile(profile: UserProfile, userId: string): string | null {
  if (profile.userId && profile.userId !== userId) {
    return "The profile owner does not match the signed-in account.";
  }

  if (profile.displayName && profile.displayName.trim().length > 50) {
    return "Nickname must be 50 characters or fewer.";
  }
  if (profile.nickname && profile.nickname.trim().length > 50) {
    return "Nickname must be 50 characters or fewer.";
  }
  if (!genderOptions.includes(profile.gender)) {
    return "Select a valid gender option.";
  }
  const category = profile.entertainmentCategory;
  if (!category || !Object.hasOwn(entertainmentRoles, category)) {
    return "Select an entertainment category.";
  }
  const validRoles: readonly string[] = entertainmentRoles[category];
  if (
    profile.roles.length > 20 ||
    new Set(profile.roles).size !== profile.roles.length ||
    profile.roles.some((role) => !validRoles.includes(role))
  ) {
    return "Select valid roles for your entertainment category.";
  }
  if (profile.bio.trim().length > 1500) {
    return "Bio must be 1,500 characters or fewer.";
  }
  if (profile.city && profile.city.trim().length > 100) {
    return "City must be 100 characters or fewer.";
  }
  if (profile.location && profile.location.trim().length > 120) {
    return "Location must be 120 characters or fewer.";
  }
  if (profile.stateCode && !usStates.some((state) => state.isoCode === profile.stateCode)) {
    return "Select a valid state or territory.";
  }
  if (
    profile.lookingFor.length > lookingForOptions.length ||
    new Set(profile.lookingFor).size !== profile.lookingFor.length ||
    profile.lookingFor.some((value) => !lookingForOptions.includes(value))
  ) {
    return "Select valid connection preferences.";
  }
  if (profile.createdAt && !Number.isFinite(Date.parse(profile.createdAt))) {
    return "The profile creation date is invalid.";
  }

  const links = [profile.portfolioUrl, ...Object.values(profile.socialMedia ?? {})];
  for (const link of links) {
    if (link) {
      if (link.length > 2048) return "Portfolio and social links must be 2,048 characters or fewer.";
      try {
        normalizeProfileUrl(link);
      } catch {
        return "Enter valid HTTP or HTTPS portfolio and social links.";
      }
    }
  }

  for (const imageUrl of [profile.profilePhotoUrl, profile.coverPhotoUrl]) {
    if (imageUrl) {
      if (/^data:/i.test(imageUrl)) {
        return "Photo uploads are unavailable until Cloud Storage is configured.";
      }
      try {
        normalizeProfileUrl(imageUrl);
      } catch {
        return "Profile and cover photo URLs must use HTTP or HTTPS.";
      }
    }
  }

  return null;
}
