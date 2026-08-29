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
};
