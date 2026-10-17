import { useNavigate } from "react-router-dom";
import { buttonStyle, primaryButtonStyle } from "../community/styles";

export default function MatchModal({ matchId, name, onClose }: { matchId: string; name: string; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="It's a match"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", background: "rgba(5,4,8,0.88)", padding: 20 }}
    >
      <div style={{ textAlign: "center", color: "#F5F4F2", display: "grid", gap: 14, maxWidth: 360 }}>
        <h2 style={{ margin: 0, fontSize: 32 }}>It's a match!</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>You and {name} both hearted each other.</p>
        <button type="button" style={primaryButtonStyle} onClick={() => navigate(`/chat/${matchId}`)}>
          Send a message
        </button>
        <button type="button" style={buttonStyle} onClick={onClose}>
          Keep discovering
        </button>
      </div>
    </div>
  );
}
