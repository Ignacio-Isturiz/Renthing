"use client";

import { useState } from "react";

type AuthTab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");


  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    
    // Additional fields for registration
    const name = formData.get("name");
    const cedula = formData.get("cedula");
    const passwordConfirm = formData.get("passwordConfirm");

    if (activeTab === "register" && password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const endpoint = activeTab === "login" 
      ? "http://127.0.0.1:8000/api/auth/login/" 
      : "http://127.0.0.1:8000/api/auth/register/";

    const payload = activeTab === "login"
      ? { username: email, password: password }
      : { 
          username: email, 
          email: email, 
          password: password,
          first_name: name,
          last_name: formData.get("apellido"),
          // cedula: cedula // Include if backend supports it
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (activeTab === "login") {
          localStorage.setItem("token", data.token);
          alert("Login exitoso!");
          onClose();
          window.location.reload();
        } else {
          alert("Cuenta creada con éxito! Ahora puedes iniciar sesión.");
          setActiveTab("login");
        }
      } else {
        setError(data.non_field_errors?.[0] || JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }



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

        {error && <p style={{ color: "red", fontSize: "0.8rem", marginBottom: "1rem", textAlign: "center" }}>{error}</p>}

        {/* Login form */}
        {activeTab === "login" && (
          <form className="auth-form" onSubmit={handleSubmit}>
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
            <div className="auth-forgot" style={{ opacity: 0.6, cursor: 'default' }}>
              Proximamente: ¿Olvidaste tu contraseña?
            </div>
            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
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
          <form className="auth-form" onSubmit={handleSubmit}>
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
