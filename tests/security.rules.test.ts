import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const projectId = "demo-the-scene";
const testEnvironmentPromise = initializeTestEnvironment({
  projectId,
  firestore: {
    rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
  },
  storage: {
    rules: readFileSync(new URL("../storage.rules", import.meta.url), "utf8"),
  },
});

let testEnvironment: RulesTestEnvironment;

const validProfile = (userId: string) => ({
  userId,
  displayName: "A Creative",
  gender: "Prefer not to say",
  entertainmentCategory: "Music",
  roles: ["Producer"],
  bio: "Creative professional.",
  stateCode: "NY",
  city: "New York",
  portfolioUrl: "",
  socialMedia: { instagram: "" },
  lookingFor: ["Networking"],
  createdAt: new Date().toISOString(),
});

beforeAll(async () => {
  testEnvironment = await testEnvironmentPromise;
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.clearStorage();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("Firestore and Storage security rules", () => {
  it("allows an owner to create and read a valid private profile", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    const profileRef = doc(db, "profiles", "owner");

    await assertSucceeds(setDoc(profileRef, validProfile("owner")));
    await assertSucceeds(getDoc(profileRef));
  });

  it("prevents unauthenticated and other users from reading a profile", async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "profiles", "owner"), validProfile("owner"));
    });

    await assertFails(
      getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), "profiles", "owner")),
    );
    await assertFails(
      getDoc(doc(testEnvironment.authenticatedContext("other").firestore(), "profiles", "owner")),
    );
  });

  it("rejects profile writes with a role outside the selected category", async () => {
    const profile = validProfile("owner");
    profile.roles = ["Administrator"];

    await assertFails(
      setDoc(
        doc(testEnvironment.authenticatedContext("owner").firestore(), "profiles", "owner"),
        profile,
      ),
    );
  });

  it("prevents changing profile ownership or creation time and prevents profile deletion", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    const profileRef = doc(db, "profiles", "owner");
    await assertSucceeds(setDoc(profileRef, validProfile("owner")));

    await assertFails(updateDoc(profileRef, { userId: "other" }));
    await assertFails(updateDoc(profileRef, { createdAt: "changed" }));
    await assertFails(deleteDoc(profileRef));
  });

  it("allows account creation only with the owner's adult self-attestation", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", "owner"), {
        uid: "owner",
        username: "creative",
        email: "owner@example.test",
        firstName: "A",
        lastName: "Creative",
        adultAttested: true,
        adultAttestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    await assertFails(
      setDoc(doc(db, "users", "other"), {
        uid: "other",
        username: "creative",
        email: "other@example.test",
        firstName: "A",
        lastName: "Creative",
        adultAttested: false,
        adultAttestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("denies client access to unimplemented interaction collections", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    await assertFails(setDoc(doc(db, "matches", "forged"), { participants: ["owner"] }));
  });

  it("denies all Storage uploads", async () => {
    const storage = testEnvironment.authenticatedContext("owner").storage();
    await assertFails(
      uploadBytes(ref(storage, "users/owner/profile.png"), new Uint8Array([1, 2, 3])),
    );
  });
});
