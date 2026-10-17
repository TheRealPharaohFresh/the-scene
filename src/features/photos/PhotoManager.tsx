import { useRef, useState, type CSSProperties } from "react";
import { MAX_PHOTOS, uploadPhoto, validatePhotoFile } from "../../services/photos";

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  // Files are deleted by the caller only after the profile save succeeds.
  onRemove: (url: string) => void;
};

const smallButton: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "rgba(5,4,8,0.75)",
  color: "#F5F4F2",
  width: 30,
  height: 30,
  cursor: "pointer",
  fontSize: 14,
};

export default function PhotoManager({ photos, onChange, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    for (const file of picked) {
      const problem = validatePhotoFile(file);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of picked) added.push(await uploadPhoto(file));
    } catch (uploadError) {
      console.error("Photo upload error:", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "That upload failed. Try again.");
    } finally {
      if (added.length) onChange([...photos, ...added]);
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url: string) => {
    onChange(photos.filter((item) => item !== url));
    onRemove(url);
  };

  const makeMain = (index: number) => {
    const next = [...photos];
    const [chosen] = next.splice(index, 1);
    onChange([chosen, ...next]);
  };

  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset style={{ border: "1px solid rgba(245,244,242,0.2)", borderRadius: 14, padding: 14, margin: 0, minWidth: 0 }}>
      <legend>Photos</legend>
      <p style={{ margin: "0 0 10px", fontSize: 13, opacity: 0.8 }}>
        Your first photo is your profile photo. Add up to {MAX_PHOTOS}. Photos are resized, stripped of location data,
        and shown to other members on your card. Changes apply when you save the profile.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
        {photos.map((url, index) => (
          <div key={url} style={{ position: "relative", aspectRatio: "3 / 4", borderRadius: 12, overflow: "hidden", background: "#15101f" }}>
            <img src={url} alt={`Photo ${index + 1}`} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {index === 0 && (
              <span style={{ position: "absolute", left: 6, top: 6, fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(247,50,109,0.85)" }}>
                Main
              </span>
            )}
            <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => remove(url)} style={{ ...smallButton, position: "absolute", right: 6, top: 6 }}>
              ✕
            </button>
            <div style={{ position: "absolute", left: 6, right: 6, bottom: 6, display: "flex", gap: 4, justifyContent: "space-between" }}>
              <button type="button" aria-label={`Move photo ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, -1)} style={{ ...smallButton, opacity: index === 0 ? 0.35 : 1 }}>
                ‹
              </button>
              {index > 0 && (
                <button type="button" onClick={() => makeMain(index)} style={{ ...smallButton, width: "auto", padding: "0 10px", fontSize: 11 }}>
                  Make main
                </button>
              )}
              <button type="button" aria-label={`Move photo ${index + 1} later`} disabled={index === photos.length - 1} onClick={() => move(index, 1)} style={{ ...smallButton, opacity: index === photos.length - 1 ? 0.35 : 1 }}>
                ›
              </button>
            </div>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            style={{ aspectRatio: "3 / 4", borderRadius: 12, border: "2px dashed rgba(245,244,242,0.4)", background: "transparent", color: "#F5F4F2", cursor: "pointer", fontSize: 14 }}
          >
            {busy ? "Uploading…" : "+ Add photo"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        aria-label="Choose photos"
        onChange={(event) => void add(event.target.files)}
      />
      {error && (
        <p role="alert" style={{ margin: "10px 0 0", fontSize: 13 }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
