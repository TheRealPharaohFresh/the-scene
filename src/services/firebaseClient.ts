export async function initFirebase() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? "";
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? "";

  if (!apiKey || !projectId) return null;

  // Dynamically import firebase modules so the app still works if SDK isn't installed yet.
  const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage, ref, uploadString, uploadBytes, getDownloadURL }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
  ]);

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  return { app, auth, firestore, storage, ref, uploadString, uploadBytes, getDownloadURL };
}

export async function uploadDataUrlToStorage(dataUrl: string, path: string) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase not configured");

  const { storage, ref, uploadString, getDownloadURL } = client as any;
  const storageRef = ref(storage, path);
  // upload as data_url
  await uploadString(storageRef, dataUrl, "data_url");
  const url = await getDownloadURL(storageRef);
  return url as string;
}
