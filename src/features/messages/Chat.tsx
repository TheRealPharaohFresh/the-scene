import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUserId } from "../auth/authService";
import { fetchPublicProfile } from "../../services/publicProfiles";
import {
  listenToMessages,
  markRead,
  MAX_MESSAGE_LENGTH,
  otherMember,
  sendMessage,
  type ChatMessage,
} from "../../services/messages";
import { BlockButton, ReportButton } from "../community/ui";
import { inputStyle, primaryButtonStyle } from "../community/styles";

export default function Chat() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const myId = getCurrentUserId() ?? "";
  const otherId = otherMember(matchId, myId);
  const isMember = matchId.split("_").includes(myId);
  const [name, setName] = useState("Member");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMarked = useRef(-1);

  useEffect(() => {
    if (!isMember) return;
    let cancelled = false;
    void fetchPublicProfile(otherId)
      .then((profile) => {
        if (!cancelled && profile?.displayName) setName(profile.displayName);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [otherId, isMember]);

  useEffect(() => {
    if (!isMember) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    listenToMessages(
      myId,
      matchId,
      (next) => {
        if (!cancelled) setMessages(next);
      },
      (message) => {
        if (!cancelled) setError(message);
      },
    )
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else stop = unsubscribe;
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load this conversation.");
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [matchId, myId, isMember]);

  const newest = messages.length ? messages[messages.length - 1].createdAt : 0;
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
    if (isMember && newest > lastMarked.current) {
      lastMarked.current = newest;
      markRead(myId, matchId).catch(() => undefined);
    }
  }, [newest, myId, matchId, isMember]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(myId, matchId, text);
      setText("");
    } catch (cause) {
      console.error("Unable to send message:", cause);
      setError(cause instanceof Error && cause.message.startsWith("Write") ? cause.message : "We couldn't send that. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!isMember) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#050408", color: "#F5F4F2" }}>
        <p>This conversation isn't available.</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #050408 0%, #3b1590 45%, #8f1d4d 100%)", color: "#F5F4F2" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "calc(10px + env(safe-area-inset-top)) 14px 10px", borderBottom: "1px solid rgba(245,244,242,0.14)" }}>
        <button type="button" aria-label="Back to matches" onClick={() => navigate("/matches")} style={{ background: "none", border: "none", color: "inherit", fontSize: 22, cursor: "pointer" }}>
          ←
        </button>
        <button type="button" onClick={() => navigate(`/members/${otherId}`)} style={{ background: "none", border: "none", color: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </button>
        <ReportButton targetType="member" targetPath={`publicProfiles/${otherId}`} />
        <BlockButton memberId={otherId} onBlocked={() => navigate("/matches")} />
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, maxWidth: 520, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.length === 0 && !error ? <p style={{ opacity: 0.8, textAlign: "center" }}>You matched with {name}. Say hello!</p> : null}
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <div
              key={message.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: 16,
                background: mine ? "linear-gradient(135deg, #7727E9, #F7326D)" : "rgba(21,16,31,0.9)",
                border: mine ? "none" : "1px solid rgba(245,244,242,0.14)",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {message.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error ? <p role="alert" style={{ margin: "0 14px" }}>{error}</p> : null}
      <form onSubmit={(event) => void send(event)} style={{ display: "flex", gap: 8, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))", borderTop: "1px solid rgba(245,244,242,0.14)", maxWidth: 520, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <input
          aria-label="Message"
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a message"
          style={inputStyle}
        />
        <button type="submit" disabled={sending || !text.trim()} style={{ ...primaryButtonStyle, opacity: sending || !text.trim() ? 0.6 : 1 }}>
          Send
        </button>
      </form>
    </div>
  );
}
