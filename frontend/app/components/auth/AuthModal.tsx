"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoogleButton from "./GoogleButton";
import IconInput from "./IconInput";
import PasswordInput from "./PasswordInput";
import { CodeIcon, IdCardIcon, LockIcon, MailIcon, ShieldIcon, UserIcon } from "./AuthIcons";

export type AuthTab = "login" | "register" | "forgot";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [registerStep, setRegisterStep] = useState(1);
  const [registerEmail, setRegisterEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = loginPassword;

    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Credenciales incorrectas o cuenta no verificada.");
        setLoading(false);
        return;
      }
      if (result?.ok) {
        setLoginPassword("");
        onClose();
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const handleRegistro = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = registerPassword;
    const passwordConfirm = registerPasswordConfirm;
    const nombre = formData.get("name") as string;
    const apellido = formData.get("apellido") as string;
    const cedula = formData.get("cedula") as string;

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: nombre, last_name: apellido, cedula: cedula || "", password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.email ? "Este correo ya está registrado" : "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      setRegisterEmail(email);
      setRegisterStep(2);
      setSuccessMsg("Registro exitoso. Revisa tu correo electrónico.");
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      setLoading(false);
    } catch {
      setError("Error de conexión.");
      setLoading(false);
    }
  };

  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    const normalizedCode = verifyCode.trim();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail.trim().toLowerCase(),
          code: normalizedCode,
          token: normalizedCode,
        }),
      });
      if (res.ok) {
        setActiveTab("login");
        setRegisterStep(1);
        setSuccessMsg("Cuenta verificada. Ya puedes iniciar sesión.");
      } else {
        setError("Código inválido o expirado.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetData.email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setSuccessMsg("Código enviado al correo.");
        setResetStep(2);
      } else {
        setError("No encontramos esa cuenta.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (resetData.newPassword !== resetData.confirmPassword) return setError("Las contraseñas no coinciden");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetData.email.trim().toLowerCase(),
          code: resetData.code.trim(),
          new_password: resetData.newPassword,
        }),
      });
      if (res.ok) {
        setActiveTab("login");
        setResetStep(1);
        setSuccessMsg("Contraseña actualizada con éxito.");
      } else {
        setError("Error al actualizar la contraseña.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="auth-modal-close" type="button" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <div className="auth-modal-logo"><span>Renthing</span></div>

        {activeTab !== "forgot" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${activeTab === "login" ? "auth-tab--active" : ""}`} onClick={() => { setActiveTab("login"); setError(""); setSuccessMsg(""); }}>Iniciar sesión</button>
            <button className={`auth-tab ${activeTab === "register" ? "auth-tab--active" : ""}`} onClick={() => { setActiveTab("register"); setError(""); setSuccessMsg(""); setRegisterStep(1); }}>Registrarse</button>
          </div>
        )}

        {error && <p style={{ color: "#b91c1c", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center", background: "#fee2e2", padding: "0.6rem", borderRadius: "10px" }}>{error}</p>}
        {successMsg && <p style={{ color: "#15803d", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center", background: "#dcfce7", padding: "0.6rem", borderRadius: "10px" }}>{successMsg}</p>}

        {activeTab === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <IconInput id="login-email" name="email" type="email" placeholder="correo@ejemplo.com" icon={<MailIcon />} />
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <PasswordInput
                id="login-password"
                name="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                leftIcon={<LockIcon />}
                show={showPass}
                onToggle={() => setShowPass(!showPass)}
              />
            </div>
            <button type="button" className="auth-forgot" onClick={() => setActiveTab("forgot")} style={{ background: "none", border: "none", color: "#005b9f", fontSize: "0.875rem", display: "block", margin: "1rem auto", cursor: "pointer" }}>¿Olvidaste tu contraseña?</button>
            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>{loading ? "Iniciando..." : "Iniciar sesión"}</button>
            <GoogleButton loading={googleLoading} onClick={handleGoogleSignIn} />
          </form>
        )}

        {activeTab === "register" && (
          <form className="auth-form" onSubmit={registerStep === 1 ? handleRegistro : handleVerifyRegistration}>
            {registerStep === 1 ? (
              <>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <div className="auth-field" style={{ flex: 1, marginBottom: 0 }}><label>Nombre</label><IconInput name="name" type="text" placeholder="Nombre" icon={<UserIcon />} /></div>
                  <div className="auth-field" style={{ flex: 1, marginBottom: 0 }}><label>Apellido</label><IconInput name="apellido" type="text" placeholder="Apellido" icon={<UserIcon />} /></div>
                </div>
                <div className="auth-field"><label>Cédula</label><IconInput name="cedula" type="text" placeholder="Número de identificación" icon={<IdCardIcon />} /></div>
                <div className="auth-field"><label>Correo electrónico</label><IconInput name="email" type="email" placeholder="correo@ejemplo.com" icon={<MailIcon />} /></div>
                <div className="auth-field"><label>Contraseña</label><PasswordInput name="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} leftIcon={<LockIcon />} show={showPass} onToggle={() => setShowPass(!showPass)} /></div>
                <div className="auth-field"><label>Confirmar contraseña</label><PasswordInput name="passwordConfirm" value={registerPasswordConfirm} onChange={(e) => setRegisterPasswordConfirm(e.target.value)} leftIcon={<ShieldIcon />} show={showConfirmPass} onToggle={() => setShowConfirmPass(!showConfirmPass)} /></div>
                <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
                <GoogleButton loading={googleLoading} onClick={handleGoogleSignIn} />
              </>
            ) : (
              <div className="auth-field">
                <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>Verificar cuenta</h3>
                <IconInput type="text" maxLength={6} placeholder="Código de 6 dígitos" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} icon={<CodeIcon />} style={{ letterSpacing: "2px", fontWeight: "bold", textAlign: "center" }} />
                <button type="submit" className="btn btn--primary auth-submit" disabled={loading} style={{ marginTop: "1.5rem" }}>{loading ? "Verificando..." : "Verificar código"}</button>
              </div>
            )}
          </form>
        )}

        {activeTab === "forgot" && (
          <form className="auth-form" onSubmit={resetStep === 1 ? handleRequestReset : handleConfirmReset}>
            <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>{resetStep === 1 ? "Recuperar cuenta" : "Nueva contraseña"}</h3>
            <div className="auth-field">
              <label>Correo electrónico</label>
              <IconInput type="email" value={resetData.email} onChange={(e) => setResetData({ ...resetData, email: e.target.value })} placeholder="correo@ejemplo.com" icon={<MailIcon />} />
            </div>
            {resetStep === 2 && (
              <>
                <div className="auth-field"><label>Código</label><IconInput type="text" value={resetData.code} onChange={(e) => setResetData({ ...resetData, code: e.target.value })} icon={<CodeIcon />} style={{ textAlign: "center", fontWeight: "bold" }} /></div>
                <div className="auth-field"><label>Nueva Contraseña</label><PasswordInput value={resetData.newPassword} onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} leftIcon={<LockIcon />} show={showPass} onToggle={() => setShowPass(!showPass)} /></div>
                <div className="auth-field"><label>Confirmar</label><PasswordInput value={resetData.confirmPassword} onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })} leftIcon={<ShieldIcon />} show={showConfirmPass} onToggle={() => setShowConfirmPass(!showConfirmPass)} /></div>
              </>
            )}
            <button type="submit" className="btn btn--primary auth-submit" disabled={loading} style={{ marginTop: "1.5rem" }}>Continuar</button>
            <button type="button" onClick={() => setActiveTab("login")} style={{ background: "none", border: "none", display: "block", margin: "1rem auto", cursor: "pointer", color: "#666" }}>Volver</button>
          </form>
        )}
      </div>
    </div>
  );
}