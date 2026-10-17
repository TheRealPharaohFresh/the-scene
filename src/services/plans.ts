// Plan definitions and feature gating. Prices are test hypotheses from the roadmap.
// Entitlements must come from a trusted backend once billing exists; until then every
// member is on the free plan and nothing here grants access based on client input.

export type PlanId = "free" | "premium";

export type Feature =
  | "advancedSearch"
  | "profileCustomization"
  | "extendedMessaging"
  | "profileAnalytics"
  | "exclusiveOpportunities";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  features: Feature[];
}

export const FEATURE_LABELS: Record<Feature, string> = {
  advancedSearch: "Advanced talent and professional search",
  profileCustomization: "Enhanced profile customization",
  extendedMessaging: "More networking and messaging features",
  profileAnalytics: "Profile analytics and visibility tools",
  exclusiveOpportunities: "Access to exclusive industry opportunities",
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyUsd: 0,
    tagline: "Discover members, join the community, build your profile.",
    features: [],
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthlyUsd: 10.99,
    tagline: "More tools to get found and get booked.",
    features: [
      "advancedSearch",
      "profileCustomization",
      "extendedMessaging",
      "profileAnalytics",
      "exclusiveOpportunities",
    ],
  },
};

export const BILLING_LIVE = false;

export function currentPlanId(): PlanId {
  return "free";
}

export function hasFeature(planId: PlanId, feature: Feature): boolean {
  return PLANS[planId].features.includes(feature);
}

export function formatPrice(plan: Plan): string {
  return plan.priceMonthlyUsd === 0 ? "$0" : `$${plan.priceMonthlyUsd.toFixed(2)}/month`;
}
