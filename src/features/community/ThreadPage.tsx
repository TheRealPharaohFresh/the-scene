import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUserId } from "../auth/authService";
import {
  createReply,
  fetchBlockedIds,
  getThread,
  listReplies,
  type Reply,
  type Thread,
} from "../../services/forum";
import { BlockButton, ReportButton, Shell } from "./ui";
import { buttonStyle, cardStyle, formatDate, inputStyle, primaryButtonStyle } from "./styles";

type Loaded = { thread: Thread | null; replies: Reply[]; blocked: Set<string> };

export default function ThreadPage() {
  const { threadId = "" } = useParams();
  const navigate = useNavigate();
  const myId = getCurrentUserId();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const thread = await getThread(threadId);
      const [replies, blocked] = thread ? await Promise.all([listReplies(threadId), fetchBlockedIds()]) : [[], new Set<string>()];
      if (!cancelled) setData({ thread, replies, blocked });
    })().catch((loadError: unknown) => {
      console.error("Thread load error:", loadError);
      if (!cancelled) setError("We couldn't load this thread. It may be private to a group you haven't joined.");
    });
    return () => {
      cancelled = true;
    };
  }, [threadId, attempt]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setReplyError("");
    try {
      await createReply(threadId, reply);
      setReply("");
      setSending(false);
      setAttempt((n) => n + 1);
    } catch (sendError) {
      console.error("Reply error:", sendError);
      setReplyError("We couldn't post your reply. Please try again.");
      setSending(false);
    }
  };

  const thread = data?.thread;
  const hidden = (authorId: string) => Boolean(data?.blocked.has(authorId));
  const back = thread?.groupId ? `/groups/${thread.groupId}` : "/forum";

  return (
    <Shell title="Thread" active="community">
      <div>
        <button type="button" style={buttonStyle} onClick={() => navigate(back)}>
          ← Back
        </button>
      </div>
      {error ? (
        <div role="alert" style={{ display: "grid", gap: 8, justifyItems: "start" }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button type="button" style={buttonStyle} onClick={() => { setError(""); setAttempt((n) => n + 1); }}>
            Retry
          </button>
        </div>
      ) : null}
      {!data && !error ? <p role="status">Loading…</p> : null}
      {data && !thread ? <p role="alert">This thread no longer exists.</p> : null}

      {thread && !hidden(thread.authorId) ? (
        <article style={cardStyle}>
          <h2 style={{ margin: 0 }}>{thread.title}</h2>
          <span style={{ opacity: 0.8, fontSize: 13 }}>
            {thread.authorName} · {formatDate(thread.createdAt)}
          </span>
          <p style={{ margin: "6px 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{thread.body}</p>
          {thread.authorId !== myId ? (
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <ReportButton targetType="thread" targetPath={`threads/${thread.id}`} />
              <BlockButton memberId={thread.authorId} />
            </div>
          ) : null}
        </article>
      ) : null}
      {thread && hidden(thread.authorId) ? <p>This post is from a member you blocked.</p> : null}

      {data?.replies.map((item) =>
        hidden(item.authorId) ? null : (
          <div key={item.id} style={cardStyle}>
            <span style={{ opacity: 0.8, fontSize: 13 }}>
              {item.authorName} · {formatDate(item.createdAt)}
            </span>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.body}</p>
            {item.authorId !== myId ? (
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <ReportButton targetType="reply" targetPath={`threads/${threadId}/replies/${item.id}`} />
                <BlockButton memberId={item.authorId} />
              </div>
            ) : null}
          </div>
        ),
      )}

      {thread ? (
        <form onSubmit={(event) => void send(event)} style={cardStyle}>
          <textarea
            aria-label="Your reply"
            style={{ ...inputStyle, minHeight: 80 }}
            value={reply}
            maxLength={3000}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a reply…"
            required
          />
          {replyError ? <p role="alert" style={{ margin: 0 }}>{replyError}</p> : null}
          <div>
            <button type="submit" style={primaryButtonStyle} disabled={sending}>
              {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        </form>
      ) : null}
    </Shell>
  );
}
