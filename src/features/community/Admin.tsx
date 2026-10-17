import { useEffect, useState } from "react";
import {
  dismissReport,
  isAdmin,
  listPendingBusinesses,
  listPendingListings,
  listReports,
  reviewItem,
  type Business,
  type Listing,
  type ReportRecord,
} from "../../services/opportunities";
import { Shell } from "./ui";
import { buttonStyle, cardStyle, formatDate, primaryButtonStyle } from "./styles";

type Queue = { businesses: Business[]; listings: Listing[]; reports: ReportRecord[] };

export default function Admin() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<Queue>({ businesses: [], listings: [], reports: [] });
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await isAdmin())) {
        if (!cancelled) setAllowed(false);
        return;
      }
      const [businesses, listings, reports] = await Promise.all([
        listPendingBusinesses(),
        listPendingListings(),
        listReports(),
      ]);
      if (cancelled) return;
      setQueue({ businesses, listings, reports });
      setAllowed(true);
    })().catch((loadError: unknown) => {
      console.error("Admin load error:", loadError);
      if (!cancelled) setError("We couldn't load the review queue. Try again.");
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const act = async (work: () => Promise<void>) => {
    setError("");
    try {
      await work();
      setAttempt((count) => count + 1);
    } catch (actionError) {
      console.error("Admin action error:", actionError);
      setError("That action failed. Try again.");
    }
  };

  if (allowed === false) {
    return (
      <Shell title="Admin" active="jobs">
        <p role="alert">You don't have access to this page.</p>
      </Shell>
    );
  }

  return (
    <Shell title="Admin review" active="jobs">
      {allowed === null && !error && <p role="status">Loading…</p>}
      {error && <p role="alert">{error}</p>}
      {allowed && (
        <>
          <h2 style={{ margin: 0, fontSize: 17 }}>Business applications ({queue.businesses.length})</h2>
          {queue.businesses.map((item) => (
            <article key={item.id} style={cardStyle}>
              <strong>{item.name}</strong>
              <span style={{ fontSize: 13 }}>{item.kind}</span>
              {item.website && <span style={{ fontSize: 13, wordBreak: "break-all" }}>{item.website}</span>}
              <p style={{ margin: 0, fontSize: 14 }}>{item.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={primaryButtonStyle} onClick={() => void act(() => reviewItem("businesses", item.id, "approved"))}>
                  Approve
                </button>
                <button type="button" style={buttonStyle} onClick={() => void act(() => reviewItem("businesses", item.id, "rejected"))}>
                  Reject
                </button>
              </div>
            </article>
          ))}
          <h2 style={{ margin: "6px 0 0", fontSize: 17 }}>Listings ({queue.listings.length})</h2>
          {queue.listings.map((item) => (
            <article key={item.id} style={cardStyle}>
              <strong>{item.title}</strong>
              <span style={{ fontSize: 13 }}>
                {item.businessName} · {item.category} · {item.location || "No location"} · {item.compensation || "No pay listed"}
              </span>
              <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{item.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={primaryButtonStyle} onClick={() => void act(() => reviewItem("listings", item.id, "approved"))}>
                  Approve
                </button>
                <button type="button" style={buttonStyle} onClick={() => void act(() => reviewItem("listings", item.id, "rejected"))}>
                  Reject
                </button>
              </div>
            </article>
          ))}
          <h2 style={{ margin: "6px 0 0", fontSize: 17 }}>Reports ({queue.reports.length})</h2>
          {queue.reports.map((item) => (
            <article key={item.id} style={cardStyle}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                {item.targetType} · {formatDate(item.createdAt)}
              </span>
              <code style={{ fontSize: 12, wordBreak: "break-all" }}>{item.targetPath}</code>
              <p style={{ margin: 0, fontSize: 14 }}>{item.reason}</p>
              <button type="button" style={buttonStyle} onClick={() => void act(() => dismissReport(item.id))}>
                Dismiss
              </button>
            </article>
          ))}
        </>
      )}
    </Shell>
  );
}
