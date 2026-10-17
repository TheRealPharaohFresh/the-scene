import type { CSSProperties } from "react";

export const buttonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(245,244,242,0.3)",
  padding: "9px 18px",
  background: "rgba(255,255,255,0.08)",
  color: "#F5F4F2",
  cursor: "pointer",
  fontSize: 14,
};

export const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "linear-gradient(135deg, #7727E9, #F7326D)",
  border: "none",
  fontWeight: 700,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(245,244,242,0.25)",
  background: "rgba(5,4,8,0.5)",
  color: "#F5F4F2",
  fontSize: 16,
  fontFamily: "inherit",
};

export const cardStyle: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: "rgba(21,16,31,0.85)",
  border: "1px solid rgba(245,244,242,0.14)",
  display: "grid",
  gap: 8,
};

export const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#F5F4F2",
  opacity: 0.75,
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontSize: 13,
};

export function formatDate(value: Date) {
  return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
