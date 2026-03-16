"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../login/login.module.css";

const benefits = [
  "Publica productos para alquiler en minutos",
  "Alquila productos de otros usuarios desde el mismo perfil",
  "Activa verificacion de identidad con documento y selfie",
  "Accede a dashboard, chat y contratos digitales",
];

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const passwordConfirm = formData.get("passwordConfirm");

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // Using email as username
          email: email,
          password: password,
          first_name: name, // Simplified mapping
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Cuenta creada con éxito! Ahora puedes iniciar sesión.");
        window.location.href = "/login";
      } else {
        setError(JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
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
          <Link href="/login" className={styles.ghostLink}>
            Iniciar sesion
          </Link>
        </div>
      </header>

      <section className={styles.layout}>
        <article className={styles.pitchCard}>
          <p className={styles.eyebrow}>Registro comercial</p>
          <h1>Crea tu cuenta para publicar y alquilar como marketplace profesional.</h1>
          <p className={styles.lead}>
            Renthing combina la experiencia ecommerce con un modelo de alquiler seguro.
            Registra tu cuenta y accede al ecosistema completo de ingresos, reservas y reputacion.
          </p>

          <div className={styles.infoBlock}>
            <h2>Que obtienes al registrarte</h2>
            <ul>
              {benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Registro de usuario</p>
            <h2>Abre tu cuenta Renthing</h2>
            <p>Selecciona tu perfil y empieza a monetizar o alquilar hoy mismo.</p>
          </div>

          <nav className={styles.authTabs} aria-label="Navegacion de autenticacion">
            <Link href="/login" className={styles.authTab}>
              Login
            </Link>
            <Link href="/registro" className={`${styles.authTab} ${styles.authTabActive}`}>
              Registro
            </Link>
            <Link href="/reestablecer" className={styles.authTab}>
              Reestablecer
            </Link>
          </nav>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Nombre completo o empresa
              <input type="text" name="name" placeholder="Ej. Ana Gomez / Rental Pro SAS" required />
            </label>

            <label>
              Correo electronico
              <input type="email" name="email" placeholder="tu@correo.com" required />
            </label>

            <label>
              Tipo de cuenta
              <select name="accountType" defaultValue="" required>
                <option value="" disabled>
                  Selecciona una opcion
                </option>
                <option value="persona">Persona</option>
                <option value="empresa">Empresa</option>
              </select>
            </label>

            <label>
              Contraseña
              <input type="password" name="password" placeholder="Minimo 8 caracteres" required />
            </label>

            <label>
              Confirmar contraseña
              <input type="password" name="passwordConfirm" placeholder="Repite la contraseña" required />
            </label>

            {error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}

            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="terms" required />
              Acepto terminos, politica de uso y tratamiento de datos
            </label>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className={styles.helperText}>
            Luego podras activar verificacion con documento oficial y selfie para mejorar
            confianza y reducir deposito en tus alquileres.
          </p>
        </article>
      </section>
    </main>
  );
}
