import PhotoGallery from "../../photos/PhotoGallery";
import { photoList } from "../../../services/photos";
import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUserId } from "../authService";
import { fetchPublicProfile } from "../../../services/publicProfiles";
import { recordSwipe, type SwipeAction } from "../../../services/swipes";
import { BlockButton, ReportButton } from "../../community/ui";
import type { PublicProfile } from "../../../types/profile";

const chip: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 13,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(245,244,242,0.18)",
};

const button: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(245,244,242,0.3)",
  padding: "10px 20px",
  background: "rgba(255,255,255,0.08)",
  color: "#F5F4F2",
  cursor: "pointer",
  fontSize: 15,
};

type State = { status: "loading" } | { status: "error" } | { status: "missing" } | { status: "ready"; profile: PublicProfile };

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X / Twitter",
  website: "Website",
};

export default function MemberProfile() {
  const { memberId = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPublicProfile(memberId)
      .then((profile) => {
        if (!cancelled) setState(profile ? { status: "ready", profile } : { status: "missing" });
      })
      .catch((error: unknown) => {
        console.error("Member profile error:", error);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId, attempt]);

  const decide = async (action: SwipeAction) => {
    const userId = getCurrentUserId();
    if (!userId || saving) return;
    setSaving(true);
    try {
      await recordSwipe(userId, memberId, action);
      navigate("/discover");
    } catch (error) {
      console.error("Unable to save swipe:", error);
      setNotice("We couldn't save that choice. Please try again.");
      setSaving(false);
    }
  };

  const profile = state.status === "ready" ? state.profile : null;
  const location = profile ? [profile.city, profile.stateCode].filter(Boolean).join(", ") : "";
  const socialLinks = profile?.links
    ? Object.entries(profile.links.socialMedia).filter(([, url]) => Boolean(url))
    : [];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #050408 0%, #3b1590 45%, #8f1d4d 100%)",
        color: "#F5F4F2",
      }}
    >
      <main style={{ maxWidth: 520, margin: "0 auto", padding: 20, display: "grid", gap: 16 }}>
        <div>
          <button type="button" style={button} onClick={() => navigate("/discover")}>
            ← Back to Discover
          </button>
        </div>

        {state.status === "loading" ? <p role="status">Loading profile…</p> : null}
        {state.status === "missing" ? (
          <p role="alert">This profile isn't available. The member may have hidden it.</p>
        ) : null}
        {state.status === "error" ? (
          <div role="alert" style={{ display: "grid", gap: 10, justifyItems: "start" }}>
            <p style={{ margin: 0 }}>We couldn't load this profile.</p>
            <button type="button" style={button} onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }}>
              Retry
            </button>
          </div>
        ) : null}

        {profile ? (
          <article
            style={{
              borderRadius: 24,
              overflow: "hidden",
              background: "rgba(21,16,31,0.9)",
              border: "1px solid rgba(245,244,242,0.16)",
            }}
          >
            <PhotoGallery photos={photoList(profile)} label={profile.displayName || "Member"} />
            <div style={{ padding: 22, display: "grid", gap: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 30 }}>{profile.displayName || "Creative member"}</h1>
                <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                  {profile.entertainmentCategory}
                  {location ? ` · ${location}` : ""}
                </p>
              </div>
              {profile.roles.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.roles.map((role) => (
                    <span key={role} style={{ ...chip, background: "rgba(119,39,233,0.35)" }}>
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}
              {profile.bio ? <p style={{ margin: 0, overflowWrap: "anywhere" }}>{profile.bio}</p> : null}
              {profile.lookingFor.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, opacity: 0.7 }}>Looking for</span>
                  {profile.lookingFor.map((option) => (
                    <span key={option} style={chip}>
                      {option}
                    </span>
                  ))}
                </div>
              ) : null}
              {profile.links && (profile.links.portfolioUrl || socialLinks.length) ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, opacity: 0.7 }}>Links</span>
                  {profile.links.portfolioUrl ? (
                    <a href={profile.links.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#F5F4F2" }}>
                      Portfolio
                    </a>
                  ) : null}
                  {socialLinks.map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#F5F4F2" }}>
                      {socialLabels[key] ?? key}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ) : null}

        {profile ? (
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button type="button" style={button} disabled={saving} onClick={() => void decide("pass")}>
              ✕ Pass
            </button>
            <button type="button" style={button} disabled={saving} onClick={() => void decide("like")}>
              ♥ Like
            </button>
          </div>
        ) : null}
        {profile ? (
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
            <ReportButton targetType="member" targetPath={`publicProfiles/${memberId}`} />
            <BlockButton memberId={memberId} onBlocked={() => navigate("/discover")} />
          </div>
        ) : null}
        {notice ? <p role="status">{notice}</p> : null}
      </main>
    </div>
  );
}
