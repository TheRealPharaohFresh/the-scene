import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../../../types/profile";
import { getCurrentUserId } from "../authService";
import { fetchUserProfile } from "../../../services/firebase";
import { normalizeProfileUrl } from "../validation";

type Props = {
  profile?: UserProfile | null;
};

export default function ProfilePage({ profile: initialProfile }: Props) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(initialProfile);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (initialProfile !== undefined) return;
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    let mounted = true;
    void fetchUserProfile(userId)
      .then((loadedProfile) => {
        if (mounted) setProfile(loadedProfile);
      })
      .catch((error: unknown) => {
        if (mounted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialProfile, navigate, retryCount]);

  const location = useMemo(() => {
    if (!profile) return "Location not provided";
    if (profile.city && profile.stateCode) {
      return `${profile.city}, ${profile.stateCode}`;
    }

    return profile.location || "Location not provided";
  }, [profile]);

  if (profile === undefined) {
    return (
      <div role={loadError ? "alert" : "status"} style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ color: "#F5F4F2" }}>{loadError || "Loading profile…"}</div>
        {loadError ? (
          <button type="button" onClick={() => { setLoadError(""); setRetryCount((count) => count + 1); }}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ color: "#F5F4F2" }}>No profile found.</div>
      </div>
    );
  }

  const socialLinks = Object.entries(profile.socialMedia ?? {}).flatMap(([platform, value]) => {
    const href = safeExternalUrl(value);
    return href ? [{ platform, href }] : [];
  });
  const portfolioUrl = safeExternalUrl(profile.portfolioUrl);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#050408 0%,#7727E9 45%,#F7326D 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          borderRadius: "28px",
          overflow: "hidden",
          background: "rgba(255,255,255,.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow: "0 10px 50px rgba(0,0,0,.35)",
        }}
      >
        {/* COVER */}

        <div
          style={{
            height: "320px",
            position: "relative",
            background: profile.coverPhotoUrl
              ? `url(${profile.coverPhotoUrl}) center/cover no-repeat`
              : "linear-gradient(135deg,#7727E9 0%,#F7326D 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: -70,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "#F5F4F2",
              border: "5px solid #050408",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : null}
          </div>
        </div>

        <div
          style={{
            padding: "90px 32px 40px",
            color: "#F5F4F2",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "2.4rem",
                  fontWeight: 800,
                }}
              >
                {profile.displayName}
              </h1>

              <p
                style={{
                  marginTop: 8,
                  opacity: 0.85,
                  fontSize: "1rem",
                }}
              >
                {location}
              </p>

              <p
                style={{
                  marginTop: 4,
                  color: "#F7326D",
                  fontWeight: 700,
                }}
              >
                {profile.entertainmentCategory}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/edit-profile")}
                style={{
                  padding: "14px 22px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: "#7727E9",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Edit profile
              </button>
              <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            </div>
          </div>

          {/* MAIN GRID */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 28,
              marginTop: 36,
            }}
          >
            {/* SIDEBAR */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <Card title="Roles">
                <TagGroup values={profile.roles} />
              </Card>

              <Card title="Looking For">
                <TagGroup values={profile.lookingFor} />
              </Card>

              <Card title="Social Media">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {socialLinks.length ? (
                    socialLinks.map(({ platform, href }) => (
                      <a
                        key={platform}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#F5F4F2",
                          textDecoration: "none",
                        }}
                      >
                        {platform}
                      </a>
                    ))
                  ) : (
                    <span style={{ opacity: 0.7 }}>
                      No social links added
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* CONTENT */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <Card title="About">
                <p
                  style={{
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {profile.bio || "No bio yet."}
                </p>
              </Card>

              {portfolioUrl && (
                <Card title="Portfolio Link">
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#F7326D",
                      fontWeight: 700,
                    }}
                  >
                    Open Portfolio
                  </a>
                </Card>
              )}

              <Card title="Creative Highlights">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill,minmax(160px,1fr))",
                    gap: 16,
                  }}
                >
                  <StatCard
                    title="Category"
                    value={profile.entertainmentCategory ?? "Not selected"}
                  />

                  <StatCard
                    title="Roles"
                    value={String(profile.roles.length)}
                  />

                  <StatCard
                    title="Interests"
                    value={String(profile.lookingFor.length)}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.05)",
        borderRadius: 18,
        padding: 20,
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 16,
          color: "#F5F4F2",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

function TagGroup({ values }: { values: string[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {values.map((value) => (
        <span
          key={value}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "#7727E9",
            color: "#fff",
            fontSize: ".85rem",
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        background: "rgba(255,255,255,.05)",
      }}
    >
      <div
        style={{
          opacity: 0.7,
          fontSize: ".8rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function safeExternalUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return normalizeProfileUrl(value);
  } catch {
    return null;
  }
}