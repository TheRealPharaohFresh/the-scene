import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../../../components/ui/Button";
import { logoutUser } from "../authService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: "#F5F4F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          padding: 32,
          borderRadius: 24,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(245,244,242,0.16)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 36 }}>Dashboard</h1>
        <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 28 }}>
          This is your home base. Once your profile is saved, use this page to navigate the community and continue building your scene.
        </p>
        <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(245,244,242,0.2)",
              padding: "14px 18px",
              background: "transparent",
              color: "#F5F4F2",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            View your profile
          </button>
          <button
            type="button"
            onClick={() => navigate("/edit-profile")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(245,244,242,0.2)",
              padding: "14px 18px",
              background: "transparent",
              color: "#F5F4F2",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Edit your profile
          </button>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Discovery is not available yet. Profiles are currently private to their owners.
          </p>
          <LogoutButton onClick={handleLogout} />
          {logoutError ? <p role="alert">{logoutError}</p> : null}
        </div>
      </div>
    </div>
  );
}
