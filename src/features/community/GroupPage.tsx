import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUserId } from "../auth/authService";
import {
  EVENT_KINDS,
  RSVP_STATUSES,
  createEvent,
  createThread,
  fetchBlockedIds,
  getEventAddress,
  getGroup,
  getMyRsvp,
  isMember,
  joinGroup,
  leaveGroup,
  listEvents,
  listGoing,
  listMembers,
  listThreads,
  setRsvp,
  type EventKind,
  type Group,
  type GroupEvent,
  type GroupMember,
  type RsvpStatus,
  type Thread,
} from "../../services/forum";
import { ReportButton, Shell } from "./ui";
import { buttonStyle, cardStyle, formatDate, inputStyle, primaryButtonStyle } from "./styles";

type Tab = "posts" | "events" | "members";

const tabStyle = (active: boolean) =>
  ({ ...buttonStyle, flex: 1, padding: "9px 8px", background: active ? "rgba(247,50,109,0.35)" : buttonStyle.background }) as const;

function EventCard({ groupId, event }: { groupId: string; event: GroupEvent }) {
  const myId = getCurrentUserId();
  const [rsvp, setRsvpState] = useState<RsvpStatus | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [going, setGoing] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [mine, names, place] = await Promise.all([
        getMyRsvp(groupId, event.id),
        listGoing(groupId, event.id),
        getEventAddress(groupId, event.id),
      ]);
      if (cancelled) return;
      setRsvpState(mine);
      setGoing(names);
      setAddress(place);
    })().catch((loadError: unknown) => {
      console.error("Event load error:", loadError);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, event.id, version]);

  const choose = async (status: RsvpStatus) => {
    setError("");
    try {
      await setRsvp(groupId, event.id, status);
      setVersion((n) => n + 1);
    } catch (rsvpError) {
      console.error("RSVP error:", rsvpError);
      setError("We couldn't save your RSVP. Please try again.");
    }
  };

  const place = [event.city, event.stateCode].filter(Boolean).join(", ");

  return (
    <article style={cardStyle}>
      <strong>{event.title}</strong>
      <span style={{ fontSize: 13, opacity: 0.85 }}>
        {event.kind} · {formatDate(event.startsAt)}
        {place ? ` · ${place}` : ""}
      </span>
      <span style={{ fontSize: 13, opacity: 0.85 }}>Hosted by {event.hostName}</span>
      {event.description ? <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{event.description}</p> : null}
      {address ? (
        <p style={{ margin: 0 }}>
          <strong>Address:</strong> {address}
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
          The exact address is shared with the host and members who RSVP “going”.
        </p>
      )}
      <span style={{ fontSize: 13 }}>
        Going ({going.length}){going.length ? `: ${going.join(", ")}` : ""}
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {RSVP_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={rsvp === status}
            style={{ ...buttonStyle, background: rsvp === status ? "rgba(247,50,109,0.4)" : buttonStyle.background }}
            onClick={() => void choose(status)}
          >
            {status === "going" ? "Going" : status === "maybe" ? "Maybe" : "Can't go"}
          </button>
        ))}
      </div>
      {error ? <p role="alert" style={{ margin: 0 }}>{error}</p> : null}
      {event.hostId !== myId ? (
        <ReportButton targetType="event" targetPath={`groups/${groupId}/events/${event.id}`} />
      ) : null}
    </article>
  );
}

type Loaded = { group: Group | null; member: boolean };

export default function GroupPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tabLoading, setTabLoading] = useState(true);
  const [tabError, setTabError] = useState("");
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<EventKind>("Meetup");
  const [startsAt, setStartsAt] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");

  const member = data?.member ?? false;
  const group = data?.group ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await getGroup(groupId);
      const joined = found ? await isMember(groupId) : false;
      if (!cancelled) setData({ group: found, member: joined });
    })().catch((loadError: unknown) => {
      console.error("Group load error:", loadError);
      if (!cancelled) setError("We couldn't load this group.");
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, attempt]);

  const [tabAttempt, setTabAttempt] = useState(0);
  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    (async () => {
      if (tab === "posts") {
        const [items, blocked] = await Promise.all([listThreads(groupId), fetchBlockedIds()]);
        if (!cancelled) setThreads(items.filter((item) => !blocked.has(item.authorId)));
      } else if (tab === "events") {
        const items = await listEvents(groupId);
        if (!cancelled) setEvents(items);
      } else {
        const items = await listMembers(groupId);
        if (!cancelled) setMembers(items);
      }
      if (!cancelled) setTabLoading(false);
    })().catch((loadError: unknown) => {
      console.error("Group tab error:", loadError);
      if (cancelled) return;
      setTabError("We couldn't load this section. Please try again.");
      setTabLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, member, tab, tabAttempt]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setTabLoading(true);
    setTabError("");
    setComposing(false);
    setFormError("");
  };

  const toggleMembership = async () => {
    setBusy(true);
    setError("");
    try {
      if (member) await leaveGroup(groupId);
      else await joinGroup(groupId);
      setTabLoading(true);
      setAttempt((n) => n + 1);
    } catch (membershipError) {
      console.error("Membership error:", membershipError);
      setError("We couldn't update your membership. Finish your profile first, then try again.");
    }
    setBusy(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      if (tab === "posts") {
        const id = await createThread({ title, body, groupId });
        navigate(`/forum/threads/${id}`);
        return;
      }
      const when = new Date(startsAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        setFormError("Choose a start time in the future.");
        setBusy(false);
        return;
      }
      await createEvent(groupId, { title, description: body, kind, startsAt: when, city, stateCode, address });
      setComposing(false);
      setTitle("");
      setBody("");
      setAddress("");
      setTabLoading(true);
      setTabAttempt((n) => n + 1);
    } catch (submitError) {
      console.error("Group submit error:", submitError);
      setFormError("We couldn't save that. Check the title (3+ characters) and try again.");
    }
    setBusy(false);
  };

  return (
    <Shell title={group?.name ?? "Group"} active="community">
      <div>
        <button type="button" style={buttonStyle} onClick={() => navigate("/forum")}>
          ← Back to Community
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
      {data && !group ? <p role="alert">This group no longer exists.</p> : null}

      {group ? (
        <div style={cardStyle}>
          {group.description ? <p style={{ margin: 0, overflowWrap: "anywhere" }}>{group.description}</p> : null}
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {group.ownerId === getCurrentUserId() ? (
              <span style={{ fontSize: 13 }}>You own this group.</span>
            ) : (
              <>
                <button type="button" style={member ? buttonStyle : primaryButtonStyle} disabled={busy} onClick={() => void toggleMembership()}>
                  {member ? "Leave group" : "Join group"}
                </button>
                <ReportButton targetType="group" targetPath={`groups/${group.id}`} />
              </>
            )}
          </div>
        </div>
      ) : null}

      {group && !member ? <p>Join this group to see its posts, events, and members.</p> : null}

      {group && member ? (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={tabStyle(tab === "posts")} onClick={() => switchTab("posts")}>Posts</button>
            <button type="button" style={tabStyle(tab === "events")} onClick={() => switchTab("events")}>Events</button>
            <button type="button" style={tabStyle(tab === "members")} onClick={() => switchTab("members")}>Members</button>
          </div>

          {tab !== "members" ? (
            composing ? (
              <form onSubmit={(event) => void submit(event)} style={cardStyle}>
                <input
                  aria-label={tab === "posts" ? "Post title" : "Event title"}
                  style={inputStyle}
                  value={title}
                  minLength={3}
                  maxLength={tab === "posts" ? 140 : 120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={tab === "posts" ? "Post title" : "Event title (e.g. Music video shoot)"}
                  required
                />
                <textarea
                  aria-label={tab === "posts" ? "Post details" : "Event details"}
                  style={{ ...inputStyle, minHeight: 80 }}
                  value={body}
                  maxLength={tab === "posts" ? 5000 : 1200}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={tab === "posts" ? "Details" : "What to bring, call time, who you need…"}
                  required={tab === "posts"}
                />
                {tab === "events" ? (
                  <>
                    <select aria-label="Event type" style={inputStyle} value={kind} onChange={(event) => setKind(event.target.value as EventKind)}>
                      {EVENT_KINDS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <input aria-label="Start time" type="datetime-local" style={inputStyle} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input aria-label="City" style={inputStyle} value={city} maxLength={80} onChange={(event) => setCity(event.target.value)} placeholder="City" />
                      <input aria-label="State" style={{ ...inputStyle, width: 90 }} value={stateCode} maxLength={4} onChange={(event) => setStateCode(event.target.value)} placeholder="State" />
                    </div>
                    <input
                      aria-label="Exact address (private)"
                      style={inputStyle}
                      value={address}
                      maxLength={240}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Exact address (only shown to people who RSVP going)"
                    />
                  </>
                ) : null}
                {formError ? <p role="alert" style={{ margin: 0 }}>{formError}</p> : null}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" style={primaryButtonStyle} disabled={busy}>
                    {tab === "posts" ? "Post" : "Create event"}
                  </button>
                  <button type="button" style={buttonStyle} onClick={() => setComposing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" style={primaryButtonStyle} onClick={() => setComposing(true)}>
                {tab === "posts" ? "New post" : "Plan an event"}
              </button>
            )
          ) : null}

          {tabLoading ? <p role="status">Loading…</p> : null}
          {tabError ? (
            <div role="alert" style={{ display: "grid", gap: 8, justifyItems: "start" }}>
              <p style={{ margin: 0 }}>{tabError}</p>
              <button type="button" style={buttonStyle} onClick={() => { setTabError(""); setTabLoading(true); setTabAttempt((n) => n + 1); }}>
                Retry
              </button>
            </div>
          ) : null}

          {!tabLoading && !tabError && tab === "posts"
            ? threads.length
              ? threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => navigate(`/forum/threads/${thread.id}`)}
                    style={{ ...cardStyle, textAlign: "left", color: "#F5F4F2", cursor: "pointer" }}
                  >
                    <strong>{thread.title}</strong>
                    <span style={{ opacity: 0.8, fontSize: 13 }}>{thread.authorName} · {formatDate(thread.createdAt)}</span>
                  </button>
                ))
              : <p>No posts yet.</p>
            : null}

          {!tabLoading && !tabError && tab === "events"
            ? events.length
              ? events.map((item) => <EventCard key={item.id} groupId={groupId} event={item} />)
              : <p>No events planned yet. Invite the group to a shoot or meetup.</p>
            : null}

          {!tabLoading && !tabError && tab === "members" ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {members.map((item) => (
                <li key={item.userId}>
                  {item.displayName}
                  {item.role === "owner" ? " (owner)" : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}
