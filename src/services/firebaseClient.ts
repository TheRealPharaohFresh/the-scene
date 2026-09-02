type FirebaseClient = {
  app: import("firebase/app").FirebaseApp;
  auth: import("firebase/auth").Auth;
  firestore: import("firebase/firestore").Firestore;
  storage: import("firebase/storage").FirebaseStorage;
  analytics: import("firebase/analytics").Analytics | null;
  ref: typeof import("firebase/storage").ref;
  uploadString: typeof import("firebase/storage").uploadString;
  uploadBytes: typeof import("firebase/storage").uploadBytes;
  getDownloadURL: typeof import("firebase/storage").getDownloadURL;
};

let firebaseClientPromise: Promise<FirebaseClient | null> | null = null;

export function initFirebase(): Promise<FirebaseClient | null> {
  if (firebaseClientPromise) return firebaseClientPromise;

  firebaseClientPromise = initializeFirebase();
  return firebaseClientPromise;
}

async function initializeFirebase(): Promise<FirebaseClient | null> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? "";
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? "";
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "";

  if (!apiKey || !projectId) return null;

  // Dynamically import firebase modules so the app still works if SDK isn't installed yet.
  const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage, ref, uploadString, uploadBytes, getDownloadURL }, { getAnalytics }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
    import("firebase/analytics"),
  ]);

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };

  const { getApps } = await import("firebase/app");
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const analytics = measurementId ? getAnalytics(app) : null;

  return { app, auth, firestore, storage, analytics, ref, uploadString, uploadBytes, getDownloadURL };
}

export async function uploadDataUrlToStorage(dataUrl: string, path: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");

  const { storage, ref, uploadString, getDownloadURL } = client;
  const storageRef = ref(storage, path);
  // upload as data_url
  await uploadString(storageRef, dataUrl, "data_url");
  const url = await getDownloadURL(storageRef);
  return url as string;
}
