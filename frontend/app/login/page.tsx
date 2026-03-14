"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./login.module.css";

const trustItems = [
  "Identidad validada con documento + selfie",
  "Deposito inteligente segun riesgo",
  "Contrato digital y evidencias del estado del producto",
  "Calificacion bidireccional para construir reputacion",
];

const highlights = [
  {
    label: "Usuarios activos",
    value: "+12.400",
  },
  {
    label: "Empresas verificadas",
    value: "486",
  },
  {
    label: "Reservas en curso",
    value: "1.032",
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // Django uses username by default, we use email as username
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Login exitoso!");
        window.location.href = "/";
      } else {
        setError(data.non_field_errors?.[0] || "Credenciales invalidas");
      }
    } catch (err) {
      setError("Error de conexion con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Volver a inicio Renthing">
          <span className={styles.brandMark}>R</span>
          <span>Renthing</span>
        </Link>
        <div className={styles.topbarActions}>
          <Link href="/log" className={styles.ghostLink}>
            Ver log
          </Link>
          <Link href="/" className={styles.ghostLink}>
            Volver al inicio
          </Link>
          <Link href="/registro" className={styles.primaryLink}>
            Crear cuenta
          </Link>
        </div>
      </header>

      <section className={styles.layout}>
        <article className={styles.pitchCard}>
          <p className={styles.eyebrow}>Ingreso seguro a tu cuenta</p>
          <h1>Gestiona tus alquileres como en un ecommerce profesional.</h1>
          <p className={styles.lead}>
            Inicia sesion para publicar objetos, alquilar productos de otros usuarios,
            revisar ingresos, conversar por chat interno y monitorear contratos, depositos
            y calendario desde un solo panel.
          </p>

          <div className={styles.statGrid}>
            {highlights.map((item) => (
              <div className={styles.statCard} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.infoBlock}>
            <h2>Por que Renthing inspira confianza</h2>
            <ul>
              {trustItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Accede a tu cuenta</p>
            <h2>Bienvenido de nuevo</h2>
            <p>
              Inicia con tu correo para seguir alquilando, publicando y administrando tu
              operacion comercial.
            </p>
          </div>

          <nav className={styles.authTabs} aria-label="Navegacion de autenticacion">
            <Link href="/login" className={`${styles.authTab} ${styles.authTabActive}`}>
              Login
            </Link>
            <Link href="/registro" className={styles.authTab}>
              Registro
            </Link>
            <Link href="/reestablecer" className={styles.authTab}>
              Reestablecer
            </Link>
          </nav>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Correo electronico
              <input type="email" name="email" placeholder="tu@correo.com" required />
            </label>

            <label>
              Contraseña
              <input type="password" name="password" placeholder="********" required />
            </label>

            {error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}

            <div className={styles.inlineRow}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" name="remember" />
                Mantener sesion activa
              </label>
              <Link href="/reestablecer" className={styles.textLink}>
                Olvide mi contraseña
              </Link>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Cargando..." : "Iniciar sesion"}
            </button>
          </form>

          <div className={styles.divider}>
            <span>o continua con</span>
          </div>

          <div className={styles.socialRow}>
            <button type="button" className={styles.socialButton}>
              Google
            </button>
            <button type="button" className={styles.socialButton}>
              Apple
            </button>
          </div>

          <p className={styles.registerText}>
            ¿Aun no tienes cuenta? <Link href="/registro">Registrate gratis</Link>
          </p>
        </article>
      </section>
    </main>
  );
}
