import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAdmin,
  LISTING_CATEGORIES,
  listApprovedListings,
  type Listing,
} from "../../services/opportunities";
import { ReportButton, Shell } from "./ui";
import { buttonStyle, cardStyle, formatDate, inputStyle } from "./styles";

export default function Opportunities() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [admin, setAdmin] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [items, adminFlag] = await Promise.all([listApprovedListings(), isAdmin()]);
      if (cancelled) return;
      setListings(items);
      setAdmin(adminFlag);
      setLoading(false);
    })().catch((loadError: unknown) => {
      console.error("Opportunities load error:", loadError);
      if (cancelled) return;
      setError("We couldn't load opportunities. Check your connection and try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const visible = category ? listings.filter((item) => item.category === category) : listings;

  return (
    <Shell title="Opportunities" active="jobs">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        >
          <option value="">All categories</option>
          {LISTING_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="button" style={buttonStyle} onClick={() => navigate("/business")}>
          For businesses
        </button>
        {admin && (
          <button type="button" style={buttonStyle} onClick={() => navigate("/admin")}>
            Admin
          </button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
        Every listing is reviewed before it appears, but be careful: never pay to apply, and report anything that
        looks like a scam.
      </p>
      {loading && <p role="status">Loading opportunities…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              setError("");
              setLoading(true);
              setAttempt((count) => count + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <p style={{ opacity: 0.8 }}>No opportunities posted yet. Check back soon.</p>
      )}
      {visible.map((item) => {
        const open = openId === item.id;
        return (
          <article key={item.id} style={cardStyle}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {item.category} · {formatDate(item.createdAt)}
            </div>
            <h2 style={{ margin: 0, fontSize: 17 }}>{item.title}</h2>
            <div style={{ fontSize: 14 }}>
              {item.businessName}
              {item.location ? ` · ${item.location}` : ""}
            </div>
            {item.compensation && <div style={{ fontSize: 14 }}>Pay: {item.compensation}</div>}
            {open && <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14 }}>{item.description}</p>}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button type="button" style={buttonStyle} onClick={() => setOpenId(open ? null : item.id)}>
                {open ? "Hide details" : "View details"}
              </button>
              <ReportButton targetType="listing" targetPath={`listings/${item.id}`} />
            </div>
          </article>
        );
      })}
    </Shell>
  );
}
