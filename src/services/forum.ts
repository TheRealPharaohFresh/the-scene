import type { DocumentData, Firestore } from "firebase/firestore";
import { initFirebase } from "./firebaseClient";

export const EVENT_KINDS = [
  "Music video",
  "Film shoot",
  "Photo shoot",
  "Audition / casting",
  "Meetup",
  "Other",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const RSVP_STATUSES = ["going", "maybe", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type Thread = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  groupId: string | null;
  createdAt: Date;
};

export type Reply = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

export type Group = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: Date;
};

export type GroupMember = { userId: string; displayName: string; role: "owner" | "member" };

export type GroupEvent = {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  kind: EventKind;
  startsAt: Date;
  city: string;
  stateCode: string;
};

export type ReportTarget = "thread" | "reply" | "group" | "event" | "member";

type Firestore_ = typeof import("firebase/firestore");
type Context = { db: Firestore; uid: string; fs: Firestore_ };

async function context(): Promise<Context> {
  const client = await initFirebase();
  if (!client) throw new Error("Community features require Firebase to be configured.");
  const uid = client.auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return { db: client.firestore, uid, fs: await import("firebase/firestore") };
}

async function myName({ db, uid, fs }: Context) {
  const snapshot = await fs.getDoc(fs.doc(db, "profiles", uid));
  const name = snapshot.data()?.displayName;
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Finish your profile before using the community.");
  }
  return name;
}

function str(value: unknown, max = 5000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function date(value: unknown) {
  const maybe = value as { toDate?: () => Date } | null;
  return maybe && typeof maybe.toDate === "function" ? maybe.toDate() : new Date();
}

function toThread(id: string, data: DocumentData): Thread {
  return {
    id,
    authorId: str(data.authorId, 128),
    authorName: str(data.authorName, 80),
    title: str(data.title, 140),
    body: str(data.body),
    groupId: typeof data.groupId === "string" ? data.groupId : null,
    createdAt: date(data.createdAt),
  };
}

function toGroup(id: string, data: DocumentData): Group {
  return {
    id,
    ownerId: str(data.ownerId, 128),
    name: str(data.name, 80),
    description: str(data.description, 600),
    createdAt: date(data.createdAt),
  };
}

function toEvent(id: string, data: DocumentData): GroupEvent {
  const kind = EVENT_KINDS.find((option) => option === data.kind) ?? "Other";
  return {
    id,
    hostId: str(data.hostId, 128),
    hostName: str(data.hostName, 80),
    title: str(data.title, 120),
    description: str(data.description, 1200),
    kind,
    startsAt: date(data.startsAt),
    city: str(data.city, 80),
    stateCode: str(data.stateCode, 4),
  };
}

export const THREAD_PAGE_SIZE = 25;

// groupId == null lists the open forum; a group id lists that group's posts (members only).
export async function listThreads(groupId: string | null): Promise<Thread[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(
      fs.collection(db, "threads"),
      fs.where("groupId", "==", groupId),
      fs.orderBy("createdAt", "desc"),
      fs.limit(THREAD_PAGE_SIZE),
    ),
  );
  return snapshot.docs.map((item) => toThread(item.id, item.data()));
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const { db, fs } = await context();
  const snapshot = await fs.getDoc(fs.doc(db, "threads", threadId));
  return snapshot.exists() ? toThread(snapshot.id, snapshot.data()) : null;
}

export async function createThread(input: { title: string; body: string; groupId: string | null }) {
  const ctx = await context();
  const authorName = await myName(ctx);
  const { db, uid, fs } = ctx;
  const ref = await fs.addDoc(fs.collection(db, "threads"), {
    authorId: uid,
    authorName,
    title: input.title.trim(),
    body: input.body.trim(),
    groupId: input.groupId,
    createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function listReplies(threadId: string): Promise<Reply[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "threads", threadId, "replies"), fs.orderBy("createdAt", "asc"), fs.limit(200)),
  );
  return snapshot.docs.map((item) => ({
    id: item.id,
    authorId: str(item.data().authorId, 128),
    authorName: str(item.data().authorName, 80),
    body: str(item.data().body),
    createdAt: date(item.data().createdAt),
  }));
}

export async function createReply(threadId: string, body: string) {
  const ctx = await context();
  const authorName = await myName(ctx);
  const { db, uid, fs } = ctx;
  await fs.addDoc(fs.collection(db, "threads", threadId, "replies"), {
    authorId: uid,
    authorName,
    body: body.trim(),
    createdAt: fs.serverTimestamp(),
  });
}

export async function listGroups(): Promise<Group[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "groups"), fs.orderBy("createdAt", "desc"), fs.limit(50)),
  );
  return snapshot.docs.map((item) => toGroup(item.id, item.data()));
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const { db, fs } = await context();
  const snapshot = await fs.getDoc(fs.doc(db, "groups", groupId));
  return snapshot.exists() ? toGroup(snapshot.id, snapshot.data()) : null;
}

export async function createGroup(input: { name: string; description: string }) {
  const ctx = await context();
  const displayName = await myName(ctx);
  const { db, uid, fs } = ctx;
  const groupRef = fs.doc(fs.collection(db, "groups"));
  // The owner membership is created with the group so a group never exists without its owner.
  const batch = fs.writeBatch(db);
  batch.set(groupRef, {
    ownerId: uid,
    name: input.name.trim(),
    description: input.description.trim(),
    createdAt: fs.serverTimestamp(),
  });
  batch.set(fs.doc(db, "groups", groupRef.id, "members", uid), {
    userId: uid,
    displayName,
    role: "owner",
    joinedAt: fs.serverTimestamp(),
  });
  await batch.commit();
  return groupRef.id;
}

export async function isMember(groupId: string): Promise<boolean> {
  const { db, uid, fs } = await context();
  return (await fs.getDoc(fs.doc(db, "groups", groupId, "members", uid))).exists();
}

export async function joinGroup(groupId: string) {
  const ctx = await context();
  const displayName = await myName(ctx);
  const { db, uid, fs } = ctx;
  await fs.setDoc(fs.doc(db, "groups", groupId, "members", uid), {
    userId: uid,
    displayName,
    role: "member",
    joinedAt: fs.serverTimestamp(),
  });
}

export async function leaveGroup(groupId: string) {
  const { db, uid, fs } = await context();
  await fs.deleteDoc(fs.doc(db, "groups", groupId, "members", uid));
}

export async function listMembers(groupId: string): Promise<GroupMember[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(fs.query(fs.collection(db, "groups", groupId, "members"), fs.limit(200)));
  return snapshot.docs.map((item) => ({
    userId: str(item.data().userId, 128),
    displayName: str(item.data().displayName, 80),
    role: item.data().role === "owner" ? "owner" : "member",
  }));
}

export async function listEvents(groupId: string): Promise<GroupEvent[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "groups", groupId, "events"), fs.orderBy("startsAt", "asc"), fs.limit(50)),
  );
  return snapshot.docs.map((item) => toEvent(item.id, item.data()));
}

export async function createEvent(
  groupId: string,
  input: {
    title: string;
    description: string;
    kind: EventKind;
    startsAt: Date;
    city: string;
    stateCode: string;
    address: string;
  },
) {
  const ctx = await context();
  const hostName = await myName(ctx);
  const { db, uid, fs } = ctx;
  const eventRef = fs.doc(fs.collection(db, "groups", groupId, "events"));
  const batch = fs.writeBatch(db);
  batch.set(eventRef, {
    hostId: uid,
    hostName,
    title: input.title.trim(),
    description: input.description.trim(),
    kind: input.kind,
    startsAt: fs.Timestamp.fromDate(input.startsAt),
    city: input.city.trim(),
    stateCode: input.stateCode.trim().toUpperCase(),
    createdAt: fs.serverTimestamp(),
  });
  // The exact address lives in a separate document that only the host and "going" members can read.
  if (input.address.trim()) {
    batch.set(fs.doc(db, "groups", groupId, "events", eventRef.id, "private", "details"), {
      address: input.address.trim(),
    });
  }
  await batch.commit();
  return eventRef.id;
}

export async function getMyRsvp(groupId: string, eventId: string): Promise<RsvpStatus | null> {
  const { db, uid, fs } = await context();
  const snapshot = await fs.getDoc(fs.doc(db, "groups", groupId, "events", eventId, "rsvps", uid));
  return RSVP_STATUSES.find((status) => status === snapshot.data()?.status) ?? null;
}

export async function setRsvp(groupId: string, eventId: string, status: RsvpStatus) {
  const ctx = await context();
  const displayName = await myName(ctx);
  const { db, uid, fs } = ctx;
  await fs.setDoc(fs.doc(db, "groups", groupId, "events", eventId, "rsvps", uid), {
    userId: uid,
    displayName,
    status,
    updatedAt: fs.serverTimestamp(),
  });
}

export async function listGoing(groupId: string, eventId: string): Promise<string[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "groups", groupId, "events", eventId, "rsvps"), fs.where("status", "==", "going"), fs.limit(200)),
  );
  return snapshot.docs.map((item) => str(item.data().displayName, 80));
}

// Returns null when the caller is neither the host nor RSVP'd "going" (rules deny the read).
export async function getEventAddress(groupId: string, eventId: string): Promise<string | null> {
  const { db, fs } = await context();
  try {
    const snapshot = await fs.getDoc(fs.doc(db, "groups", groupId, "events", eventId, "private", "details"));
    return snapshot.exists() ? str(snapshot.data().address, 240) : null;
  } catch {
    return null;
  }
}

export async function reportContent(targetType: ReportTarget, targetPath: string, reason: string) {
  const { db, uid, fs } = await context();
  await fs.addDoc(fs.collection(db, "reports"), {
    reporterId: uid,
    targetType,
    targetPath,
    reason: reason.trim(),
    createdAt: fs.serverTimestamp(),
  });
}

export async function blockMember(targetId: string) {
  const { db, uid, fs } = await context();
  await fs.setDoc(fs.doc(db, "blocks", uid, "items", targetId), { targetId, createdAt: fs.serverTimestamp() });
}

export async function fetchBlockedIds(): Promise<Set<string>> {
  const { db, uid, fs } = await context();
  const snapshot = await fs.getDocs(fs.query(fs.collection(db, "blocks", uid, "items"), fs.limit(1000)));
  return new Set(snapshot.docs.map((item) => item.id));
}
