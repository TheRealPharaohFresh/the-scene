import type { UserProfile } from "../../../types/profile";

type ProfileCardProps = {
  profile: UserProfile;
};

const socialLabelMap: Record<keyof UserProfile["socialMedia"], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
  website: "Website",
};

export default function ProfileCard({ profile }: ProfileCardProps) {
  const socialEntries = Object.entries(profile.socialMedia ?? {}).filter(
    ([, value]) => Boolean(value),
  ) as Array<[keyof UserProfile["socialMedia"], string]>;

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        padding: 24,
        borderRadius: 24,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(245,244,242,0.18)",
      }}
    >
      <header style={{ display: "grid", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28 }}>{profile.displayName || profile.nickname || "Your Scene"}</h2>
          <p style={{ margin: "8px 0 0", opacity: 0.85 }}>
            {profile.entertainmentCategory ?? "No entertainment category selected"}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <span style={{ opacity: 0.78 }}>
            {profile.gender}
          </span>
          {profile.location ? <span style={{ opacity: 0.78 }}>{profile.location}</span> : null}
        </div>
      </header>

      {profile.bio ? (
        <section>
          <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>About</h3>
          <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.92 }}>{profile.bio}</p>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <strong style={{ opacity: 0.85 }}>Roles:</strong>
          <span style={{ opacity: 0.92 }}>{profile.roles.length ? profile.roles.join(", ") : "Not specified"}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <strong style={{ opacity: 0.85 }}>Looking for:</strong>
          <span style={{ opacity: 0.92 }}>{profile.lookingFor.length ? profile.lookingFor.join(", ") : "Not specified"}</span>
        </div>
      </section>

      {profile.portfolioUrl ? (
        <section>
          <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Portfolio</h3>
          <a
            href={profile.portfolioUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#F7326D", textDecoration: "underline" }}
          >
            {profile.portfolioUrl}
          </a>
        </section>
      ) : null}

      {socialEntries.length ? (
        <section style={{ display: "grid", gap: 10 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Social</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {socialEntries.map(([key, value]) => (
              <a
                key={key}
                href={value}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#F5F4F2", opacity: 0.9, textDecoration: "underline" }}
              >
                {socialLabelMap[key]}: {value}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
