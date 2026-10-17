import type { DocumentData } from "firebase/firestore";
import { initFirebase } from "./firebaseClient";

export const BUSINESS_KINDS = [
  "Record label",
  "Talent agency",
  "Production company",
  "Studio",
  "Management",
  "Other",
] as const;
export type BusinessKind = (typeof BUSINESS_KINDS)[number];

export const LISTING_CATEGORIES = [
  "Acting",
  "Music",
  "Film & video",
  "Dance",
  "Modeling",
  "Crew & production",
  "Other",
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ListingStatus = ReviewStatus | "closed";

export type Business = {
  id: string;
  name: string;
  kind: BusinessKind;
  website: string;
  description: string;
  status: ReviewStatus;
  createdAt: Date;
};

export type Listing = {
  id: string;
  ownerId: string;
  businessName: string;
  title: string;
  category: ListingCategory;
  description: string;
  location: string;
  compensation: string;
  status: ListingStatus;
  createdAt: Date;
};

export type ReportRecord = {
  id: string;
  targetType: string;
  targetPath: string;
  reason: string;
  createdAt: Date;
};

type FirestoreModule = typeof import("firebase/firestore");

async function context() {
  const client = await initFirebase();
  if (!client) throw new Error("Opportunities require Firebase to be configured.");
  const uid = client.auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  const fs: FirestoreModule = await import("firebase/firestore");
  return { db: client.firestore, uid, fs };
}

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

function date(value: unknown) {
  const maybe = value as { toDate?: () => Date } | null;
  return maybe && typeof maybe.toDate === "function" ? maybe.toDate() : new Date(0);
}

function pick<T extends readonly string[]>(options: T, value: unknown, fallback: T[number]): T[number] {
  return options.find((option) => option === value) ?? fallback;
}

function reviewStatus(value: unknown): ReviewStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function toBusiness(id: string, data: DocumentData): Business {
  return {
    id,
    name: str(data.name, 80),
    kind: pick(BUSINESS_KINDS, data.kind, "Other"),
    website: str(data.website, 200),
    description: str(data.description, 600),
    status: reviewStatus(data.status),
    createdAt: date(data.createdAt),
  };
}

function toListing(id: string, data: DocumentData): Listing {
  const status: ListingStatus = data.status === "closed" ? "closed" : reviewStatus(data.status);
  return {
    id,
    ownerId: str(data.ownerId, 128),
    businessName: str(data.businessName, 80),
    title: str(data.title, 120),
    category: pick(LISTING_CATEGORIES, data.category, "Other"),
    description: str(data.description, 2000),
    location: str(data.location, 80),
    compensation: str(data.compensation, 120),
    status,
    createdAt: date(data.createdAt),
  };
}

const newestFirst = <T extends { createdAt: Date }>(items: T[]) =>
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export async function isAdmin(): Promise<boolean> {
  try {
    const { db, uid, fs } = await context();
    return (await fs.getDoc(fs.doc(db, "admins", uid))).exists();
  } catch {
    return false;
  }
}

export async function getMyBusiness(): Promise<Business | null> {
  const { db, uid, fs } = await context();
  const snapshot = await fs.getDoc(fs.doc(db, "businesses", uid));
  return snapshot.exists() ? toBusiness(snapshot.id, snapshot.data()) : null;
}

export async function applyForBusiness(input: {
  name: string;
  kind: BusinessKind;
  website: string;
  description: string;
}) {
  const { db, uid, fs } = await context();
  await fs.setDoc(fs.doc(db, "businesses", uid), {
    ownerId: uid,
    name: input.name.trim(),
    kind: input.kind,
    website: input.website.trim(),
    description: input.description.trim(),
    status: "pending",
    createdAt: fs.serverTimestamp(),
  });
}

export async function listApprovedListings(): Promise<Listing[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "listings"), fs.where("status", "==", "approved"), fs.limit(100)),
  );
  return newestFirst(snapshot.docs.map((item) => toListing(item.id, item.data())));
}

export async function listMyListings(): Promise<Listing[]> {
  const { db, uid, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "listings"), fs.where("ownerId", "==", uid), fs.limit(100)),
  );
  return newestFirst(snapshot.docs.map((item) => toListing(item.id, item.data())));
}

export async function createListing(
  businessName: string,
  input: { title: string; category: ListingCategory; description: string; location: string; compensation: string },
) {
  const { db, uid, fs } = await context();
  await fs.addDoc(fs.collection(db, "listings"), {
    ownerId: uid,
    businessName,
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    location: input.location.trim(),
    compensation: input.compensation.trim(),
    status: "pending",
    createdAt: fs.serverTimestamp(),
  });
}

export async function closeListing(listingId: string) {
  const { db, fs } = await context();
  await fs.updateDoc(fs.doc(db, "listings", listingId), { status: "closed" });
}

export async function listByStatus(kind: "businesses" | "listings", status: ReviewStatus) {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, kind), fs.where("status", "==", status), fs.limit(100)),
  );
  return snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
}

export async function listPendingBusinesses(): Promise<Business[]> {
  return newestFirst((await listByStatus("businesses", "pending")).map((item) => toBusiness(item.id, item.data)));
}

export async function listPendingListings(): Promise<Listing[]> {
  return newestFirst((await listByStatus("listings", "pending")).map((item) => toListing(item.id, item.data)));
}

export async function reviewItem(kind: "businesses" | "listings", id: string, status: "approved" | "rejected") {
  const { db, fs } = await context();
  await fs.updateDoc(fs.doc(db, kind, id), { status, reviewedAt: fs.serverTimestamp() });
}

export async function listReports(): Promise<ReportRecord[]> {
  const { db, fs } = await context();
  const snapshot = await fs.getDocs(fs.query(fs.collection(db, "reports"), fs.limit(100)));
  return newestFirst(
    snapshot.docs.map((item) => ({
      id: item.id,
      targetType: str(item.data().targetType, 20),
      targetPath: str(item.data().targetPath, 200),
      reason: str(item.data().reason, 500),
      createdAt: date(item.data().createdAt),
    })),
  );
}

export async function dismissReport(reportId: string) {
  const { db, fs } = await context();
  await fs.deleteDoc(fs.doc(db, "reports", reportId));
}
