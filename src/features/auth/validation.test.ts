import { describe, expect, it } from "vitest";
import { normalizeProfileUrl, validateUserProfile } from "./validation";
import type { UserProfile } from "../../types/profile";

const userId = "user-123";

function validProfile(): UserProfile {
  return {
    userId,
    displayName: "A Creative",
    gender: "Prefer not to say",
    entertainmentCategory: "Music",
    roles: ["Producer"],
    bio: "Creative professional.",
    stateCode: "NY",
    city: "New York",
    portfolioUrl: "",
    socialMedia: { instagram: "" },
    lookingFor: ["Networking"],
    createdAt: new Date().toISOString(),
  };
}

describe("normalizeProfileUrl", () => {
  it("adds HTTPS to a valid host and normalizes the URL", () => {
    expect(normalizeProfileUrl("example.com/portfolio")).toBe("https://example.com/portfolio");
  });

  it.each(["javascript:alert(1)", "ftp://example.com/file", "https://user:pass@example.com"])(
    "rejects unsafe or unsupported URL %s",
    (url) => {
      expect(() => normalizeProfileUrl(url)).toThrow();
    },
  );
});

describe("validateUserProfile", () => {
  it("accepts a complete profile with optional empty links", () => {
    expect(validateUserProfile(validProfile(), userId)).toBeNull();
  });

  it("rejects a profile assigned to another account", () => {
    expect(validateUserProfile(validProfile(), "another-user")).toContain("owner");
  });

  it("rejects roles outside the selected category", () => {
    const profile = validProfile();
    profile.roles = ["Administrator"];
    expect(validateUserProfile(profile, userId)).toContain("roles");
  });

  it("rejects duplicate roles and preferences", () => {
    const duplicateRoleProfile = validProfile();
    duplicateRoleProfile.roles = ["Producer", "Producer"];
    expect(validateUserProfile(duplicateRoleProfile, userId)).toContain("roles");

    const duplicatePreferenceProfile = validProfile();
    duplicatePreferenceProfile.lookingFor = ["Networking", "Networking"];
    expect(validateUserProfile(duplicatePreferenceProfile, userId)).toContain("preferences");
  });

  it("rejects an oversized bio", () => {
    const profile = validProfile();
    profile.bio = "a".repeat(1501);
    expect(validateUserProfile(profile, userId)).toContain("1,500");
  });

  it("rejects state codes outside the supported US states and territories", () => {
    const profile = validProfile();
    profile.stateCode = "ZZ";
    expect(validateUserProfile(profile, userId)).toContain("state or territory");
  });

  it("rejects inline images until Cloud Storage is configured", () => {
    const profile = validProfile();
    profile.profilePhotoUrl = "data:image/png;base64,abc";
    expect(validateUserProfile(profile, userId)).toContain("Cloud Storage");
  });
});
