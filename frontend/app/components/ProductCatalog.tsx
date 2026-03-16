"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Pagination from "./Pagination";

type Category = {
  id: string;
  label: string;
};

type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  pricePerDay: number;
  rating: number;
  reviews: number;
  tag: string;
  image: string;
};

const categories: Category[] = [
  { id: "all", label: "All Product" },
  { id: "home", label: "For Home" },
  { id: "music", label: "For Music" },
  { id: "tech", label: "For Phone" },
  { id: "events", label: "For Events" },
  { id: "new", label: "New Arrival" },
  { id: "top", label: "Best Seller" },
  { id: "discount", label: "On Discount" },
];

const products: Product[] = [
  {
    id: "p1",
    name: "Phone Holder Sakti",
    categoryId: "tech",
    categoryLabel: "Other",
    pricePerDay: 12,
    rating: 5.0,
    reviews: 23,
    tag: "Top Rented",
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p2",
    name: "Headsound",
    categoryId: "music",
    categoryLabel: "Music",
    pricePerDay: 9,
    rating: 5.0,
    reviews: 12,
    tag: "Weekend Pick",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p3",
    name: "Robot Cleaner",
    categoryId: "home",
    categoryLabel: "Other",
    pricePerDay: 18,
    rating: 4.4,
    reviews: 46,
    tag: "Easy Setup",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p4",
    name: "CCTV Maling",
    categoryId: "home",
    categoryLabel: "Home",
    pricePerDay: 15,
    rating: 4.8,
    reviews: 20,
    tag: "Most Trusted",
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p5",
    name: "Stuffus Peker 32",
    categoryId: "tech",
    categoryLabel: "Other",
    pricePerDay: 7,
    rating: 5.0,
    reviews: 22,
    tag: "Budget",
    image:
      "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p6",
    name: "Stuffus R175",
    categoryId: "music",
    categoryLabel: "Music",
    pricePerDay: 21,
    rating: 4.8,
    reviews: 24,
    tag: "Pro Audio",
    image:
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p7",
    name: "Smart Projector Mini",
    categoryId: "events",
    categoryLabel: "Other",
    pricePerDay: 17,
    rating: 4.9,
    reviews: 35,
    tag: "Movie Night",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p8",
    name: "Party Mic Duo",
    categoryId: "music",
    categoryLabel: "Music",
    pricePerDay: 10,
    rating: 4.7,
    reviews: 18,
    tag: "Event Ready",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p9",
    name: "Portable Ring Light",
    categoryId: "tech",
    categoryLabel: "Other",
    pricePerDay: 6,
    rating: 4.6,
    reviews: 15,
    tag: "Creator Kit",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
  },
];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ProductCatalog() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((product) => product.categoryId === activeCategory);
  }, [activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const productsToShow = filteredProducts.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="catalog-section" id="productos">
      <div className="container catalog-shell">
        <div className="catalog-head">
          <h2>Give All You Need</h2>
          <div className="catalog-search">
            <input type="text" placeholder="Search on Renthing..." aria-label="Buscar en Renthing" />
            <button type="button">Search</button>
          </div>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Categorías">
            <h3>Category</h3>
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={`sidebar-button ${activeCategory === category.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setPage(1);
                    }}
                  >
                    {category.label}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="catalog-content">
            <div className="product-grid">
              {productsToShow.map((product) => (
                <article className="product-card" key={product.id}>
                  <span className="product-chip">{product.categoryLabel}</span>
                  <div className="product-media">
                    <Image src={product.image} alt={product.name} width={360} height={220} />
                  </div>
                  <h4>{product.name}</h4>
                  <p className="product-meta">
                    <span>{product.rating.toFixed(1)} ({product.reviews} Reviews)</span>
                    <span>{product.tag}</span>
                  </p>
                  <p className="product-price">{formatPrice(product.pricePerDay)} / day</p>
                  <button type="button" className="rent-btn">
                    Rent Now
                  </button>
                </article>
              ))}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </section>
  );
}
