import Link from "next/link";
import styles from "../login/login.module.css";

const filters = ["Todos", "Exitosos", "Fallidos", "Web", "Movil", "Empresa"];

const logs = [
  ["14 Mar 09:12", "ana@correo.com", "Web", "Bogota", "ok"],
  ["14 Mar 08:58", "rentalpro@empresa.com", "Web", "Medellin", "ok"],
  ["13 Mar 23:41", "camilo@correo.com", "Movil", "Cali", "warn"],
  ["13 Mar 21:16", "admin@empresa.com", "Web", "Barranquilla", "danger"],
  ["13 Mar 18:03", "julieth@correo.com", "Movil", "Bogota", "ok"],
];

export default function LogPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Volver a inicio Renthing">
          <span className={styles.brandMark}>R</span>
          <span>Renthing</span>
        </Link>
        <div className={styles.topbarActions}>
          <Link href="/login" className={styles.ghostLink}>
            Login
          </Link>
          <Link href="/registro" className={styles.primaryLink}>
            Registro
          </Link>
        </div>
      </header>

      <section className={styles.layout}>
        <article className={styles.pitchCard}>
          <p className={styles.eyebrow}>Log de acceso</p>
          <h1>Trazabilidad comercial de inicios de sesion en Renthing.</h1>
          <p className={styles.lead}>
            Este modulo de frontend permite auditar accesos para mejorar seguridad de
            personas y empresas que operan dentro del marketplace de alquiler.
          </p>

          <div className={styles.pillRow}>
            <span className={styles.pill}>2FA listo para integrar</span>
            <span className={styles.pill}>Alertas de ubicacion nueva</span>
            <span className={styles.pill}>Control de sesiones activas</span>
          </div>

          <div className={styles.infoBlock}>
            <h2>Uso recomendado</h2>
            <ul>
              <li>Revisar intentos fallidos para detectar accesos sospechosos.</li>
              <li>Cerrar sesiones desde dispositivos desconocidos.</li>
              <li>Usar este historial antes de cambios de contraseña sensibles.</li>
            </ul>
          </div>
        </article>

        <article className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Historial de sesiones</p>
            <h2>Log de autenticacion</h2>
            <p>Visualiza hora, usuario, canal, ubicacion y estado del intento de acceso.</p>
          </div>

          <div className={styles.logFilterRow}>
            {filters.map((filter) => (
              <button type="button" className={styles.logFilter} key={filter}>
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.logTable}>
            <div className={styles.logHead}>
              <span>Fecha</span>
              <span>Cuenta</span>
              <span>Canal</span>
              <span>Ciudad</span>
              <span>Estado</span>
            </div>

            {logs.map((row) => (
              <div className={styles.logRow} key={row.join("-")}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>
                  <b
                    className={`${styles.statusBadge} ${
                      row[4] === "ok"
                        ? styles.statusOk
                        : row[4] === "warn"
                          ? styles.statusWarn
                          : styles.statusDanger
                    }`}
                  >
                    {row[4] === "ok" ? "Exitoso" : row[4] === "warn" ? "Riesgo" : "Bloqueado"}
                  </b>
                </span>
              </div>
            ))}
          </div>

          <p className={styles.helperText}>
            Vista de frontend. Puedes conectarla luego con auditoria real del backend y cierre de sesiones.
          </p>
        </article>
      </section>
    </main>
  );
}
