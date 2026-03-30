"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/dist/client/link";

type AuthTab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ─── Google Sign In ───────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signIn("google", { 
        redirect: true,
        callbackUrl: "/" 
      });
      if (result?.error) {
        setError(result.error || "Error al iniciar sesión con Google");
        setGoogleLoading(false);
      }
    } catch (error) {
      setError("Error inesperado. Intenta de nuevo.");
      setGoogleLoading(false);
    }
  };

  // ─── Login con email ──────────────────────────────────────────────────────
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        onClose();
        router.push("/");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  // ─── Registro con email ───────────────────────────────────────────────────
  const handleRegistro = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
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
      const payload = {
        email,
        first_name: nombre,
        last_name: apellido,
        cedula: cedula || "",
        password,
      };

      console.log("Enviando:", payload);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      console.log("Respuesta:", data);

      if (!res.ok) {
        const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
        setError(errorMsg || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      alert("Cuenta creada con éxito! Ahora inicia sesión.");
      setActiveTab("login");
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };



  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        {/* Close button */}
        <button
          className="auth-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="auth-modal-logo">
          <span>Renthing</span>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "login" ? "auth-tab--active" : ""}`}
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${activeTab === "register" ? "auth-tab--active" : ""}`}
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError("");
            }}
          >
            Registrarse
          </button>
        </div>

        {error && <p style={{ color: "#b91c1c", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center", background: "#fee2e2", padding: "0.6rem", borderRadius: "10px" }}>{error}</p>}

        {/* Login form */}
        {activeTab === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email">Usuario o correo electrónico</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  placeholder="correo@ejemplo.com"
                  autoComplete="username"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </div>
            <Link 
              href="/reestablecer" 
              className="auth-forgot" 
              style={{ textDecoration: 'none', color: 'var(--tu-color-primario, #005b9f)', fontSize: '0.875rem', display: 'block', textAlign: 'center', marginTop: '1rem' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.65rem",
                padding: "0.7rem",
                background: "white",
                border: "1.5px solid #ddd",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#333",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                marginTop: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8f8f8";
                e.currentTarget.style.borderColor = "#bbb";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#ddd";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </button>
            <p className="auth-switch-text">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setActiveTab("register")}
              >
                Regístrate aquí
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {activeTab === "register" && (
          <form className="auth-form" onSubmit={handleRegistro}>
            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="reg-nombre">Nombre</label>
                <div className="auth-field-input-wrapper">
                  <input
                    id="reg-nombre"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    required
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="reg-apellido">Apellido</label>
                <div className="auth-field-input-wrapper">
                  <input
                    id="reg-apellido"
                    name="apellido"
                    type="text"
                    placeholder="Tu apellido"
                    autoComplete="family-name"
                    required
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-cedula">Cédula</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="reg-cedula"
                  name="cedula"
                  type="text"
                  placeholder="Número de cédula"
                  inputMode="numeric"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="11" y2="16"></line></svg>
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-gmail">Correo electrónico</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="reg-gmail"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-password">Contraseña</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className="auth-field-input-wrapper">
                <input
                  id="reg-confirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
            </div>
            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.65rem",
                padding: "0.7rem",
                background: "white",
                border: "1.5px solid #ddd",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#333",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                marginTop: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8f8f8";
                e.currentTarget.style.borderColor = "#bbb";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#ddd";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </button>
            <p className="auth-switch-text">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setActiveTab("login")}
              >
                Inicia sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
