// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { doc, getDoc } from "firebase/firestore";
import {
  getCurrentUserId,
  listenForAuthState,
  loginUser,
  logoutUser,
  registerUser,
  sendPasswordReset,
} from "../src/features/auth/authService";
import { fetchUserProfile, saveUserProfile } from "../src/services/firebase";
import { initFirebase } from "../src/services/firebaseClient";
import type { UserProfile } from "../src/types/profile";

const projectId = "demo-the-scene";
let authEmulatorAccountsUrl: string;

function validProfile(userId: string): UserProfile {
  return {
    userId,
    displayName: "Demo Creative",
    gender: "Prefer not to say",
    entertainmentCategory: "Music",
    roles: ["Producer"],
    bio: "A profile created against local emulators.",
    stateCode: "NY",
    city: "New York",
    portfolioUrl: "",
    socialMedia: { instagram: "" },
    lookingFor: ["Networking"],
    createdAt: new Date().toISOString(),
  };
}

beforeAll(() => {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "demo-api-key");
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "localhost");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", projectId);
  vi.stubEnv("VITE_FIREBASE_APP_ID", "demo-app-id");
  vi.stubEnv("VITE_USE_FIREBASE_EMULATORS", "true");
  authEmulatorAccountsUrl = `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`;
});

afterEach(async () => {
  await logoutUser();
  window.localStorage.clear();
  const response = await fetch(authEmulatorAccountsUrl, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Could not clear local Auth emulator test accounts: ${response.status}.`);
  }
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Auth and profile flows against local Firebase emulators", () => {
  it("registers, persists and reloads a profile, restores auth, logs out, and sends a reset email", async () => {
    const email = `creative-${randomUUID()}@example.test`;
    const password = "Test-password-123";
    const registeredUser = await registerUser({
      username: "demo-creative",
      email,
      firstName: "Demo",
      lastName: "Creative",
      password,
      adultAttested: true,
    });
    expect(registeredUser.profileComplete).toBe(false);

    const client = await initFirebase();
    if (!client) throw new Error("Firebase emulator client did not initialize.");
    const accountSnapshot = await getDoc(doc(client.firestore, "users", registeredUser.uid));
    expect(accountSnapshot.data()?.adultAttested).toBe(true);
    expect(accountSnapshot.data()?.adultAttestedAt).toBeDefined();

    const profile = validProfile(registeredUser.uid);
    await saveUserProfile(registeredUser.uid, profile);
    await saveUserProfile(registeredUser.uid, {
      ...profile,
      bio: "Updated against the local Firestore emulator.",
      city: "Brooklyn",
    });
    await logoutUser();
    expect(getCurrentUserId()).toBeNull();

    const signedInUser = await loginUser({ email, password });
    expect(signedInUser.uid).toBe(registeredUser.uid);
    expect(signedInUser.profileComplete).toBe(true);
    expect(await fetchUserProfile(registeredUser.uid)).toMatchObject({
      userId: registeredUser.uid,
      displayName: "Demo Creative",
      city: "Brooklyn",
      bio: "Updated against the local Firestore emulator.",
    });

    let unsubscribe: () => void = () => {};
    const restoredUser = await new Promise<{ uid: string; profileComplete: boolean }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out waiting for auth restore.")), 5000);
        void listenForAuthState((user) => {
          if (user?.uid !== registeredUser.uid || user.profileStatusError) return;
          clearTimeout(timeout);
          resolve(user);
        }).then((stop) => {
          unsubscribe = stop;
        }, reject);
      },
    );
    unsubscribe();
    expect(restoredUser).toMatchObject({ uid: registeredUser.uid, profileComplete: true });

    await sendPasswordReset(email);
    await logoutUser();
  });

  it("rejects registration when the adult self-attestation is missing", async () => {
    await expect(
      registerUser({
        username: "not-attested",
        email: `not-attested-${randomUUID()}@example.test`,
        firstName: "Demo",
        lastName: "User",
        password: "Test-password-123",
        adultAttested: false,
      }),
    ).rejects.toThrow("at least 18");
  });
});
