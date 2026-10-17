import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { PublicProfile } from "../../../types/profile";
import type { SwipeAction } from "../../../services/swipes";
import { photoList } from "../../../services/photos";
import PhotoViewer from "../../photos/PhotoViewer";

const SWIPE_THRESHOLD = 110;
const TAP_SLOP = 6;
const brandHues = [268, 285, 320, 340, 255];

function hueFor(userId: string) {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return brandHues[Math.abs(hash) % brandHues.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

const chipStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 13,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(245,244,242,0.18)",
};

type Props = {
  profile: PublicProfile;
  interactive: boolean;
  exiting: SwipeAction | null;
  onSwipe: (action: SwipeAction) => void;
  onOpen?: () => void;
};

export default function SwipeCard({ profile, interactive, exiting, onSwipe, onOpen }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const photos = photoList(profile);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const shownIndex = Math.min(photoIndex, Math.max(photos.length - 1, 0));

  const hue = hueFor(profile.userId);
  const location = [profile.city, profile.stateCode].filter(Boolean).join(", ");
  const name = profile.displayName || "Creative member";

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive || exiting) return;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) setDx(event.clientX - startX.current);
  };
  const handleTap = (event: PointerEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect || !photos.length) return;
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    if (ratio < 0.33) setPhotoIndex(Math.max(shownIndex - 1, 0));
    else if (ratio > 0.67) setPhotoIndex(Math.min(shownIndex + 1, photos.length - 1));
    else setViewerOpen(true);
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    if (event.type === "pointerup" && Math.abs(dx) < TAP_SLOP) handleTap(event);
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      onSwipe(dx > 0 ? "like" : "pass");
    } else {
      setDx(0);
    }
  };

  const offset = exiting ? (exiting === "like" ? 700 : -700) : dx;
  const stamp = exiting ?? (dx > 40 ? "like" : dx < -40 ? "pass" : null);

  return (
    <article
      aria-label={`${name}, ${profile.entertainmentCategory}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 28,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#15101f",
        border: "1px solid rgba(245,244,242,0.16)",
        boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
        touchAction: "pan-y",
        userSelect: "none",
        cursor: interactive ? (dragging ? "grabbing" : "grab") : "default",
        transform: `translateX(${offset}px) rotate(${offset / 28}deg)`,
        transition: dragging ? "none" : "transform 0.25s ease",
      }}
    >
      <div
        ref={heroRef}
        style={{
          position: "relative",
          flex: "1 1 55%",
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(160deg, hsl(${hue} 70% 38%) 0%, hsl(${(hue + 50) % 360} 75% 45%) 100%)`,
        }}
      >
        {photos.length ? (
          <img
            src={photos[shownIndex]}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span aria-hidden="true" style={{ fontSize: 84, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
            {initialsOf(name)}
          </span>
        )}
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            padding: "48px 20px 16px",
            background: "linear-gradient(to top, rgba(5,4,8,0.85), rgba(5,4,8,0))",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{name}</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.9 }}>
            {profile.entertainmentCategory}
            {location ? ` · ${location}` : ""}
          </p>
        </div>
        {photos.length > 1 ? (
          <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex", gap: 4 }}>
            {photos.map((url, index) => (
              <span
                key={url}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: index === shownIndex ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        ) : null}
        {interactive && photos.length ? (
          <button
            type="button"
            aria-label={`View all ${photos.length} photos of ${name}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setViewerOpen(true)}
            style={{
              position: "absolute",
              right: 16,
              top: photos.length > 1 ? 24 : 16,
              borderRadius: 999,
              border: "1px solid rgba(245,244,242,0.4)",
              background: "rgba(5,4,8,0.55)",
              color: "#F5F4F2",
              padding: "6px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </button>
        ) : null}
        {interactive && onOpen ? (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onOpen}
            style={{
              position: "absolute",
              right: 16,
              bottom: 18,
              borderRadius: 999,
              border: "1px solid rgba(245,244,242,0.4)",
              background: "rgba(5,4,8,0.55)",
              color: "#F5F4F2",
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            View profile
          </button>
        ) : null}
        {stamp ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 22,
              [stamp === "like" ? "left" : "right"]: 20,
              padding: "6px 14px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: 2,
              color: stamp === "like" ? "#4ade80" : "#F7326D",
              border: `3px solid ${stamp === "like" ? "#4ade80" : "#F7326D"}`,
              transform: `rotate(${stamp === "like" ? -12 : 12}deg)`,
              background: "rgba(5,4,8,0.35)",
            }}
          >
            {stamp === "like" ? "LIKE" : "PASS"}
          </span>
        ) : null}
      </div>

      <div style={{ flex: "1 1 45%", minHeight: 0, padding: 20, display: "grid", gap: 12, alignContent: "start", overflow: "hidden" }}>
        {profile.roles.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.roles.slice(0, 5).map((role) => (
              <span key={role} style={{ ...chipStyle, background: "rgba(119,39,233,0.35)" }}>
                {role}
              </span>
            ))}
          </div>
        ) : null}
        {profile.bio ? (
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {profile.bio}
          </p>
        ) : null}
        {profile.lookingFor.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Looking for</span>
            {profile.lookingFor.map((option) => (
              <span key={option} style={chipStyle}>
                {option}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {viewerOpen && photos.length ? (
        <PhotoViewer photos={photos} startIndex={shownIndex} label={name} onClose={() => setViewerOpen(false)} />
      ) : null}
    </article>
  );
}
