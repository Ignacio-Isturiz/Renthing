"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function ReestablecerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Pedir email, 2: Ingresar código y clave
  const [formData, setFormData] = useState({ email: "", code: "", newPassword: "", confirmPassword: "" });
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleRequest = async (e: any) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/api/auth/password-reset-request/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusMsg({ type: "success", text: data.message });
      setStep(2);
    } else {
      // Mostrar alerta especial si es cuenta de Google
      if (data.error === "Inicia sesión con google") {
        alert(data.error);
      }
      setStatusMsg({ type: "error", text: data.error });
    }
  };

  const handleConfirm = async (e: any) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setStatusMsg({ type: "error", text: "Las contraseñas no coinciden" });
    }
    const res = await fetch("http://localhost:8000/api/auth/password-reset-confirm/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: formData.email, 
        code: formData.code, 
        new_password: formData.newPassword 
      }),
    });
    if (res.ok) {
      alert("¡Éxito! Ahora puedes iniciar sesión.");
      router.push("/login");
    } else {
      const data = await res.json();
      setStatusMsg({ type: "error", text: data.error });
    }
  };

  return (
    <main className={styles.shell}>
      {/* ... (Header y Pitch Card iguales a tu código) ... */}
      <article className={styles.formCard}>
        <h2>{step === 1 ? "Recupera tu cuenta" : "Define tu nueva clave"}</h2>
        
        {statusMsg.text && (
          <div className={`${styles.alert} ${statusMsg.type === 'error' ? styles.error : styles.success}`}>
            {statusMsg.text}
          </div>
        )}

        <form className={styles.form} onSubmit={step === 1 ? handleRequest : handleConfirm}>
          <label>
            Correo electrónico
            <input 
              type="email" 
              disabled={step === 2}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </label>

          {step === 2 && (
            <>
              <label>
                Código de 6 dígitos
                <input 
                  type="text" 
                  maxLength={6}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required 
                />
              </label>
              <label>
                Nueva contraseña
                <input 
                  type="password" 
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  required 
                />
              </label>
              <label>
                Confirmar contraseña
                <input 
                  type="password" 
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required 
                />
              </label>
            </>
          )}

          <button type="submit" className={styles.submitButton}>
            {step === 1 ? "Enviar código" : "Actualizar contraseña"}
          </button>
        </form>
      </article>
    </main>
  );
}