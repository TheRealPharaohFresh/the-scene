import { initFirebase } from "./firebaseClient";

export type SwipeAction = "like" | "pass";

const MAX_SWIPES_LOADED = 2000;

export async function fetchSwipedIds(userId: string): Promise<Set<string>> {
  const client = await initFirebase();
  if (!client) throw new Error("Discovery requires Firebase to be configured.");
  if (client.auth.currentUser?.uid !== userId) throw new Error("You must be signed in.");

  const { collection, getDocs, limit, query } = await import("firebase/firestore");
  const snapshot = await getDocs(
    query(collection(client.firestore, "swipes", userId, "items"), limit(MAX_SWIPES_LOADED)),
  );
  return new Set(snapshot.docs.map((document) => document.id));
}

export async function recordSwipe(userId: string, targetId: string, action: SwipeAction) {
  const client = await initFirebase();
  if (!client) throw new Error("Discovery requires Firebase to be configured.");
  if (client.auth.currentUser?.uid !== userId) throw new Error("You must be signed in.");
  if (!targetId || targetId === userId) throw new Error("Invalid profile.");

  const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
  await setDoc(doc(client.firestore, "swipes", userId, "items", targetId), {
    targetId,
    action,
    createdAt: serverTimestamp(),
  });
}
