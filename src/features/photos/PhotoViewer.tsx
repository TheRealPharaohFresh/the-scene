import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

type Props = {
  photos: string[];
  startIndex?: number;
  label: string;
  onClose: () => void;
};

const SWIPE_PX = 50;

const navButton = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "rgba(255,255,255,0.18)",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
} as const;

// Rendered in a portal because swipe cards use CSS transforms, which would trap a fixed-position child.
export default function PhotoViewer({ photos, startIndex = 0, label, onClose }: Props) {
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), photos.length - 1));
  const closeRef = useRef<HTMLButtonElement>(null);
  const startX = useRef<number | null>(null);

  const go = (step: number) => setIndex((current) => Math.min(Math.max(current + step, 0), photos.length - 1));

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(current - 1, 0));
      if (event.key === "ArrowRight") setIndex((current) => Math.min(current + 1, photos.length - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, photos.length]);

  const onPointerDown = (event: PointerEvent) => {
    startX.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    startX.current = null;
    if (delta > SWIPE_PX) go(-1);
    else if (delta < -SWIPE_PX) go(1);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} photos`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#000",
        display: "grid",
        placeItems: "center",
        touchAction: "pan-y",
      }}
    >
      <img
        src={photos[index]}
        alt={`${label}, photo ${index + 1} of ${photos.length}`}
        draggable={false}
        referrerPolicy="no-referrer"
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", userSelect: "none" }}
      />
      <button
        ref={closeRef}
        type="button"
        aria-label="Close photos"
        onClick={onClose}
        style={{
          ...navButton,
          top: "calc(16px + env(safe-area-inset-top))",
          right: 16,
          transform: "none",
        }}
      >
        ✕
      </button>
      {index > 0 && (
        <button type="button" aria-label="Previous photo" onClick={() => go(-1)} style={{ ...navButton, left: 12 }}>
          ‹
        </button>
      )}
      {index < photos.length - 1 && (
        <button type="button" aria-label="Next photo" onClick={() => go(1)} style={{ ...navButton, right: 12 }}>
          ›
        </button>
      )}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          bottom: "calc(18px + env(safe-area-inset-bottom))",
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontSize: 14,
        }}
      >
        {index + 1} / {photos.length}
      </div>
    </div>,
    document.body,
  );
}
