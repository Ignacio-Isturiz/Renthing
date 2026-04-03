"use client";

import { useRef } from "react";
import type { ChangeEvent, ReactNode, MouseEvent } from "react";
import { EyeIcon, EyeOffIcon } from "./AuthIcons";

export interface PasswordInputProps {
  leftIcon: ReactNode;
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
}

const iconStyle: React.CSSProperties = {
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

export default function PasswordInput({
  leftIcon,
  id,
  name,
  placeholder,
  autoComplete,
  value,
  onChange,
  show,
  onToggle,
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const selectionStart = inputRef.current?.selectionStart;
    const selectionEnd = inputRef.current?.selectionEnd;

    onToggle();

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (typeof selectionStart === "number" && typeof selectionEnd === "number") {
          inputRef.current.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }, 0);
  };

  return (
    <div className="auth-field-input-wrapper" style={{ position: "relative", width: "100%" }}>
      <span className="auth-left-icon" style={iconStyle}>{leftIcon}</span>
      <input
        ref={inputRef}
        id={id}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        required
        style={{ width: "100%", paddingLeft: "42px", paddingRight: "42px" }}
      />
      <button
        type="button"
        onClick={handleToggle}
        onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
        className="password-toggle-btn"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}