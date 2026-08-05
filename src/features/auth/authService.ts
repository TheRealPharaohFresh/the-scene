export type RegisterPayload = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthUser = {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
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
  return readStoredUser()?.userId ?? null;
}

export function hasCompletedProfile(): boolean {
  return window.localStorage.getItem(PROFILE_COMPLETE_KEY) === "true";
}

export function markProfileComplete() {
  window.localStorage.setItem(PROFILE_COMPLETE_KEY, "true");
}

export async function registerUser(payload: RegisterPayload) {
  const user: AuthUser = {
    userId: `user-${Date.now()}`,
    username: payload.username,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };

  writeStoredUser(user);
  window.localStorage.setItem(PROFILE_COMPLETE_KEY, "false");

  return Promise.resolve(user);
}

export async function loginUser(payload: LoginPayload) {
  const stored = readStoredUser();
  if (!stored) {
    const guestUser: AuthUser = {
      userId: `user-${Date.now()}`,
      username: payload.username,
      email: "",
      firstName: "",
      lastName: "",
    };
    writeStoredUser(guestUser);
    window.localStorage.setItem(PROFILE_COMPLETE_KEY, "false");
    return Promise.resolve(guestUser);
  }

  if (stored.username !== payload.username) {
    throw new Error("Invalid username. Please register or try a different account.");
  }

  return Promise.resolve(stored);
}
