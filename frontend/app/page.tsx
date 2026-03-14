const personas = [
  "Personas con objetos en desuso",
  "Empresas que quieren monetizar inventario",
  "Usuarios que necesitan alquilar por dias o semanas",
  "Equipos comerciales e inversionistas que evalúan traccion",
];

const categories = [
  {
    title: "Tecnologia",
    description: "Parlantes, proyectores, consolas, camaras y equipos para trabajo o eventos.",
    meta: "Busqueda rapida y reservas por fecha",
  },
  {
    title: "Hogar y eventos",
    description: "Mobiliario, decoracion, menaje y soluciones temporales para reuniones y celebraciones.",
    meta: "Entrega local o retiro presencial",
  },
  {
    title: "Herramientas",
    description: "Taladros, hidrolavadoras, escaleras y maquinaria ligera con control de disponibilidad.",
    meta: "Deposito dinamico por riesgo",
  },
  {
    title: "Movilidad y outdoor",
    description: "Bicicletas, scooters y equipamiento recreativo con geolocalizacion cercana.",
    meta: "Ideal para alquileres de corta duracion",
  },
];

const featureFlow = [
  {
    title: "Login, registro y recuperacion",
    text: "Accesos claros para personas y empresas, restablecimiento de contraseña y estado de verificacion visible.",
  },
  {
    title: "Identidad y confianza",
    text: "Documento oficial, selfie y validacion empresarial con RUT, Camara de Comercio y datos complementarios.",
  },
  {
    title: "Publicacion y alquiler",
    text: "Un mismo usuario puede rentar sus objetos y reservar productos de otros dentro del mismo flujo.",
  },
  {
    title: "Operacion segura",
    text: "Contrato PDF, deposito inteligente, checklist, fotos antes y despues y bloqueo automatico del calendario.",
  },
];

const dashboardStats = [
  { label: "Ingresos generados", value: "$4.820.000", note: "+18% este mes" },
  { label: "Alquileres realizados", value: "126", note: "42 activos" },
  { label: "Producto mas rentable", value: "Parlante JBL PartyBox", note: "17 reservas" },
  { label: "Depositos retenidos", value: "$680.000", note: "riesgo monitoreado" },
];

const transactionRows = [
  ["12 Mar", "Proyector Epson", "Alquilado", "$95.000"],
  ["11 Mar", "Silla Tiffany x 40", "Entregado", "$210.000"],
  ["10 Mar", "Taladro Bosch", "Devuelto", "$32.000"],
  ["09 Mar", "Cabina de sonido", "Pendiente firma", "$160.000"],
];

const filters = ["Precio", "Categoria", "Ubicacion", "Calificacion", "Disponibilidad"];

const riskRules = [
  "Usuario nuevo: deposito mas alto y verificacion sugerida",
  "Historial positivo: deposito reducido automaticamente",
  "Usuario verificado: friccion minima y mayor conversion",
  "Objeto de alto valor: cobertura reforzada y checklist detallado",
];

const companyDocs = ["RUT", "Camara de Comercio", "Informacion tributaria", "Responsable verificado"];

const aiFeatures = [
  {
    title: "Busqueda en lenguaje natural",
    text: "Ejemplo: necesito algo que ponga musica para una fiesta y se entregue hoy.",
  },
  {
    title: "Precio sugerido",
    text: "La IA propone tarifas optimas segun demanda, reputacion, categoria y ubicacion.",
  },
  {
    title: "Revision documental",
    text: "Preanalisis de documentos empresariales antes del paso de validacion manual.",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a href="#inicio" className="brand" aria-label="Renthing inicio">
          <span className="brand__mark">R</span>
          <span>Renthing</span>
        </a>
        <nav className="topbar__nav" aria-label="Principal">
          <a href="#marketplace">Marketplace</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#seguridad">Seguridad</a>
          <a href="#empresas">Empresas</a>
          <a href="#ia">IA</a>
        </nav>
        <a href="/login" className="button button--primary topbar__cta">
          Iniciar sesion
        </a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero__content">
          <div className="eyebrow">Frontend de aplicacion de alquiler colaborativo</div>
          <h1>
            Renthing transforma objetos sin uso en ingresos con una experiencia de
            alquiler segura, trazable y lista para personas y empresas.
          </h1>
          <p className="hero__lead">
            Este frontend representa el producto real: autenticacion, verificacion,
            publicacion de objetos, filtros, geolocalizacion, calendario con bloqueo,
            dashboard, contratos PDF, chat interno, deposito inteligente e IA.
          </p>
          <div className="hero__actions">
            <a href="/login" className="button button--primary">
              Entrar a mi cuenta
            </a>
            <a href="#dashboard" className="button button--secondary">
              Ver dashboard
            </a>
          </div>
          <div className="hero__metrics">
            <div>
              <strong>2 roles</strong>
              <span>arrendador y arrendatario en una sola cuenta</span>
            </div>
            <div>
              <strong>5 capas</strong>
              <span>identidad, deposito, contrato, fotos y calificaciones</span>
            </div>
            <div>
              <strong>IA aplicada</strong>
              <span>busqueda natural, pricing y revision documental</span>
            </div>
          </div>
        </div>

        <div className="hero__panel" aria-label="Resumen de plataforma">
          <div className="hero-card hero-card--accent">
            <span className="hero-card__label">Vista principal del producto</span>
            <strong>Publica, alquila y gestiona</strong>
            <p>Un flujo unificado para listar objetos, reservar por fecha y controlar riesgo.</p>
          </div>
          <div className="hero-grid">
            <div className="hero-card">
              <span className="hero-card__label">Calendario inteligente</span>
              <strong>Bloqueo automatico</strong>
              <p>Evita doble reserva en cuanto una solicitud queda aprobada.</p>
            </div>
            <div className="hero-card">
              <span className="hero-card__label">Riesgo y deposito</span>
              <strong>Dinámico</strong>
              <p>Se ajusta segun historial, valor del bien y nivel de verificacion.</p>
            </div>
            <div className="hero-card hero-card--soft">
              <span className="hero-card__label">Confianza bidireccional</span>
              <strong>Reseñas + chat + contrato</strong>
              <p>El frontend muestra reputacion, trazabilidad conversacional y evidencias del alquiler.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip" aria-label="Perfiles objetivo">
        {personas.map((persona) => (
          <span key={persona}>{persona}</span>
        ))}
      </section>

      <section className="section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="section-tag">Categorias</span>
            <h2>Renthing organiza la oferta como un ecommerce, pero pensada para alquilar.</h2>
          </div>
          <p>
            Las categorias sirven como puerta de entrada al marketplace, al descubrimiento
            por necesidad y a la monetizacion de objetos que hoy estan guardados sin uso.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-card" key={category.title}>
              <span className="category-card__stat">{category.meta}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--split" id="auth">
        <div className="info-card app-card app-card--login">
          <span className="section-tag">Acceso</span>
          <h2>Login, registro y recuperacion con enfoque en confianza.</h2>
          <div className="auth-layout">
            <div className="auth-panel auth-panel--primary">
              <strong>Crear cuenta</strong>
              <p>Persona o empresa, con acceso a publicar y alquilar desde el mismo perfil.</p>
              <div className="auth-pills">
                <span>Correo</span>
                <span>Contraseña segura</span>
                <span>Restablecer acceso</span>
              </div>
            </div>
            <div className="auth-panel">
              <strong>Verificacion de identidad</strong>
              <ul className="mini-list">
                <li>Documento oficial</li>
                <li>Selfie validada</li>
                <li>Estado visible en el perfil</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="feature-column">
          {featureFlow.map((item) => (
            <article className="feature-tile" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--accent" id="marketplace">
        <div className="section-heading">
          <div>
            <span className="section-tag section-tag--light">Marketplace</span>
            <h2>Busqueda, filtros, geolocalizacion y calendario integrados en el mismo flujo.</h2>
          </div>
          <p>
            El frontend se comporta como un ecommerce de alquiler: descubre productos,
            compara reputacion, revisa disponibilidad y define entrega o recogida.
          </p>
        </div>
        <div className="marketplace-layout">
          <article className="search-panel">
            <div className="search-bar">
              <span>Necesito algo que ponga musica para una fiesta</span>
              <button type="button">Buscar con IA</button>
            </div>
            <div className="filter-wrap">
              {filters.map((filter) => (
                <span key={filter}>{filter}</span>
              ))}
            </div>
            <div className="listing-grid">
              <div className="listing-card">
                <div>
                  <strong>Cabina de sonido JBL</strong>
                  <span>4.9 estrellas · Usaquen · verificado</span>
                </div>
                <b>$85.000 / dia</b>
              </div>
              <div className="listing-card">
                <div>
                  <strong>Proyector Epson HD</strong>
                  <span>4.8 estrellas · Chapinero · empresa verificada</span>
                </div>
                <b>$95.000 / dia</b>
              </div>
              <div className="listing-card listing-card--map">
                <strong>Geolocalizacion cercana</strong>
                <p>Productos cerca del usuario para entregas rapidas y menor costo logistico.</p>
              </div>
            </div>
          </article>

          <article className="product-panel">
            <div className="product-panel__header">
              <div>
                <span className="section-tag">Producto</span>
                <h3>Parlante JBL PartyBox 710</h3>
              </div>
              <div className="price-chip">Deposito sugerido: $120.000</div>
            </div>
            <div className="calendar-card">
              <div className="calendar-card__head">
                <strong>Calendario con bloqueo automatico</strong>
                <span>14 al 18 marzo ocupadas</span>
              </div>
              <div className="calendar-grid">
                <span>10</span>
                <span>11</span>
                <span>12</span>
                <span>13</span>
                <span className="busy">14</span>
                <span className="busy">15</span>
                <span className="busy">16</span>
                <span className="busy">17</span>
                <span className="busy">18</span>
                <span className="available">19</span>
                <span className="available">20</span>
                <span className="available">21</span>
              </div>
            </div>
            <div className="delivery-cards">
              <div>
                <strong>Recogida local</strong>
                <p>Sin costo adicional. Coordina desde el chat interno.</p>
              </div>
              <div>
                <strong>Envio a domicilio</strong>
                <p>Se calcula y cobra al arrendatario dentro de la reserva.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--split" id="dashboard">
        <div className="info-card">
          <span className="section-tag">Dashboard personal</span>
          <h2>Control total de ingresos, alquileres, rentabilidad y transacciones.</h2>
          <div className="stats-grid">
            {dashboardStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="info-card info-card--warm transaction-card">
          <span className="section-tag">Historial</span>
          <h2>Transacciones recientes y lectura rapida del rendimiento.</h2>
          <div className="table-card">
            <div className="table-head">
              <span>Fecha</span>
              <span>Producto</span>
              <span>Estado</span>
              <span>Valor</span>
            </div>
            {transactionRows.map((row) => (
              <div className="table-row" key={row.join("-")}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="seguridad">
        <div className="section-heading">
          <div>
            <span className="section-tag">Seguridad, contratos y riesgo</span>
            <h2>La interfaz prioriza conversion sin soltar control operativo.</h2>
          </div>
          <p>
            Renthing no usa un deposito fijo arbitrario. El frontend explica por qué se
            pide cierto monto y cómo se protege a ambas partes durante el alquiler.
          </p>
        </div>
        <div className="trust-layout">
          <article className="investor-card contract-card">
            <h3>Contrato digital en PDF</h3>
            <p>Incluye datos de ambas partes, valor del alquiler, deposito, fechas, estado del producto y firma simple.</p>
            <div className="pdf-preview">
              <span>Contrato #RTH-20318</span>
              <span>Firma digital simple</span>
              <span>Estado del producto: aprobado</span>
            </div>
          </article>
          <article className="investor-card risk-card">
            <h3>Deposito inteligente</h3>
            <ul className="check-list">
              {riskRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </article>
          <article className="investor-card checklist-card">
            <h3>Manejo de daños y devolucion</h3>
            <div className="state-grid">
              <div>
                <strong>Antes</strong>
                <p>Fotos del producto y checklist digital.</p>
              </div>
              <div>
                <strong>Despues</strong>
                <p>Comparacion del estado para aplicar descuentos si hay daño.</p>
              </div>
              <div>
                <strong>No devolucion</strong>
                <p>Retencion del deposito y bloqueo automatico de cuenta.</p>
              </div>
            </div>
          </article>
          <article className="investor-card chat-card">
            <h3>Chat interno + calificacion bidireccional</h3>
            <div className="chat-bubble chat-bubble--owner">La entrega puede ser hoy a las 6 pm.</div>
            <div className="chat-bubble">Perfecto. Ya firme el contrato y pague deposito.</div>
            <div className="rating-strip">
              <span>Dueño 4.9</span>
              <span>Cliente 4.8</span>
              <span>132 alquileres</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--split" id="empresas">
        <div className="info-card company-card">
          <span className="section-tag">Empresas verificadas</span>
          <h2>Perfiles empresariales con señales visibles de transparencia.</h2>
          <div className="company-head">
            <div>
              <strong>Rental Pro SAS</strong>
              <p>Empresa verificada · 482 alquileres · 4.9 estrellas</p>
            </div>
            <span className="verified-chip">Verificada</span>
          </div>
          <div className="doc-grid">
            {companyDocs.map((doc) => (
              <span key={doc}>{doc}</span>
            ))}
          </div>
        </div>
        <div className="info-card info-card--warm">
          <span className="section-tag">Validacion corporativa</span>
          <h2>Un flujo similar al de marketplaces consolidados.</h2>
          <ul className="check-list">
            <li>Subida de RUT y Camara de Comercio desde el panel de empresa.</li>
            <li>Revision visual del nivel de verificacion dentro del perfil y publicaciones.</li>
            <li>Reseñas, numero de alquileres y reputacion visibles para aumentar confianza.</li>
            <li>Documentos preparados para futura automatizacion con IA.</li>
          </ul>
        </div>
      </section>

      <section className="section section--cta" id="ia">
        <div>
          <span className="section-tag section-tag--light">Inteligencia artificial</span>
          <h2>La UI deja espacio para asistentes inteligentes sin romper la experiencia.</h2>
          <p>
            La IA en Renthing no es un adorno. Se muestra como ayuda real para descubrir,
            fijar precios y validar empresas dentro del flujo principal de uso.
          </p>
        </div>
        <div className="signup-card ai-grid">
          {aiFeatures.map((feature) => (
            <article className="ai-tile" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
          <div className="ai-prompt">
            <span>Prompt de ejemplo</span>
            <strong>Necesito una herramienta para perforar concreto cerca de mi ubicacion.</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
