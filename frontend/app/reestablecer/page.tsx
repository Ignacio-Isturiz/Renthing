import Link from "next/link";
import styles from "../login/login.module.css";

const steps = [
  "Ingresa tu correo asociado a la cuenta",
  "Recibe codigo o enlace seguro de recuperacion",
  "Define nueva contraseña",
  "Revisa log de acceso para confirmar seguridad",
];

export default function ReestablecerPage() {
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
          <Link href="/login" className={styles.primaryLink}>
            Ir a login
          </Link>
        </div>
      </header>

      <section className={styles.layout}>
        <article className={styles.pitchCard}>
          <p className={styles.eyebrow}>Recuperacion de acceso</p>
          <h1>Reestablece tu contraseña sin perder control de seguridad.</h1>
          <p className={styles.lead}>
            El flujo de recuperacion esta pensado para proteger cuentas de personas y
            empresas en un entorno comercial de alquiler.
          </p>

          <div className={styles.infoBlock}>
            <h2>Proceso seguro en 4 pasos</h2>
            <ul>
              {steps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Reestablecer contraseña</p>
            <h2>Recupera tu cuenta</h2>
            <p>Te enviaremos instrucciones para restablecer tu acceso.</p>
          </div>

          <nav className={styles.authTabs} aria-label="Navegacion de autenticacion">
            <Link href="/login" className={styles.authTab}>
              Login
            </Link>
            <Link href="/registro" className={styles.authTab}>
              Registro
            </Link>
            <Link href="/reestablecer" className={`${styles.authTab} ${styles.authTabActive}`}>
              Reestablecer
            </Link>
          </nav>

          <form className={styles.form}>
            <label>
              Correo electronico
              <input type="email" name="email" placeholder="tu@correo.com" required />
            </label>

            <label>
              Codigo de verificacion (si ya lo recibiste)
              <input type="text" name="code" placeholder="Ej. 846239" />
            </label>

            <label>
              Nueva contraseña
              <input type="password" name="newPassword" placeholder="Nueva contraseña" />
            </label>

            <label>
              Confirmar nueva contraseña
              <input type="password" name="newPasswordConfirm" placeholder="Repite la nueva contraseña" />
            </label>

            <button type="submit" className={styles.submitButton}>
              Reestablecer acceso
            </button>
          </form>

          <p className={styles.helperText}>
            Si no recuerdas tu correo o detectas actividad sospechosa, revisa primero el log
            de accesos y contacta soporte.
          </p>
        </article>
      </section>
    </main>
  );
}
