import { describe, expect, it } from "vitest";
import { BILLING_LIVE, currentPlanId, formatPrice, hasFeature, PLANS } from "./plans";

describe("plans", () => {
  it("defaults everyone to the free plan with no premium features", () => {
    expect(currentPlanId()).toBe("free");
    expect(hasFeature("free", "advancedSearch")).toBe(false);
  });

  it("gives premium every listed feature", () => {
    expect(hasFeature("premium", "profileAnalytics")).toBe(true);
    expect(PLANS.premium.features.length).toBeGreaterThan(0);
  });

  it("formats prices and keeps billing disabled", () => {
    expect(formatPrice(PLANS.premium)).toBe("$10.99/month");
    expect(formatPrice(PLANS.free)).toBe("$0");
    expect(BILLING_LIVE).toBe(false);
  });
});
