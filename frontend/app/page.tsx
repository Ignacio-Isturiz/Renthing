import { Header, Footer } from "./components/layout";
import { HeroBanner, ProductCatalog, Recommendations, AboutUs, FAQ } from "./components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <HeroBanner />
      <ProductCatalog />
      <Recommendations />
      <AboutUs />
      <FAQ />
      <Footer />
    </>
  );
}
