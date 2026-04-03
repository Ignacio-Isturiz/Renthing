import type { CSSProperties, ReactNode, ChangeEvent } from "react";

export interface IconInputProps {
  icon: ReactNode;
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
  style?: CSSProperties;
}

const iconStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#94a3b8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: 2,
};

export default function IconInput({
  icon,
  id,
  name,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  required = true,
  maxLength,
  style,
}: IconInputProps) {
  return (
    <div className="auth-field-input-wrapper" style={{ position: "relative", width: "100%" }}>
      <span className="auth-left-icon" style={iconStyle}>{icon}</span>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        style={{ width: "100%", paddingLeft: "42px", ...style }}
      />
    </div>
  );
}