import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../authService";
import {
  searchPublicProfiles,
  type DiscoveryCursor,
  type DiscoveryFilters,
} from "../../../services/publicProfiles";
import { fetchBlockedIds } from "../../../services/forum";
import { BottomNav } from "../../community/ui";
import { fetchSwipedIds, recordSwipe, type SwipeAction } from "../../../services/swipes";
import type { PublicProfile } from "../../../types/profile";
import Filters from "./Filters";
import SwipeCard from "./SwipeCard";

const EXIT_MS = 260;
const TOP_UP_AT = 2;

type SearchRequest = { filters: DiscoveryFilters; cursor: DiscoveryCursor | null; id: number };

const pillButton = {
  borderRadius: 999,
  border: "1px solid rgba(245,244,242,0.25)",
  padding: "10px 18px",
  background: "rgba(255,255,255,0.08)",
  color: "#F5F4F2",
  cursor: "pointer",
  fontSize: 14,
} as const;

const actionButton = (color: string) =>
  ({
    width: 68,
    height: 68,
    borderRadius: "50%",
    border: `2px solid ${color}`,
    background: "rgba(5,4,8,0.55)",
    color,
    fontSize: 30,
    lineHeight: 1,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  }) as const;

export default function Discover() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<PublicProfile[]>([]);
  const [cursor, setCursor] = useState<DiscoveryCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exiting, setExiting] = useState<SwipeAction | null>(null);
  const [request, setRequest] = useState<SearchRequest>({ filters: {}, cursor: null, id: 0 });
  const swiped = useRef<Set<string> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    // Ignore results from a superseded request (e.g. filters changed mid-flight).
    let cancelled = false;
    (async () => {
      swiped.current ??= new Set([...(await fetchSwipedIds(userId)), ...(await fetchBlockedIds())]);
      const page = await searchPublicProfiles(request.filters, userId, request.cursor);
      if (cancelled) return;

      const decided = swiped.current;
      setQueue((existing) => {
        const base = request.cursor ? existing : [];
        const seen = new Set(base.map((profile) => profile.userId));
        return [...base, ...page.profiles.filter((p) => !decided.has(p.userId) && !seen.has(p.userId))];
      });
      setCursor(page.cursor);
      setHasMore(page.hasMore);

      const nothingNew = page.profiles.every((profile) => decided.has(profile.userId));
      if (nothingNew && page.hasMore) {
        // Whole page was already seen; keep paging until something new or the end.
        setRequest((current) => ({ filters: current.filters, cursor: page.cursor, id: current.id + 1 }));
        return;
      }
      setLoading(false);
    })().catch((loadError: unknown) => {
      if (cancelled) return;
      console.error("Discovery error:", loadError);
      setError("We couldn't load profiles. Check your connection and try again.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [request, navigate]);

  const startSearch = (filters: DiscoveryFilters, nextCursor: DiscoveryCursor | null) => {
    setLoading(true);
    setError("");
    setRequest((current) => ({ filters, cursor: nextCursor, id: current.id + 1 }));
  };

  const top = queue[0];

  const decide = (action: SwipeAction) => {
    const userId = getCurrentUserId();
    if (!top || busy.current || !userId) return;
    busy.current = true;
    setNotice("");
    setExiting(action);

    window.setTimeout(() => {
      recordSwipe(userId, top.userId, action)
        .then(() => {
          swiped.current?.add(top.userId);
          const remaining = queue.length - 1;
          setQueue((current) => current.filter((profile) => profile.userId !== top.userId));
          if (remaining <= TOP_UP_AT && hasMore && !loading) startSearch(request.filters, cursor);
        })
        .catch((saveError: unknown) => {
          console.error("Unable to save swipe:", saveError);
          setNotice("We couldn't save that choice. Please try again.");
        })
        .finally(() => {
          setExiting(null);
          busy.current = false;
        });
    }, EXIT_MS);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") decide("like");
      if (event.key === "ArrowLeft") decide("pass");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

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
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "calc(14px + env(safe-area-inset-top)) 20px 14px",
          maxWidth: 520,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.5 }}>The Scene</h1>
        <button
          type="button"
          style={pillButton}
          aria-expanded={showFilters}
          onClick={() => setShowFilters((open) => !open)}
        >
          Filters
        </button>
      </header>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 20px 16px",
          boxSizing: "border-box",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: 16,
        }}
      >
        {showFilters ? (
          <section aria-label="Filters" style={{ gridRow: 1 }}>
            <Filters
              filters={request.filters}
              onChange={(next) => {
                setQueue([]);
                startSearch(next, null);
              }}
            />
          </section>
        ) : null}

        <div style={{ position: "relative", minHeight: 360, maxHeight: 620, gridRow: 2 }}>
          {queue[1] ? (
            <div style={{ position: "absolute", inset: 0, transform: "scale(0.95) translateY(14px)", opacity: 0.6 }}>
              <SwipeCard key={queue[1].userId} profile={queue[1]} interactive={false} exiting={null} onSwipe={() => undefined} />
            </div>
          ) : null}
          {top ? (
            <SwipeCard
              key={top.userId}
              profile={top}
              interactive
              exiting={exiting}
              onSwipe={decide}
              onOpen={() => navigate(`/members/${top.userId}`)}
            />
          ) : (
            <div
              role={error ? "alert" : "status"}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 28,
                display: "grid",
                placeContent: "center",
                justifyItems: "center",
                gap: 14,
                textAlign: "center",
                padding: 24,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(245,244,242,0.16)",
              }}
            >
              {loading ? (
                <p style={{ margin: 0 }}>Finding creatives…</p>
              ) : error ? (
                <>
                  <p style={{ margin: 0 }}>{error}</p>
                  <button type="button" style={pillButton} onClick={() => startSearch(request.filters, null)}>
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ margin: 0 }}>You're all caught up</h2>
                  <p style={{ margin: 0, opacity: 0.85 }}>
                    No more creatives match right now. Try different filters or check back soon.
                  </p>
                  <button type="button" style={pillButton} onClick={() => startSearch(request.filters, null)}>
                    Refresh
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10, justifyItems: "center", gridRow: 3 }}>
          <div style={{ display: "flex", gap: 36 }}>
            <button
              type="button"
              aria-label="Pass"
              disabled={!top || Boolean(exiting)}
              onClick={() => decide("pass")}
              style={{ ...actionButton("#F7326D"), opacity: top ? 1 : 0.4 }}
            >
              ✕
            </button>
            <button
              type="button"
              aria-label="Like"
              disabled={!top || Boolean(exiting)}
              onClick={() => decide("like")}
              style={{ ...actionButton("#4ade80"), opacity: top ? 1 : 0.4 }}
            >
              ♥
            </button>
          </div>
          <p role="status" style={{ margin: 0, fontSize: 13, opacity: 0.75, textAlign: "center" }}>
            {notice || "Swipe or use ← → keys. Likes are saved privately; matching isn't live yet."}
          </p>
        </div>
      </main>

      <BottomNav active="discover" onError={setNotice} />
    </div>
  );
}
