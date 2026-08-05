import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import { getCurrentUserId } from "../authService";
import { fetchUserProfile } from "../../../services/firebase";
import type { UserProfile } from "../../../types/profile";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchUserProfile(userId)
      .then((profileData) => {
        if (!profileData) {
          setError("No profile was found. Please create or edit your profile.");
          return;
        }

        setProfile(profileData);
      })
      .catch(() => {
        setError("Unable to load your profile. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)",
        padding: 24,
        color: "#F5F4F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          padding: 28,
          borderRadius: 24,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(245,244,242,0.18)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>My Profile</h1>
          <p style={{ margin: "12px 0 0", opacity: 0.9 }}>
            View your saved scene profile and share your entertainment identity.
          </p>
        </div>

        {loading ? (
          <p style={{ opacity: 0.9 }}>Loading profile...</p>
        ) : error ? (
          <div style={{ display: "grid", gap: 18 }}>
            <p style={{ opacity: 0.9 }}>{error}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate("/create-profile")}
                style={{
                  borderRadius: 999,
                  padding: "12px 18px",
                  border: "1px solid rgba(245,244,242,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#F5F4F2",
                  cursor: "pointer",
                }}
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  borderRadius: 999,
                  padding: "12px 18px",
                  border: "1px solid rgba(245,244,242,0.3)",
                  background: "transparent",
                  color: "#F5F4F2",
                  cursor: "pointer",
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : profile ? (
          <ProfileCard profile={profile} />
        ) : (
          <p style={{ opacity: 0.9 }}>Your profile is not available yet.</p>
        )}
      </div>
    </div>
  );
}
