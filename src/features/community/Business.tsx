import { useEffect, useState, type FormEvent } from "react";
import {
  applyForBusiness,
  BUSINESS_KINDS,
  closeListing,
  createListing,
  getMyBusiness,
  LISTING_CATEGORIES,
  listMyListings,
  type Business,
  type BusinessKind,
  type Listing,
  type ListingCategory,
} from "../../services/opportunities";
import { Shell } from "./ui";
import { buttonStyle, cardStyle, inputStyle, primaryButtonStyle } from "./styles";

const STATUS_TEXT: Record<string, string> = {
  pending: "Waiting for review",
  approved: "Live",
  rejected: "Not approved",
  closed: "Closed",
};

export default function BusinessPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<BusinessKind>("Production company");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("Acting");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [compensation, setCompensation] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mine = await getMyBusiness();
      const items = mine?.status === "approved" ? await listMyListings() : [];
      if (cancelled) return;
      setBusiness(mine);
      setListings(items);
      setLoading(false);
    })().catch((loadError: unknown) => {
      console.error("Business load error:", loadError);
      if (cancelled) return;
      setError("We couldn't load your business account. Try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = () => {
    setLoading(true);
    setError("");
    setAttempt((count) => count + 1);
  };

  const apply = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await applyForBusiness({ name, kind, website, description });
      reload();
    } catch (applyError) {
      console.error("Business apply error:", applyError);
      setFormError("We couldn't submit that. Use a name (2+ characters), a description (10+), and a link starting with http(s)://.");
    } finally {
      setSaving(false);
    }
  };

  const post = async (event: FormEvent) => {
    event.preventDefault();
    if (!business) return;
    setFormError("");
    setSaving(true);
    try {
      await createListing(business.name, { title, category, description: details, location, compensation });
      setTitle("");
      setDetails("");
      setLocation("");
      setCompensation("");
      reload();
    } catch (postError) {
      console.error("Listing post error:", postError);
      setFormError("We couldn't submit that listing. Use a title (3+ characters) and details (10+).");
    } finally {
      setSaving(false);
    }
  };

  const close = async (listingId: string) => {
    try {
      await closeListing(listingId);
      reload();
    } catch (closeError) {
      console.error("Listing close error:", closeError);
      setError("We couldn't close that listing. Try again.");
    }
  };

  return (
    <Shell title="For businesses" active="jobs">
      {loading && <p role="status">Loading…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" style={buttonStyle} onClick={reload}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && !business && (
        <form onSubmit={apply} style={{ ...cardStyle, gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Apply for a business account</h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
            Labels, agencies, studios, and production companies can post casting calls and jobs. We review every
            application by hand before anything goes live. Paid plans are not open yet, so there is no charge.
          </p>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Business name
            <input style={inputStyle} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Type
            <select style={inputStyle} value={kind} onChange={(event) => setKind(event.target.value as BusinessKind)}>
              {BUSINESS_KINDS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Website or social link (optional)
            <input style={inputStyle} value={website} maxLength={200} placeholder="https://" onChange={(event) => setWebsite(event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            About your business
            <textarea style={{ ...inputStyle, minHeight: 90 }} value={description} maxLength={600} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          {formError && <p role="alert" style={{ margin: 0, fontSize: 13 }}>{formError}</p>}
          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}
      {business && business.status !== "approved" && (
        <section style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 17 }}>{business.name}</h2>
          <p style={{ margin: 0, fontSize: 14 }}>
            {business.status === "pending"
              ? "Your application is waiting for review. You'll be able to post listings once it's approved."
              : "This application wasn't approved, so you can't post listings with this account."}
          </p>
        </section>
      )}
      {business?.status === "approved" && (
        <>
          <form onSubmit={post} style={{ ...cardStyle, gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Post an opportunity for {business.name}</h2>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Listings are reviewed before they appear. Never ask applicants to pay.
            </p>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Title
              <input style={inputStyle} value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Category
              <select style={inputStyle} value={category} onChange={(event) => setCategory(event.target.value as ListingCategory)}>
                {LISTING_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Details
              <textarea style={{ ...inputStyle, minHeight: 100 }} value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} required />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Location (optional)
              <input style={inputStyle} value={location} maxLength={80} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Pay (optional)
              <input style={inputStyle} value={compensation} maxLength={120} onChange={(event) => setCompensation(event.target.value)} />
            </label>
            {formError && <p role="alert" style={{ margin: 0, fontSize: 13 }}>{formError}</p>}
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </form>
          <h2 style={{ margin: "6px 0 0", fontSize: 17 }}>Your listings</h2>
          {listings.length === 0 && <p style={{ opacity: 0.8 }}>You haven't posted anything yet.</p>}
          {listings.map((item) => (
            <article key={item.id} style={cardStyle}>
              <strong>{item.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{STATUS_TEXT[item.status]}</span>
              {item.status !== "closed" && item.status !== "rejected" && (
                <button type="button" style={buttonStyle} onClick={() => void close(item.id)}>
                  Close listing
                </button>
              )}
            </article>
          ))}
        </>
      )}
    </Shell>
  );
}
