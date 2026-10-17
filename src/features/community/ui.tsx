import { useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../auth/authService";
import { buttonStyle, inputStyle, linkButtonStyle } from "./styles";
import { countUnread, useInbox } from "../messages/useInbox";
import { getCurrentUserId as currentUserId } from "../auth/authService";
import { blockMember, reportContent, type ReportTarget } from "../../services/forum";

type Active = "discover" | "community" | "jobs" | "chats" | "profile";

const navItem = (active: boolean): CSSProperties => ({
  background: "transparent",
  border: "none",
  color: "#F5F4F2",
  opacity: active ? 1 : 0.7,
  fontWeight: active ? 700 : 500,
  fontSize: 13,
  cursor: "pointer",
  padding: "12px 4px",
  borderBottom: active ? "2px solid #F7326D" : "2px solid transparent",
});

export function BottomNav({ active, onError }: { active?: Active; onError?: (message: string) => void }) {
  const navigate = useNavigate();
  const inbox = useInbox();
  const unread = countUnread(inbox, currentUserId());

  const logout = async () => {
    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      onError?.("We couldn't sign you out. Please try again.");
    }
  };

  return (
    <nav
      aria-label="Main"
      style={{
        position: "sticky",
        bottom: 0,
        background: "rgba(5,4,8,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(245,244,242,0.14)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
        <button type="button" style={navItem(active === "discover")} onClick={() => navigate("/discover")}>
          Discover
        </button>
        <button type="button" style={navItem(active === "community")} onClick={() => navigate("/forum")}>
          Forum
        </button>
        <button type="button" style={navItem(active === "jobs")} onClick={() => navigate("/opportunities")}>
          Jobs
        </button>
        <button type="button" style={navItem(active === "chats")} onClick={() => navigate("/matches")}>
          Chats
          {unread > 0 ? (
            <span aria-label={`${unread} unread`} style={{ marginLeft: 4, background: "#F7326D", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
              {unread}
            </span>
          ) : null}
        </button>
        <button type="button" style={navItem(active === "profile")} onClick={() => navigate("/profile")}>
          Profile
        </button>
        <button type="button" style={navItem(false)} onClick={() => void logout()}>
          Log out
        </button>
      </div>
    </nav>
  );
}

export function Shell({ title, active, children }: { title: string; active: Active; children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #050408 0%, #3b1590 45%, #8f1d4d 100%)",
        color: "#F5F4F2",
      }}
    >
      <header style={{ maxWidth: 520, width: "100%", margin: "0 auto", padding: "calc(14px + env(safe-area-inset-top)) 20px 14px", boxSizing: "border-box" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
      </header>
      <main style={{ flex: 1, maxWidth: 520, width: "100%", margin: "0 auto", padding: "0 20px 20px", boxSizing: "border-box", display: "grid", gap: 14, alignContent: "start" }}>
        {children}
      </main>
      <BottomNav active={active} />
    </div>
  );
}

export function ReportButton({ targetType, targetPath }: { targetType: ReportTarget; targetPath: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (status === "sent") return <span style={{ fontSize: 13 }}>Thanks, we'll review this.</span>;
  if (!open) {
    return (
      <button type="button" style={linkButtonStyle} onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }

  const send = async () => {
    if (!reason.trim()) return;
    setStatus("sending");
    try {
      await reportContent(targetType, targetPath, reason);
      setStatus("sent");
    } catch (error) {
      console.error("Report error:", error);
      setStatus("error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <textarea
        aria-label="Reason for report"
        value={reason}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        placeholder="What's wrong with this?"
        style={{ ...inputStyle, minHeight: 60 }}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" style={buttonStyle} disabled={status === "sending"} onClick={() => void send()}>
          Send report
        </button>
        <button type="button" style={linkButtonStyle} onClick={() => setOpen(false)}>
          Cancel
        </button>
        {status === "error" ? <span role="alert" style={{ fontSize: 13 }}>Couldn't send. Try again.</span> : null}
      </div>
    </div>
  );
}

export function BlockButton({ memberId, onBlocked }: { memberId: string; onBlocked?: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (status === "done") return <span style={{ fontSize: 13 }}>Blocked.</span>;

  const block = async () => {
    setStatus("sending");
    try {
      await blockMember(memberId);
      setStatus("done");
      onBlocked?.();
    } catch (error) {
      console.error("Block error:", error);
      setStatus("error");
    }
  };

  return (
    <>
      <button type="button" style={linkButtonStyle} disabled={status === "sending"} onClick={() => void block()}>
        Block
      </button>
      {status === "error" ? <span role="alert" style={{ fontSize: 13 }}> Couldn't block. Try again.</span> : null}
    </>
  );
}
