import { initFirebase } from "./firebaseClient";

export const MAX_MESSAGE_LENGTH = 2000;
const PREVIEW_LENGTH = 120;
const MAX_MESSAGES_LOADED = 200;

export type Match = {
  id: string;
  otherUserId: string;
  createdAt: number;
  lastMessageAt: number;
  lastMessageText: string;
  lastSenderId: string;
};

export type ChatMessage = { id: string; senderId: string; text: string; createdAt: number };

export function matchIdFor(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function otherMember(matchId: string, userId: string): string {
  const [first, second] = matchId.split("_");
  return first === userId ? (second ?? "") : (first ?? "");
}

export function previewText(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH);
}

export function validateMessage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Write a message first.";
  if (trimmed.length > MAX_MESSAGE_LENGTH) return `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`;
  return null;
}

export function isUnread(match: Pick<Match, "lastMessageAt" | "lastSenderId">, userId: string, readAt: number): boolean {
  return Boolean(match.lastSenderId) && match.lastSenderId !== userId && match.lastMessageAt > readAt;
}

type TimestampLike = { toMillis?: () => number } | null | undefined;
const millis = (value: unknown): number => {
  const stamp = value as TimestampLike;
  return typeof stamp?.toMillis === "function" ? stamp.toMillis() : 0;
};

function toMatch(id: string, data: Record<string, unknown>, userId: string): Match {
  return {
    id,
    otherUserId: otherMember(id, userId),
    createdAt: millis(data.createdAt),
    lastMessageAt: millis(data.lastMessageAt),
    lastMessageText: typeof data.lastMessageText === "string" ? data.lastMessageText : "",
    lastSenderId: typeof data.lastSenderId === "string" ? data.lastSenderId : "",
  };
}

async function requireClient(userId: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Messaging requires Firebase to be configured.");
  if (client.auth.currentUser?.uid !== userId) throw new Error("You must be signed in.");
  return client;
}

/**
 * Creates the match if the other member has already liked you. The Firestore rules check both
 * likes, so a denied write simply means there is no mutual like yet. Returns true on a new match.
 */
export async function tryCreateMatch(userId: string, otherId: string): Promise<boolean> {
  const client = await requireClient(userId);
  const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore");
  const id = matchIdFor(userId, otherId);
  const reference = doc(client.firestore, "matches", id);

  try {
    if ((await getDoc(reference)).exists()) return false;
  } catch {
    // Not readable means it doesn't exist yet.
  }

  try {
    await setDoc(reference, {
      users: id.split("_"),
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessageText: "",
      lastSenderId: "",
    });
    return true;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "permission-denied") return false;
    throw error;
  }
}

export async function listenToMatches(
  userId: string,
  onChange: (matches: Match[]) => void,
  onError: (message: string) => void,
): Promise<() => void> {
  const client = await requireClient(userId);
  const { collection, limit, onSnapshot, query, where } = await import("firebase/firestore");
  return onSnapshot(
    query(collection(client.firestore, "matches"), where("users", "array-contains", userId), limit(200)),
    (snapshot) => {
      const matches = snapshot.docs
        .map((document) => toMatch(document.id, document.data(), userId))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      onChange(matches);
    },
    (error) => {
      console.error("Unable to load matches:", error);
      onError("We couldn't load your matches. Please try again.");
    },
  );
}

export async function listenToReads(
  userId: string,
  matchIds: string[],
  onChange: (reads: Record<string, number>) => void,
): Promise<() => void> {
  const client = await requireClient(userId);
  const { doc, onSnapshot } = await import("firebase/firestore");
  const reads: Record<string, number> = {};
  const stops = matchIds.map((matchId) =>
    onSnapshot(
      doc(client.firestore, "matches", matchId, "reads", userId),
      (snapshot) => {
        reads[matchId] = millis(snapshot.data()?.readAt);
        onChange({ ...reads });
      },
      () => undefined,
    ),
  );
  return () => stops.forEach((stop) => stop());
}

export async function listenToMessages(
  userId: string,
  matchId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError: (message: string) => void,
): Promise<() => void> {
  const client = await requireClient(userId);
  const { collection, limit, onSnapshot, orderBy, query } = await import("firebase/firestore");
  return onSnapshot(
    query(collection(client.firestore, "matches", matchId, "messages"), orderBy("createdAt", "desc"), limit(MAX_MESSAGES_LOADED)),
    (snapshot) => {
      onChange(
        snapshot.docs
          .map((document) => {
            const data = document.data();
            return {
              id: document.id,
              senderId: String(data.senderId ?? ""),
              text: String(data.text ?? ""),
              createdAt: millis(data.createdAt) || Date.now(),
            };
          })
          .reverse(),
      );
    },
    (error) => {
      console.error("Unable to load messages:", error);
      onError("We couldn't load this conversation.");
    },
  );
}

export async function sendMessage(userId: string, matchId: string, text: string) {
  const problem = validateMessage(text);
  if (problem) throw new Error(problem);
  const client = await requireClient(userId);
  const { collection, doc, serverTimestamp, writeBatch } = await import("firebase/firestore");
  const trimmed = text.trim();
  const batch = writeBatch(client.firestore);
  batch.set(doc(collection(client.firestore, "matches", matchId, "messages")), {
    senderId: userId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(client.firestore, "matches", matchId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: previewText(trimmed),
    lastSenderId: userId,
  });
  await batch.commit();
}

export async function markRead(userId: string, matchId: string) {
  const client = await requireClient(userId);
  const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
  await setDoc(doc(client.firestore, "matches", matchId, "reads", userId), { readAt: serverTimestamp() });
}
