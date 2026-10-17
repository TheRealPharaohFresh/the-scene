import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createGroup,
  createThread,
  fetchBlockedIds,
  listGroups,
  listThreads,
  type Group,
  type Thread,
} from "../../services/forum";
import { Shell } from "./ui";
import { buttonStyle, cardStyle, formatDate, inputStyle, primaryButtonStyle } from "./styles";

type Tab = "questions" | "groups";

const tabStyle = (active: boolean) =>
  ({ ...buttonStyle, flex: 1, background: active ? "rgba(247,50,109,0.35)" : buttonStyle.background }) as const;

export default function Forum() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("questions");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (tab === "questions") {
        const [items, blocked] = await Promise.all([listThreads(null), fetchBlockedIds()]);
        if (!cancelled) setThreads(items.filter((item) => !blocked.has(item.authorId)));
      } else {
        const items = await listGroups();
        if (!cancelled) setGroups(items);
      }
      if (!cancelled) setLoading(false);
    })().catch((loadError: unknown) => {
      console.error("Forum load error:", loadError);
      if (cancelled) return;
      setError("We couldn't load the community. Check your connection and try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, attempt]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setLoading(true);
    setError("");
    setComposing(false);
    setFormError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (tab === "questions") {
        const id = await createThread({ title, body, groupId: null });
        navigate(`/forum/threads/${id}`);
      } else {
        const id = await createGroup({ name: title, description: body });
        navigate(`/groups/${id}`);
      }
    } catch (submitError) {
      console.error("Forum submit error:", submitError);
      setFormError(
        submitError instanceof Error && submitError.message.includes("profile")
          ? submitError.message
          : "We couldn't post that. Check the title (3+ characters) and try again.",
      );
      setSaving(false);
    }
  };

  const isQuestions = tab === "questions";

  return (
    <Shell title="Community" active="community">
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" style={tabStyle(isQuestions)} onClick={() => switchTab("questions")}>
          Questions
        </button>
        <button type="button" style={tabStyle(!isQuestions)} onClick={() => switchTab("groups")}>
          Groups
        </button>
      </div>

      {composing ? (
        <form onSubmit={(event) => void submit(event)} style={cardStyle}>
          <input
            aria-label={isQuestions ? "Question title" : "Group name"}
            style={inputStyle}
            value={title}
            maxLength={isQuestions ? 140 : 80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={isQuestions ? "Ask the community…" : "Group name"}
            required
            minLength={3}
          />
          <textarea
            aria-label={isQuestions ? "Details" : "Description"}
            style={{ ...inputStyle, minHeight: 90 }}
            value={body}
            maxLength={isQuestions ? 5000 : 600}
            onChange={(event) => setBody(event.target.value)}
            placeholder={isQuestions ? "Add details" : "What is this group for?"}
            required={isQuestions}
          />
          {formError ? <p role="alert" style={{ margin: 0 }}>{formError}</p> : null}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? "Posting…" : isQuestions ? "Post question" : "Create group"}
            </button>
            <button type="button" style={buttonStyle} onClick={() => setComposing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" style={primaryButtonStyle} onClick={() => setComposing(true)}>
          {isQuestions ? "Ask a question" : "Start a group"}
        </button>
      )}

      {loading ? <p role="status">Loading…</p> : null}
      {error ? (
        <div role="alert" style={{ display: "grid", gap: 8, justifyItems: "start" }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button type="button" style={buttonStyle} onClick={() => { setLoading(true); setError(""); setAttempt((n) => n + 1); }}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && isQuestions
        ? threads.length
          ? threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => navigate(`/forum/threads/${thread.id}`)}
                style={{ ...cardStyle, textAlign: "left", color: "#F5F4F2", cursor: "pointer" }}
              >
                <strong>{thread.title}</strong>
                <span style={{ opacity: 0.8, fontSize: 13 }}>
                  {thread.authorName} · {formatDate(thread.createdAt)}
                </span>
              </button>
            ))
          : <p>No questions yet. Be the first to ask.</p>
        : null}

      {!loading && !error && !isQuestions
        ? groups.length
          ? groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => navigate(`/groups/${group.id}`)}
                style={{ ...cardStyle, textAlign: "left", color: "#F5F4F2", cursor: "pointer" }}
              >
                <strong>{group.name}</strong>
                {group.description ? <span style={{ opacity: 0.85, overflowWrap: "anywhere" }}>{group.description}</span> : null}
              </button>
            ))
          : <p>No groups yet. Start one for your crew.</p>
        : null}
    </Shell>
  );
}
