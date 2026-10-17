import type { CSSProperties } from "react";

const selectStyle: CSSProperties = {
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

type Option = {
  value: string;
  label: string;
};

type BaseSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  name: string;
};

export function BaseSelect({ label, value, onChange, options, name }: BaseSelectProps) {
  return (
    <label style={labelStyle}>
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={selectStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GenderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options: Option[] = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Non-binary", label: "Non-binary" },
    { value: "Prefer not to say", label: "Prefer not to say" },
  ];

  return <BaseSelect label="Gender" value={value} onChange={onChange} options={options} name="gender-select" />;
}

export function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}) {
  const options = [{ value: "", label: "Select category" }, ...categories.map((label) => ({ value: label, label }))];

  return <BaseSelect label="Entertainment category" value={value} onChange={onChange} options={options} name="category-select" />;
}
