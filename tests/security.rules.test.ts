import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
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

const publicProfileFor = (profile: ReturnType<typeof validProfile>, discoverable = true) => ({
  userId: profile.userId,
  displayName: profile.displayName,
  entertainmentCategory: profile.entertainmentCategory,
  roles: profile.roles,
  bio: profile.bio,
  stateCode: profile.stateCode,
  city: profile.city,
  lookingFor: profile.lookingFor,
  discoverable,
  shared: ["bio", "location", "lookingFor"],
  createdAt: profile.createdAt,
  updatedAt: serverTimestamp(),
});

async function seedPublicProfile(userId: string, discoverable: boolean) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const profile = validProfile(userId);
    await setDoc(doc(db, "profiles", userId), profile);
    await setDoc(doc(db, "publicProfiles", userId), { ...publicProfileFor(profile, discoverable) });
  });
}

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

  it("lets members read only discoverable public profiles and query them with the discoverable filter", async () => {
    await seedPublicProfile("visible", true);
    await seedPublicProfile("hidden", false);
    const db = testEnvironment.authenticatedContext("viewer").firestore();

    await assertSucceeds(getDoc(doc(db, "publicProfiles", "visible")));
    await assertFails(getDoc(doc(db, "publicProfiles", "hidden")));
    await assertSucceeds(
      getDocs(query(collection(db, "publicProfiles"), where("discoverable", "==", true))),
    );
    await assertFails(getDocs(collection(db, "publicProfiles")));
    await assertSucceeds(getDoc(doc(testEnvironment.authenticatedContext("hidden").firestore(), "publicProfiles", "hidden")));
    await assertFails(
      getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), "publicProfiles", "visible")),
    );
  });

  it("allows an owner to write the private and public profile together, and nobody else to write it", async () => {
    const profile = validProfile("owner");
    const db = testEnvironment.authenticatedContext("owner").firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, "profiles", "owner"), profile);
    batch.set(doc(db, "publicProfiles", "owner"), publicProfileFor(profile));
    await assertSucceeds(batch.commit());

    await assertFails(
      setDoc(
        doc(testEnvironment.authenticatedContext("other").firestore(), "publicProfiles", "owner"),
        publicProfileFor(profile),
      ),
    );
    await assertFails(deleteDoc(doc(db, "publicProfiles", "owner")));
  });

  it("rejects public profiles that leak private fields, drift from the private profile, or lack one", async () => {
    const profile = validProfile("owner");
    const db = testEnvironment.authenticatedContext("owner").firestore();

    await assertFails(setDoc(doc(db, "publicProfiles", "owner"), publicProfileFor(profile)));

    await assertSucceeds(setDoc(doc(db, "profiles", "owner"), profile));
    await assertFails(
      setDoc(doc(db, "publicProfiles", "owner"), { ...publicProfileFor(profile), gender: "Male" }),
    );
    await assertFails(
      setDoc(doc(db, "publicProfiles", "owner"), { ...publicProfileFor(profile), email: "owner@example.test" }),
    );
    await assertFails(
      setDoc(doc(db, "publicProfiles", "owner"), { ...publicProfileFor(profile), bio: "Different bio." }),
    );
    await assertSucceeds(setDoc(doc(db, "publicProfiles", "owner"), publicProfileFor(profile)));
  });

  describe("community", () => {
    const seedProfiles = async () => {
      await testEnvironment.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, "profiles", "owner"), validProfile("owner"));
        await setDoc(doc(db, "profiles", "other"), validProfile("other"));
      });
    };
    const dbFor = (uid: string) => testEnvironment.authenticatedContext(uid).firestore();
    const thread = (groupId: string | null, authorName = "A Creative") => ({
      authorId: "owner",
      authorName,
      title: "Looking for a cinematographer",
      body: "Shooting a short next month.",
      groupId,
      createdAt: serverTimestamp(),
    });
    const createGroupAs = async (uid: string, gid: string) => {
      const db = dbFor(uid);
      const batch = writeBatch(db);
      batch.set(doc(db, "groups", gid), { ownerId: uid, name: "LA Film Crew", description: "Shoots", createdAt: serverTimestamp() });
      batch.set(doc(db, "groups", gid, "members", uid), {
        userId: uid,
        displayName: "A Creative",
        role: "owner",
        joinedAt: serverTimestamp(),
      });
      await batch.commit();
    };

    it("lets members post open threads only under their real profile name", async () => {
      await seedProfiles();
      const owner = dbFor("owner");
      await assertSucceeds(setDoc(doc(owner, "threads", "t1"), thread(null)));
      await assertFails(setDoc(doc(owner, "threads", "t2"), thread(null, "Someone Else")));
      await assertSucceeds(getDoc(doc(dbFor("other"), "threads", "t1")));
      await assertFails(getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), "threads", "t1")));
      await assertSucceeds(
        setDoc(doc(owner, "threads", "t1", "replies", "r1"), {
          authorId: "owner",
          authorName: "A Creative",
          body: "Reply",
          createdAt: serverTimestamp(),
        }),
      );
    });

    it("keeps group content and member lists to members, and blocks forged ownership", async () => {
      await seedProfiles();
      await assertSucceeds(createGroupAs("owner", "g1"));
      const other = dbFor("other");
      await assertSucceeds(getDoc(doc(other, "groups", "g1")));
      await assertFails(getDocs(collection(other, "groups", "g1", "members")));
      await assertFails(setDoc(doc(other, "threads", "gt"), { ...thread("g1"), authorId: "other" }));

      await assertFails(
        setDoc(doc(other, "groups", "g1", "members", "other"), {
          userId: "other",
          displayName: "A Creative",
          role: "owner",
          joinedAt: serverTimestamp(),
        }),
      );
      await assertSucceeds(
        setDoc(doc(other, "groups", "g1", "members", "other"), {
          userId: "other",
          displayName: "A Creative",
          role: "member",
          joinedAt: serverTimestamp(),
        }),
      );
      await assertSucceeds(getDocs(collection(other, "groups", "g1", "members")));
      await assertSucceeds(setDoc(doc(other, "threads", "gt"), { ...thread("g1"), authorId: "other" }));
      await assertSucceeds(
        getDocs(query(collection(other, "threads"), where("groupId", "==", "g1"))),
      );
      await assertFails(
        getDocs(query(collection(dbFor("outsider"), "threads"), where("groupId", "==", "g1"))),
      );
      await assertFails(deleteDoc(doc(dbFor("owner"), "groups", "g1", "members", "owner")));
      await assertSucceeds(deleteDoc(doc(other, "groups", "g1", "members", "other")));
    });

    it("reveals an event address only to the host and members who RSVP going", async () => {
      await seedProfiles();
      await createGroupAs("owner", "g1");
      const owner = dbFor("owner");
      const other = dbFor("other");
      await setDoc(doc(other, "groups", "g1", "members", "other"), {
        userId: "other",
        displayName: "A Creative",
        role: "member",
        joinedAt: serverTimestamp(),
      });

      const batch = writeBatch(owner);
      batch.set(doc(owner, "groups", "g1", "events", "e1"), {
        hostId: "owner",
        hostName: "A Creative",
        title: "Music video shoot",
        description: "Call time 9am",
        kind: "Music video",
        startsAt: Timestamp.fromDate(new Date(Date.now() + 86_400_000)),
        city: "Los Angeles",
        stateCode: "CA",
        createdAt: serverTimestamp(),
      });
      batch.set(doc(owner, "groups", "g1", "events", "e1", "private", "details"), { address: "1 Secret St" });
      await assertSucceeds(batch.commit());

      const addressRef = (db: ReturnType<typeof dbFor>) => doc(db, "groups", "g1", "events", "e1", "private", "details");
      await assertSucceeds(getDoc(addressRef(owner)));
      await assertFails(getDoc(addressRef(other)));
      const rsvp = (status: string) =>
        setDoc(doc(other, "groups", "g1", "events", "e1", "rsvps", "other"), {
          userId: "other",
          displayName: "A Creative",
          status,
          updatedAt: serverTimestamp(),
        });
      await assertSucceeds(rsvp("maybe"));
      await assertFails(getDoc(addressRef(other)));
      await assertSucceeds(rsvp("going"));
      await assertSucceeds(getDoc(addressRef(other)));
      await assertFails(setDoc(addressRef(other), { address: "forged" }));
    });

    it("lets members file write-only reports and manage a private block list", async () => {
      const db = dbFor("owner");
      const report = {
        reporterId: "owner",
        targetType: "thread",
        targetPath: "threads/t1",
        reason: "Spam",
        createdAt: serverTimestamp(),
      };
      await assertSucceeds(setDoc(doc(db, "reports", "r1"), report));
      await assertFails(getDoc(doc(db, "reports", "r1")));
      await assertFails(setDoc(doc(db, "reports", "r2"), { ...report, reporterId: "other" }));

      await assertSucceeds(setDoc(doc(db, "blocks", "owner", "items", "other"), { targetId: "other", createdAt: serverTimestamp() }));
      await assertSucceeds(getDocs(collection(db, "blocks", "owner", "items")));
      await assertFails(getDocs(collection(dbFor("other"), "blocks", "owner", "items")));
      await assertSucceeds(deleteDoc(doc(db, "blocks", "owner", "items", "other")));
    });
  });

  it("enforces per-field sharing in the public profile", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    const profile = validProfile("owner");
    await assertSucceeds(setDoc(doc(db, "profiles", "owner"), profile));
    const publicRef = doc(db, "publicProfiles", "owner");
    const base = publicProfileFor(profile);

    await assertSucceeds(
      setDoc(publicRef, { ...base, shared: [], bio: "", city: "", lookingFor: [] }),
    );
    await assertFails(setDoc(publicRef, { ...base, shared: [] }));
    await assertFails(setDoc(publicRef, { ...base, shared: ["email"] }));
    await assertFails(setDoc(publicRef, { ...base, links: { portfolioUrl: "", socialMedia: { instagram: "" } } }));
    await assertSucceeds(
      setDoc(publicRef, {
        ...base,
        shared: ["bio", "links"],
        city: "",
        lookingFor: [],
        links: { portfolioUrl: "", socialMedia: { instagram: "" } },
      }),
    );
    await assertFails(
      setDoc(publicRef, {
        ...base,
        shared: ["bio", "links"],
        city: "",
        lookingFor: [],
        links: { portfolioUrl: "https://evil.example/", socialMedia: { instagram: "" } },
      }),
    );
  });

  it("lets members record only their own valid swipes", async () => {
    const db = testEnvironment.authenticatedContext("owner").firestore();
    const swipe = (action: string, targetId = "other") => ({
      targetId,
      action,
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(setDoc(doc(db, "swipes", "owner", "items", "other"), swipe("like")));
    await assertSucceeds(getDoc(doc(db, "swipes", "owner", "items", "other")));
    await assertFails(setDoc(doc(db, "swipes", "owner", "items", "x"), swipe("superlike", "x")));
    await assertFails(setDoc(doc(db, "swipes", "owner", "items", "owner"), swipe("like", "owner")));
    await assertFails(setDoc(doc(db, "swipes", "other", "items", "owner"), swipe("like", "owner")));
    const otherDb = testEnvironment.authenticatedContext("other").firestore();
    await assertFails(getDoc(doc(otherDb, "swipes", "owner", "items", "other")));
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
