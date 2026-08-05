import type { CSSProperties } from "react";

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: "rgba(255,255,255,0.08)",
  cursor: "pointer",
};

const inputStyle: CSSProperties = {
  width: 18,
  height: 18,
};

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
};

export function CheckboxItem({ label, checked, onChange, name }: CheckboxProps) {
  return (
    <label style={{ ...wrapperStyle, border: checked ? "1px solid #F7326D" : "1px solid rgba(245,244,242,0.15)" }}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span>{label}</span>
    </label>
  );
}

export function RoleCheckbox(props: Omit<CheckboxProps, "name">) {
  return <CheckboxItem {...props} name="role-checkbox" />;
}

export function LookingForCheckbox(props: Omit<CheckboxProps, "name">) {
  return <CheckboxItem {...props} name="looking-for-checkbox" />;
}
