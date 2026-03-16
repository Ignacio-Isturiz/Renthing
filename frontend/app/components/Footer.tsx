export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <p>Renthing</p>
        <nav aria-label="Footer">
          <a href="#productos">Productos</a>
          <a href="#recomendaciones">Recomendaciones</a>
          <a href="#about">Quienes somos</a>
          <a href="#faq">FAQ</a>
        </nav>
        <span>© {new Date().getFullYear()} Renthing</span>
      </div>
    </footer>
  );
}
