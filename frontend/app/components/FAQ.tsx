"use client";

import { useState } from "react";

const faqs = [
  {
    question: "¿Como funciona una renta en Renthing?",
    answer:
      "Eliges un producto, seleccionas fechas disponibles, confirmas el pago y coordinas entrega o retiro. Al finalizar, se confirma la devolucion y se cierra la renta.",
  },
  {
    question: "¿Que incluye la seguridad de la plataforma?",
    answer:
      "Trabajamos con perfiles verificados, historial de comportamiento, deposito de respaldo y evaluaciones entre usuarios para reducir riesgos en cada operacion.",
  },
  {
    question: "¿Puedo publicar mis propios productos?",
    answer:
      "Si. Puedes crear publicaciones, definir precio por dia y establecer reglas de uso. Renthing te ayuda a gestionar solicitudes y disponibilidad.",
  },
  {
    question: "¿Cuanto tiempo puedo rentar un producto?",
    answer:
      "Depende de cada publicacion: hay opciones por horas, por dia y por periodos mas largos. Siempre veras la disponibilidad antes de confirmar.",
  },
  {
    question: "¿Necesito carrito para rentar?",
    answer:
      "No. Esta interfaz esta optimizada para renta directa: eliges el producto y avanzas con Rent Now.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="section-head">
          <h2>Preguntas y respuestas</h2>
          <p>Resolvemos lo basico para que puedas empezar a rentar sin friccion.</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              className={`faq-item ${openIndex === index ? "active" : ""}`}
              key={faq.question}
            >
              <button
                className="faq-question"
                type="button"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq-chevron" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
