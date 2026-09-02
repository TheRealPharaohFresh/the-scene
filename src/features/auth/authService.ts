import { initFirebase } from "../../services/firebaseClient";

export type RegisterPayload = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  uid: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileComplete: boolean;
};

const AUTH_USER_KEY = "the-scene-auth-user";
const PROFILE_COMPLETE_KEY = "the-scene-profile-complete";

function readStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getCurrentUserId(): string | null {
  const stored = readStoredUser();
  if (stored?.uid) return stored.uid;
  return null;
}

export function getCurrentUser(): AuthUser | null {
  return readStoredUser();
}

export function hasCompletedProfile(): boolean {
  const storedUser = readStoredUser();
  if (storedUser) {
    return storedUser.profileComplete || window.localStorage.getItem(PROFILE_COMPLETE_KEY) === "true";
  }

  return window.localStorage.getItem(PROFILE_COMPLETE_KEY) === "true";
}

export function markProfileComplete() {
  const storedUser = readStoredUser();
  if (storedUser) {
    const updatedUser = { ...storedUser, profileComplete: true };
    writeStoredUser(updatedUser);
  }
  window.localStorage.setItem(PROFILE_COMPLETE_KEY, "true");
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(PROFILE_COMPLETE_KEY);
}

export async function listenForAuthState(callback: (user: AuthUser | null) => void) {
  const client = await initFirebase();
  if (!client || !client.auth) {
    const user = readStoredUser();
    callback(user ?? null);
    return () => undefined;
  }

  const { onAuthStateChanged } = await import("firebase/auth");

  return onAuthStateChanged(client.auth, (firebaseUser) => {
    if (!firebaseUser) {
      clearAuthSession();
      callback(null);
      return;
    }

    const current = readStoredUser();
    const nextUser: AuthUser = {
      uid: firebaseUser.uid,
      userId: firebaseUser.uid,
      username: firebaseUser.displayName || current?.username || "",
      email: firebaseUser.email || current?.email || "",
      firstName: current?.firstName || "",
      lastName: current?.lastName || "",
      profileComplete: hasCompletedProfile(),
    };

    writeStoredUser(nextUser);
    callback(nextUser);
  });
}

async function ensureUserDocument(userId: string, profile: Partial<AuthUser>) {
  const client = await initFirebase();
  if (!client || !client.firestore) return;

  const { doc, setDoc } = await import("firebase/firestore");
  const ref = doc(client.firestore, "users", userId);
  await setDoc(ref, {
    uid: userId,
    username: profile.username ?? "",
    email: profile.email ?? "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    profileComplete: false,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function registerUser(payload: RegisterPayload) {
  const sanitizedEmail = payload.email.trim().toLowerCase();
  const sanitizedUsername = payload.username.trim();

  if (!sanitizedUsername) {
    throw new Error("Username is required.");
  }

  if (!sanitizedEmail || !payload.password) {
    throw new Error("Email and password are required.");
  }

  if (payload.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const client = await initFirebase();
  if (!client || !client.auth) {
    throw new Error("Firebase auth is not configured. Please add your Firebase environment variables.");
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
  const credential = await createUserWithEmailAndPassword(client.auth, sanitizedEmail, payload.password);

  if (client.auth.currentUser) {
    await updateProfile(client.auth.currentUser, { displayName: sanitizedUsername });
  }

  const user: AuthUser = {
    uid: credential.user.uid,
    userId: credential.user.uid,
    username: sanitizedUsername,
    email: sanitizedEmail,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    profileComplete: false,
  };

  try {
    await ensureUserDocument(credential.user.uid, user);
  } catch (error) {
    console.warn("User profile document could not be created yet:", error);
  }

  writeStoredUser(user);
  window.localStorage.setItem(PROFILE_COMPLETE_KEY, "false");
  return user;
}

export async function loginUser(payload: LoginPayload) {
  const sanitizedEmail = payload.email.trim().toLowerCase();

  if (!sanitizedEmail || !payload.password) {
    throw new Error("Email and password are required.");
  }

  const client = await initFirebase();
  if (!client || !client.auth) {
    throw new Error("Firebase auth is not configured. Please add your Firebase environment variables.");
  }

  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const credential = await signInWithEmailAndPassword(client.auth, sanitizedEmail, payload.password);

  const userDoc = readStoredUser();
  const resolvedUser: AuthUser = {
    uid: credential.user.uid,
    userId: credential.user.uid,
    username: credential.user.displayName || userDoc?.username || "",
    email: credential.user.email || sanitizedEmail,
    firstName: userDoc?.firstName || "",
    lastName: userDoc?.lastName || "",
    profileComplete: hasCompletedProfile(),
  };

  writeStoredUser(resolvedUser);
  return resolvedUser;
}
