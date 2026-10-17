type FirebaseClient = {
  app: import("firebase/app").FirebaseApp;
  auth: import("firebase/auth").Auth;
  firestore: import("firebase/firestore").Firestore;
  storage: import("firebase/storage").FirebaseStorage | null;
  analytics: import("firebase/analytics").Analytics | null;
  ref: typeof import("firebase/storage").ref;
  uploadString: typeof import("firebase/storage").uploadString;
  uploadBytes: typeof import("firebase/storage").uploadBytes;
  getDownloadURL: typeof import("firebase/storage").getDownloadURL;
};

let firebaseClientPromise: Promise<FirebaseClient | null> | null = null;

export function initFirebase(): Promise<FirebaseClient | null> {
  if (firebaseClientPromise) return firebaseClientPromise;

  const initialization = initializeFirebase();
  firebaseClientPromise = initialization;
  void initialization.catch(() => {
    if (firebaseClientPromise === initialization) firebaseClientPromise = null;
  });
  return initialization;
}

async function initializeFirebase(): Promise<FirebaseClient | null> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? "";
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? "";
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "";

  const hasFirebaseConfiguration = Boolean(
    apiKey || authDomain || projectId || storageBucket || messagingSenderId || appId || measurementId,
  );
  if (!hasFirebaseConfiguration) return null;

  const missingConfiguration = [
    ["VITE_FIREBASE_API_KEY", apiKey],
    ["VITE_FIREBASE_AUTH_DOMAIN", authDomain],
    ["VITE_FIREBASE_PROJECT_ID", projectId],
    ["VITE_FIREBASE_APP_ID", appId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missingConfiguration.length) {
    throw new Error(`Firebase configuration is incomplete. Missing: ${missingConfiguration.join(", ")}.`);
  }

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
  const storage = storageBucket ? getStorage(app) : null;
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
  const analytics = measurementId && !useEmulators ? getAnalytics(app) : null;

  if (useEmulators) {
    const [{ connectAuthEmulator }, { connectFirestoreEmulator }] = await Promise.all([
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  }

  return { app, auth, firestore, storage, analytics, ref, uploadString, uploadBytes, getDownloadURL };
}

export async function uploadDataUrlToStorage(dataUrl: string, path: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");
  if (!client.storage) throw new Error("Cloud Storage is not configured.");

  const { storage, ref, uploadString, getDownloadURL } = client;
  const storageRef = ref(storage, path);
  // upload as data_url
  await uploadString(storageRef, dataUrl, "data_url");
  const url = await getDownloadURL(storageRef);
  return url as string;
}
