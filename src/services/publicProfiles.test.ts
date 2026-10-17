import { describe, expect, it } from "vitest";
import { buildPublicProfile, normalizePublicProfile } from "./publicProfiles";
import type { UserProfile } from "../types/profile";

const profile: UserProfile = {
  userId: "u1",
  displayName: " Nova ",
  gender: "Female",
  entertainmentCategory: "Music",
  roles: ["Producer"],
  bio: " Makes beats. ",
  stateCode: "ny",
  city: " Brooklyn ",
  location: "Brooklyn, NY",
  portfolioUrl: "https://example.com/",
  socialMedia: { instagram: "https://instagram.com/nova" },
  lookingFor: ["Networking"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("buildPublicProfile", () => {
  it("keeps only fields that are safe to share", () => {
    const result = buildPublicProfile(profile, "u1", true);
    expect(result).toEqual({
      userId: "u1",
      displayName: "Nova",
      entertainmentCategory: "Music",
      roles: ["Producer"],
      bio: "Makes beats.",
      stateCode: "NY",
      city: "Brooklyn",
      lookingFor: ["Networking"],
      discoverable: true,
      shared: ["bio", "location", "lookingFor"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result).not.toHaveProperty("gender");
    expect(result).not.toHaveProperty("socialMedia");
    expect(result).not.toHaveProperty("portfolioUrl");
    expect(result).not.toHaveProperty("location");
  });

  it("blanks fields the owner does not share and includes links only when shared", () => {
    const hidden = buildPublicProfile(profile, "u1", true, []);
    expect(hidden).toMatchObject({ bio: "", city: "", lookingFor: [], shared: [] });
    expect(hidden).not.toHaveProperty("links");

    const withLinks = buildPublicProfile(profile, "u1", true, ["links"]);
    expect(withLinks.links?.portfolioUrl).toBe("https://example.com/");
    expect(withLinks.links?.socialMedia.instagram).toBe("https://instagram.com/nova");
    expect(withLinks.bio).toBe("");
  });

  it("includes a photo only when present and requires a category", () => {
    expect(buildPublicProfile({ ...profile, profilePhotoUrl: "https://example.com/a.png" }, "u1", false)).toMatchObject({
      profilePhotoUrl: "https://example.com/a.png",
      discoverable: false,
    });
    expect(() => buildPublicProfile({ ...profile, entertainmentCategory: undefined }, "u1", true)).toThrow();
  });
});

describe("normalizePublicProfile", () => {
  it("rejects hidden or malformed documents and sanitizes the rest", () => {
    expect(normalizePublicProfile({ discoverable: false, entertainmentCategory: "Music" }, "u2")).toBeNull();
    expect(normalizePublicProfile({ discoverable: true, entertainmentCategory: "Nope" }, "u2")).toBeNull();
    expect(
      normalizePublicProfile(
        {
          discoverable: true,
          entertainmentCategory: "Music",
          displayName: "Kai",
          roles: ["DJ", 5],
          lookingFor: ["Friends", "Marriage"],
          profilePhotoUrl: "javascript:alert(1)",
        },
        "u2",
      ),
    ).toMatchObject({ userId: "u2", displayName: "Kai", roles: ["DJ"], lookingFor: ["Friends"], bio: "" });
  });
});
