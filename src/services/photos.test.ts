import { describe, expect, it } from "vitest";
import { fitWithin, photoList, validatePhotoFile } from "./photos";

describe("photos", () => {
  it("scales the longest edge down and keeps small images as they are", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it("accepts only reasonably sized images", () => {
    expect(validatePhotoFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validatePhotoFile({ type: "image/gif", size: 1000 })).toMatch(/JPEG/);
    expect(validatePhotoFile({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(validatePhotoFile({ type: "image/jpeg", size: 0 })).toMatch(/empty/);
  });

  it("lists photos with a legacy profile photo fallback and a 6 photo cap", () => {
    expect(photoList({})).toEqual([]);
    expect(photoList({ profilePhotoUrl: "https://x/a" })).toEqual(["https://x/a"]);
    const many = Array.from({ length: 9 }, (_, index) => `https://x/${index}`);
    expect(photoList({ photos: many, profilePhotoUrl: "https://x/old" })).toHaveLength(6);
  });
});
