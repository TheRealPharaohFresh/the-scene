import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../auth/authService";
import { fetchPublicProfile } from "../../services/publicProfiles";
import { photoList } from "../../services/photos";
import type { PublicProfile } from "../../types/profile";
import { Shell } from "../community/ui";
import { cardStyle } from "../community/styles";
import { needsAttention, useInbox } from "./useInbox";

export default function Matches() {
  const navigate = useNavigate();
  const myId = getCurrentUserId() ?? "";
  const inbox = useInbox();
  const [people, setPeople] = useState<Record<string, PublicProfile | null>>({});

  const idsKey = inbox.matches.map((match) => match.otherUserId).join(",");
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    void Promise.all(
      idsKey.split(",").map(async (id) => [id, await fetchPublicProfile(id).catch(() => null)] as const),
    ).then((entries) => {
      if (!cancelled) setPeople(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return (
    <Shell title="Matches & chats" active="chats">
      {inbox.error ? <p role="alert">{inbox.error}</p> : null}
      {inbox.loading ? <p>Loading…</p> : null}
      {!inbox.loading && !inbox.error && inbox.matches.length === 0 ? (
        <div style={cardStyle}>
          <strong>No matches yet</strong>
          <span style={{ opacity: 0.85 }}>
            When you and another member both heart each other, you'll match and can message here.
          </span>
          <button type="button" onClick={() => navigate("/discover")} style={{ justifySelf: "start", cursor: "pointer", borderRadius: 999, padding: "9px 18px" }}>
            Keep discovering
          </button>
        </div>
      ) : null}
      {inbox.matches.map((match) => {
        const person = people[match.otherUserId];
        const unread = needsAttention(match, myId, inbox.reads);
        const photo = person ? photoList(person)[0] : undefined;
        return (
          <button
            key={match.id}
            type="button"
            onClick={() => navigate(`/chat/${match.id}`)}
            style={{ ...cardStyle, gridTemplateColumns: "52px 1fr auto", alignItems: "center", textAlign: "left", color: "inherit", cursor: "pointer", font: "inherit" }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: photo ? `center / cover url(${photo})` : "linear-gradient(135deg, #7727E9, #F7326D)",
              }}
            />
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: "block" }}>{person?.displayName || "Member"}</strong>
              <span style={{ display: "block", opacity: unread ? 1 : 0.7, fontWeight: unread ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.lastMessageText || "You matched! Say hello."}
              </span>
            </span>
            {unread ? <span aria-label="Unread" style={{ width: 10, height: 10, borderRadius: "50%", background: "#F7326D" }} /> : null}
          </button>
        );
      })}
    </Shell>
  );
}
