import { useEffect, useState } from "react";
import { getCurrentUserId } from "../auth/authService";
import { isUnread, listenToMatches, listenToReads, type Match } from "../../services/messages";

export type Inbox = { matches: Match[]; reads: Record<string, number>; loading: boolean; error: string };

export function useInbox(): Inbox {
  const userId = getCurrentUserId();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [reads, setReads] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    listenToMatches(
      userId,
      (next) => {
        if (!cancelled) setMatches(next);
      },
      (message) => {
        if (!cancelled) setError(message);
      },
    )
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else stop = unsubscribe;
      })
      .catch((cause: unknown) => {
        console.error("Inbox error:", cause);
        if (!cancelled) setError("We couldn't load your matches.");
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [userId]);

  const idsKey = (matches ?? []).map((match) => match.id).join(",");
  useEffect(() => {
    if (!userId || !idsKey) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    listenToReads(userId, idsKey.split(","), (next) => {
      if (!cancelled) setReads(next);
    })
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else stop = unsubscribe;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [userId, idsKey]);

  return { matches: matches ?? [], reads, loading: matches === null && !error, error };
}

// A match needs attention if it has an unread message, or is brand new and never opened.
export function needsAttention(match: Match, userId: string, reads: Record<string, number>): boolean {
  const readAt = reads[match.id] ?? 0;
  return isUnread(match, userId, readAt) || (!match.lastSenderId && readAt === 0);
}

export function countUnread(inbox: Inbox, userId: string | null): number {
  if (!userId) return 0;
  return inbox.matches.filter((match) => needsAttention(match, userId, inbox.reads)).length;
}
