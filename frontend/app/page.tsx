import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProductCatalog from "./components/ProductCatalog";
import Recommendations from "./components/Recommendations";
import AboutUs from "./components/AboutUs";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

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
