import Link from "next/link";

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
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header / Topbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 no-underline text-blue-600 font-bold text-xl" aria-label="Volver a inicio Renthing">
          <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg">R</span>
          <span>Renthing</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Login
          </Link>
          <Link href="/" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all">
            Registro
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-12">
        
        {/* Left Side: Pitch Card */}
        <article className="lg:col-span-5 space-y-6">
          <p className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full">
            Log de acceso
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
            Trazabilidad comercial de inicios de sesión en Renthing.
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Este módulo permite auditar accesos para mejorar la seguridad de personas y empresas que operan dentro del marketplace.
          </p>

          <div className="flex flex-wrap gap-2">
            {["2FA listo", "Alertas de ubicación", "Control de sesiones"].map(pill => (
              <span key={pill} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                {pill}
              </span>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Uso recomendado</h2>
            <ul className="space-y-3">
              {[
                "Detectar accesos sospechosos.",
                "Cerrar sesiones desconocidas.",
                "Historial previo a cambios de clave."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <span className="text-blue-500 font-bold">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* Right Side: Form Card (Log Table) */}
        <article className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 lg:p-8">
          <div className="mb-8">
            <p className="text-blue-600 font-bold text-xs uppercase mb-1">Historial de sesiones</p>
            <h2 className="text-2xl font-bold text-gray-900">Log de autenticación</h2>
            <p className="text-gray-500 text-sm mt-1">Visualiza hora, usuario, canal y estado.</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((filter) => (
              <button 
                key={filter}
                className="px-4 py-1.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 hover:border-blue-300 transition-all active:scale-95"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Table Head */}
                <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                  <span>Fecha</span>
                  <span>Cuenta</span>
                  <span>Canal</span>
                  <span>Ciudad</span>
                  <span>Estado</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-50">
                  {logs.map((row) => (
                    <div className="grid grid-cols-5 px-4 py-4 text-sm items-center hover:bg-blue-50/30 transition-colors" key={row.join("-")}>
                      <span className="text-gray-500">{row[0]}</span>
                      <span className="font-medium truncate pr-2">{row[1]}</span>
                      <span className="text-gray-600">{row[2]}</span>
                      <span className="text-gray-600">{row[3]}</span>
                      <span>
                        <b className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          row[4] === "ok" ? "bg-green-100 text-green-700" : 
                          row[4] === "warn" ? "bg-yellow-100 text-yellow-700" : 
                          "bg-red-100 text-red-700"
                        }`}>
                          {row[4] === "ok" ? "Exitoso" : row[4] === "warn" ? "Riesgo" : "Bloqueado"}
                        </b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center italic">
            Vista de frontend. Datos simulados para desarrollo.
          </p>
        </article>
      </section>
    </main>
  );
}