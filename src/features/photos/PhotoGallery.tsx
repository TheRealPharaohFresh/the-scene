import { useState, type CSSProperties } from "react";
import PhotoViewer from "./PhotoViewer";

type Props = {
  photos: string[];
  label: string;
  height?: number;
};

const thumb: CSSProperties = {
  flex: "0 0 auto",
  width: 84,
  height: 84,
  padding: 0,
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid rgba(245,244,242,0.25)",
  background: "rgba(255,255,255,0.08)",
  cursor: "pointer",
};

// A hero photo plus a scrollable thumbnail row; any photo opens the fullscreen viewer.
export default function PhotoGallery({ photos, label, height = 360 }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (!photos.length) return null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        aria-label={`Open ${label} photos fullscreen`}
        onClick={() => setViewerIndex(0)}
        style={{ ...thumb, width: "100%", height: "auto", maxHeight: height, borderRadius: 0, border: "none", display: "block" }}
      >
        <img
          src={photos[0]}
          alt=""
          referrerPolicy="no-referrer"
          style={{ width: "100%", maxHeight: height, objectFit: "cover", display: "block" }}
        />
      </button>
      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 4px" }}>
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Open photo ${index + 1} of ${photos.length}`}
              onClick={() => setViewerIndex(index)}
              style={thumb}
            >
              <img src={url} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} startIndex={viewerIndex} label={label} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
