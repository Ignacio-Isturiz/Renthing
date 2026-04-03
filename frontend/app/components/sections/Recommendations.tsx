import Image from "next/image";

const recommendations = [
  {
    name: "Kit Podcast Starter",
    description: "Microfono, base y filtro pop para grabar desde casa.",
    price: 14,
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "GoPro Adventure",
    description: "Incluye soporte casco y bateria extra para todo el dia.",
    price: 19,
    image:
      "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Mini Drone View",
    description: "Perfecto para tomas en viajes, eventos y bienes raices.",
    price: 27,
    image:
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=500&q=80",
  },
];

export default function Recommendations() {
  return (
    <section className="recommendations" id="recomendaciones">
      <div className="container">
        <div className="section-head">
          <h2>Explore our recommendations</h2>
          <p>Datos estaticos por ahora. Luego lo conectamos a recomendaciones reales de Renthing.</p>
        </div>

        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article className="recommendation-card" key={item.name}>
              <Image src={item.image} alt={item.name} width={500} height={300} />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="recommendation-bottom">
                <strong>${item.price.toFixed(2)} / day</strong>
                <button type="button" className="rent-btn rent-btn--small">
                  Rent Now
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}