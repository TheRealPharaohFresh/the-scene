import type { EntertainmentCategory } from "../data/entertainmentRoles";

export type GenderOption = "Male" | "Female" | "Non-binary" | "Prefer not to say";
export type LookingForOption = "Friends" | "Networking" | "Relationship";

export type SocialMediaLinks = {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  website?: string;
};

// Optional fields the owner can choose to share. Nickname, category, roles and
// state are always part of a discoverable profile.
export const SHAREABLE_FIELDS = ["bio", "location", "lookingFor", "links"] as const;
export type ShareableField = (typeof SHAREABLE_FIELDS)[number];

export type PublicLinks = {
  portfolioUrl: string;
  socialMedia: SocialMediaLinks;
};

// Only fields safe to show to other signed-in members. Excludes gender, email,
// exact location text, and any account metadata. Optional fields are blank unless
// listed in `shared`.
export type PublicProfile = {
  userId: string;
  displayName: string;
  entertainmentCategory: EntertainmentCategory;
  roles: string[];
  bio: string;
  stateCode: string;
  city: string;
  lookingFor: LookingForOption[];
  discoverable: boolean;
  shared: ShareableField[];
  links?: PublicLinks;
  createdAt: string;
  profilePhotoUrl?: string;
  photos?: string[];
};

export type UserProfile = {
  userId?: string;
  displayName?: string;
  nickname?: string;
  gender: GenderOption;
  entertainmentCategory?: EntertainmentCategory;
  roles: string[];
  bio: string;
  stateCode?: string;
  city?: string;
  location?: string;
  portfolioUrl: string;
  socialMedia: SocialMediaLinks;
  lookingFor: LookingForOption[];
  createdAt: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  photos?: string[];
};
