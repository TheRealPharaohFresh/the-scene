import { useState } from "react";
import { Shell } from "./ui";
import { cardStyle, primaryButtonStyle } from "./styles";
import { BILLING_LIVE, currentPlanId, FEATURE_LABELS, formatPrice, PLANS } from "../../services/plans";

export default function Premium() {
  const current = currentPlanId();
  const [notice, setNotice] = useState("");

  return (
    <Shell title="Premium" active="profile">
      {(["free", "premium"] as const).map((id) => {
        const plan = PLANS[id];
        return (
          <section key={id} style={cardStyle} aria-label={`${plan.name} plan`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{plan.name}</h2>
              <strong>{formatPrice(plan)}</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>{plan.tagline}</p>
            {plan.features.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, display: "grid", gap: 4 }}>
                {plan.features.map((feature) => (
                  <li key={feature}>{FEATURE_LABELS[feature]}</li>
                ))}
              </ul>
            )}
            {id === current ? (
              <span style={{ fontSize: 13, opacity: 0.8 }}>Your current plan</span>
            ) : (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  setNotice(
                    BILLING_LIVE
                      ? ""
                      : "Premium isn't open yet. Payments aren't turned on, so nothing has been charged."
                  )
                }
              >
                Get Premium
              </button>
            )}
          </section>
        );
      })}
      {notice && (
        <p role="status" style={{ margin: 0, fontSize: 14 }}>
          {notice}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
        Paid visibility never guarantees jobs or opportunities. Pricing shown is subject to change before launch.
      </p>
    </Shell>
  );
}
