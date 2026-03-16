export default function AboutUs() {
  return (
    <section className="about-us" id="about">
      <div className="container">
        <div className="section-head">
          <h2>¿Quiénes somos?</h2>
          <p>La nueva forma de acceder a productos sin comprarlos.</p>
        </div>

        <div className="about-grid">
          <p>
            Renthing conecta personas que tienen productos disponibles con quienes necesitan usarlos por un tiempo.
            Promovemos consumo inteligente, ahorro y sostenibilidad con una experiencia simple y segura.
          </p>
          <div className="about-points">
            <div className="about-point">
              <h3>Confianza real</h3>
              <p>Perfiles verificados, historial de alquiler y soporte durante toda la reserva.</p>
            </div>
            <div className="about-point">
              <h3>Renta flexible</h3>
              <p>Alquila por horas, dias o fines de semana segun tu necesidad.</p>
            </div>
            <div className="about-point">
              <h3>Mas accesible</h3>
              <p>Consigue productos premium sin pagar el costo completo de compra.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
