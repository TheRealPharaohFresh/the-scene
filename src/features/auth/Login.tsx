import React, { useState } from "react";
import { LoginButton, RegisterButton } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { loginUser, hasCompletedProfile } from "./authService";

export default function Login() {
	console.log("Login component render");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      await loginUser({ username, password });
      const destination = hasCompletedProfile() ? "/dashboard" : "/create-profile";
      navigate(destination, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed.");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }

    setResetMessage(`Password reset link sent to ${resetEmail}.`);
    setResetEmail("");
  };
  const handleRegisterRedirect = () => {
    console.log("Register Button clicked. Redirecting to /register...");
    navigate("/register");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 23,
        background:
          "linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)",
        color: "#F5F4F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "32px 28px",
          borderRadius: 24,
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(245, 244, 242, 0.22)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800 }}>
          Login
        </h1>
        <p style={{ margin: "0 0 20px", color: "#F5F4F2", opacity: 0.9 }}>
          Welcome back.
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={{
              display: "block",
              width: "100%",
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(245, 244, 242, 0.25)",
              background: "rgba(5, 4, 8, 0.45)",
              color: "#F5F4F2",
              outline: "none",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              display: "block",
              width: "100%",
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(245, 244, 242, 0.25)",
              background: "rgba(5, 4, 8, 0.45)",
              color: "#F5F4F2",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 8,
            }}
          >
            <LoginButton />
            <RegisterButton onClick={handleRegisterRedirect} />
          </div>
        </form>

        <button
          type="button"
          onClick={() => setShowForgotPassword((prev) => !prev)}
          style={{
            marginTop: 16,
            background: "transparent",
            color: "#F5F4F2",
            padding: 0,
            cursor: "pointer",
            border: "none",
            textDecoration: "underline",
          }}
        >
          Forgot password?
        </button>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} style={{ marginTop: 12 }}>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                display: "block",
                width: "100%",
                marginBottom: 8,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(245, 244, 242, 0.25)",
                background: "rgba(5, 4, 8, 0.45)",
                color: "#F5F4F2",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "linear-gradient(90deg, #F7326D 0%, #7727E9 100%)",
                color: "#F5F4F2",
                border: "none",
              }}
            >
              Send reset link
            </button>
          </form>
        ) : null}

        {error ? (
          <p style={{ color: "#F7326D", marginTop: 12 }}>{error}</p>
        ) : null}
        {resetMessage ? (
          <p style={{ color: "#F5F4F2", marginTop: 12 }}>{resetMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
