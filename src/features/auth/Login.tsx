import React, { useState } from "react";
import { LoginButton, RegisterButton } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { loginUser, sendPasswordReset } from "./authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    if (submitting) return;

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      const user = await loginUser({ email, password });
      const destination = user.profileComplete ? "/dashboard" : "/create-profile";
      navigate(destination, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    if (sendingReset) return;
    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setSendingReset(true);
      await sendPasswordReset(resetEmail);
      setResetMessage("If an account with that email exists, a password reset email has been sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to send a password reset email.");
    } finally {
      setSendingReset(false);
    }
  };
  const handleRegisterRedirect = () => {
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            required
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
            aria-label="Password"
            autoComplete="current-password"
            required
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
            <LoginButton disabled={submitting}>{submitting ? "Signing in..." : "Login"}</LoginButton>
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
              aria-label="Email for password reset"
              autoComplete="email"
              required
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
              disabled={sendingReset}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "linear-gradient(90deg, #F7326D 0%, #7727E9 100%)",
                color: "#F5F4F2",
                border: "none",
              }}
            >
              {sendingReset ? "Sending..." : "Send reset link"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p role="alert" style={{ color: "#F7326D", marginTop: 12 }}>{error}</p>
        ) : null}
        {resetMessage ? (
          <p style={{ color: "#F5F4F2", marginTop: 12 }}>{resetMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
