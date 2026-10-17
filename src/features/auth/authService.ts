import { initFirebase } from "../../services/firebaseClient";

export type RegisterPayload = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  adultAttested: boolean;
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
  profileStatusError?: string;
};

const AUTH_USER_KEY = "the-scene-auth-user";

function firebaseErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

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

export function hasCompletedProfile(userId?: string | null): boolean {
  const storedUser = readStoredUser();
  if (!storedUser || (userId !== undefined && (!userId || storedUser.uid !== userId))) return false;
  return storedUser.profileComplete;
}

export function markProfileComplete() {
  const storedUser = readStoredUser();
  if (!storedUser) throw new Error("No signed-in user is available to mark the profile complete.");
  writeStoredUser({ ...storedUser, profileComplete: true });
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export async function listenForAuthState(callback: (user: AuthUser | null) => void) {
  const client = await initFirebase();
  if (!client || !client.auth) {
    const user = readStoredUser();
    callback(user ?? null);
    return () => undefined;
  }

  const { onAuthStateChanged } = await import("firebase/auth");

  let authStateVersion = 0;
  return onAuthStateChanged(client.auth, (firebaseUser) => {
    authStateVersion += 1;
    const currentVersion = authStateVersion;
    if (!firebaseUser) {
      clearAuthSession();
      callback(null);
      return;
    }

    const current = readStoredUser();
    const currentAccount = current?.uid === firebaseUser.uid ? current : null;
    const nextUser: AuthUser = {
      uid: firebaseUser.uid,
      userId: firebaseUser.uid,
      username: firebaseUser.displayName || currentAccount?.username || "",
      email: firebaseUser.email || currentAccount?.email || "",
      firstName: currentAccount?.firstName || "",
      lastName: currentAccount?.lastName || "",
      profileComplete: hasCompletedProfile(firebaseUser.uid),
    };

    void (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const profileSnapshot = await getDoc(doc(client.firestore, "profiles", firebaseUser.uid));
        if (currentVersion !== authStateVersion || client.auth.currentUser?.uid !== firebaseUser.uid) return;

        nextUser.profileComplete = profileSnapshot.exists();
        writeStoredUser(nextUser);
        callback(nextUser);
      } catch (error) {
        if (currentVersion !== authStateVersion || client.auth.currentUser?.uid !== firebaseUser.uid) return;
        console.error("Unable to verify profile completion with Firestore:", error);
        callback({
          ...nextUser,
          profileStatusError: "Your profile status could not be verified. Check your connection and try again.",
        });
      }
    })();
  });
}

async function ensureUserDocument(userId: string, profile: Partial<AuthUser>) {
  const client = await initFirebase();
  if (!client || !client.firestore) return;

  const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
  const ref = doc(client.firestore, "users", userId);
  await setDoc(ref, {
    uid: userId,
    username: profile.username ?? "",
    email: profile.email ?? "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    adultAttested: true,
    adultAttestedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function registerUser(payload: RegisterPayload) {
  const sanitizedEmail = payload.email.trim().toLowerCase();
  const sanitizedUsername = payload.username.trim();
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();

  if (!sanitizedUsername) {
    throw new Error("Username is required.");
  }
  if (sanitizedUsername.length > 30) {
    throw new Error("Username must be 30 characters or fewer.");
  }

  if (!sanitizedEmail || !payload.password || !firstName || !lastName) {
    throw new Error("Email, password, first name, and last name are required.");
  }
  if (firstName.length > 80 || lastName.length > 80) {
    throw new Error("First and last names must be 80 characters or fewer.");
  }
  if (!payload.adultAttested) {
    throw new Error("You must confirm that you are at least 18 to create an account.");
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

  const user: AuthUser = {
    uid: credential.user.uid,
    userId: credential.user.uid,
    username: sanitizedUsername,
    email: sanitizedEmail,
    firstName,
    lastName,
    profileComplete: false,
  };

  try {
    await updateProfile(credential.user, { displayName: sanitizedUsername });
    await ensureUserDocument(credential.user.uid, user);
  } catch (error) {
    try {
      const { deleteUser } = await import("firebase/auth");
      await deleteUser(credential.user);
    } catch (cleanupError) {
      throw new Error(
        "Account setup could not be completed, and the new sign-in account could not be removed. Please contact support before trying again.",
        { cause: cleanupError },
      );
    }
    throw new Error("Account setup could not be completed. The new account was removed; please try again.", {
      cause: error,
    });
  }

  writeStoredUser(user);
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

  const cachedUser = readStoredUser();
  const userDoc = cachedUser?.uid === credential.user.uid ? cachedUser : null;
  let profileComplete: boolean;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const profileSnapshot = await getDoc(doc(client.firestore, "profiles", credential.user.uid));
    profileComplete = profileSnapshot.exists();
  } catch (error) {
    throw new Error("Signed in, but your profile status could not be verified. Check your connection and try again.", {
      cause: error,
    });
  }

  const resolvedUser: AuthUser = {
    uid: credential.user.uid,
    userId: credential.user.uid,
    username: credential.user.displayName || userDoc?.username || "",
    email: credential.user.email || sanitizedEmail,
    firstName: userDoc?.firstName || "",
    lastName: userDoc?.lastName || "",
    profileComplete,
  };

  writeStoredUser(resolvedUser);
  return resolvedUser;
}

export async function sendPasswordReset(email: string) {
  const sanitizedEmail = email.trim().toLowerCase();
  if (!sanitizedEmail) throw new Error("Email is required.");

  const client = await initFirebase();
  if (!client) {
    throw new Error("Firebase auth is not configured. Please add your Firebase environment variables.");
  }

  const { sendPasswordResetEmail } = await import("firebase/auth");
  try {
    await sendPasswordResetEmail(client.auth, sanitizedEmail);
  } catch (error) {
    if (firebaseErrorCode(error) === "auth/user-not-found") return;
    throw error;
  }
}

export async function logoutUser() {
  const client = await initFirebase();
  if (client?.auth) {
    const { signOut } = await import("firebase/auth");
    await signOut(client.auth);
  }
  clearAuthSession();
}
