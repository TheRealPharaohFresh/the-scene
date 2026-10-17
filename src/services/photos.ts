import { initFirebase } from "./firebaseClient";

export const MAX_PHOTOS = 6;
export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const MAX_EDGE_PX = 1280;
export const ALLOWED_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function fitWithin(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function validatePhotoFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_INPUT_TYPES.some((type) => type === file.type)) return "Use a JPEG, PNG, or WebP image.";
  if (file.size > MAX_INPUT_BYTES) return "That photo is over 5 MB. Choose a smaller one.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

// The photo shown first (the profile photo) is always the head of the list.
export function photoList(profile: { photos?: string[]; profilePhotoUrl?: string }): string[] {
  if (profile.photos?.length) return profile.photos.slice(0, MAX_PHOTOS);
  return profile.profilePhotoUrl ? [profile.profilePhotoUrl] : [];
}

async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE_PX);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser can't process images.");
    context.drawImage(bitmap, 0, 0, width, height);
    // Re-encoding also strips EXIF data such as GPS location.
    for (const quality of [0.82, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= 1024 * 1024) return blob;
    }
    throw new Error("That photo is too detailed to compress. Try a different one.");
  } finally {
    bitmap.close();
  }
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function uploadPhoto(file: File): Promise<string> {
  const problem = validatePhotoFile(file);
  if (problem) throw new Error(problem);
  const client = await initFirebase();
  if (!client?.storage) throw new Error("Photo uploads aren't available right now.");
  const uid = client.auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");

  const blob = await resizeToJpeg(file);
  const storageRef = client.ref(client.storage, `users/${uid}/photos/${randomId()}.jpg`);
  try {
    await client.uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await client.getDownloadURL(storageRef);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code.startsWith("storage/")) throw new Error("Photo uploads aren't turned on yet. Please try again later.", { cause: error });
    throw error;
  }
}

// Best effort: a failed delete leaves an orphaned file, never a broken profile.
export async function deletePhoto(url: string): Promise<void> {
  try {
    const client = await initFirebase();
    if (!client?.storage) return;
    await client.deleteObject(client.ref(client.storage, url));
  } catch (error) {
    console.error("Photo delete error:", error);
  }
}
