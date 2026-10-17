import type { ChangeEvent, CSSProperties } from "react";

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(245,244,242,0.18)",
  background: "rgba(5,4,8,0.7)",
  color: "#F5F4F2",
  outline: "none",
  fontSize: 16,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

type InputBaseProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  name,
}: InputBaseProps & { name: string }) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        name={name}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        style={inputStyle}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  name,
  rows = 6,
}: InputBaseProps & { name: string; rows?: number }) {
  return (
    <label style={labelStyle}>
      {label}
      <textarea
        name={name}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
      />
    </label>
  );
}

export function NicknameInput(props: InputBaseProps) {
  return <InputField {...props} name="nickname-input" />;
}

export function LocationInput(props: InputBaseProps) {
  return <InputField {...props} name="location-input" />;
}

export function PortfolioInput(props: InputBaseProps) {
  return <InputField {...props} name="portfolio-input" />;
}

export function SocialMediaInput(props: InputBaseProps & { name: string }) {
  return <InputField {...props} />;
}

export function BioInput({ label, value, onChange, placeholder, disabled, maxLength }: InputBaseProps) {
  return (
    <TextAreaField
      name="bio-input"
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      rows={6}
    />
  );
}

export function TextInput(props: InputBaseProps & { name: string }) {
  return <InputField {...props} />;
}
