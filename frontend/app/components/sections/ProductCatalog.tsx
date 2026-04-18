"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Pagination from "../ui";
import { fetchNearbyProducts, type PublicProduct } from "../../../services/products.api";

type Category = {
  id: string;
  label: string;
};

const DEFAULT_PRODUCT_IMAGE = "/images/herogemini.jpg";
const DEFAULT_LATITUDE = 4.711;
const DEFAULT_LONGITUDE = -74.0721;

function toCategoryId(value: string): string {
  if (!value) return "otros";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function getBrowserCoordinates(): Promise<{ latitude: number; longitude: number }> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("El navegador no soporta geolocalizacion.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => reject(new Error("No se pudo obtener tu ubicacion actual.")),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  });
}

function formatPrice(value: string) {
  const amount = Number(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function ProductCatalog() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("Buscando tu ubicacion...");
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [radiusKm, setRadiusKm] = useState(25);
  const perPage = 6;

  useEffect(() => {
    let cancelled = false;

    const loadProductsForCoordinates = async (latitude: number, longitude: number) => {
      const response = await fetchNearbyProducts({
        latitude,
        longitude,
        radiusKm,
        limit: 100,
      });

      if (!cancelled) {
        setProducts(response.products);
      }
    };

    const loadNearbyProducts = async () => {
      setLoading(true);
      setError("");

      try {
        setLocationMessage("Mostrando productos cercanos a Bogota.");
        await loadProductsForCoordinates(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
      } catch (fallbackError) {
        if (!cancelled) {
          setError(
            fallbackError instanceof Error
              ? fallbackError.message
              : "Error cargando productos"
          );
        }
        setLoading(false);
        return;
      }

      setLoading(false);

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        if (!cancelled) {
          setLocationMessage("No se pudo usar GPS. Mostrando productos cercanos a Bogota.");
        }
        return;
      }

      try {
        const coords = await getBrowserCoordinates();
        if (cancelled) return;

        setLocationMessage("Mostrando productos cercanos a tu ubicacion actual.");
        await loadProductsForCoordinates(coords.latitude, coords.longitude);
      } catch {
        if (!cancelled) {
          setLocationMessage("No se pudo usar GPS. Mostrando productos cercanos a Bogota.");
        }
      }
    };

    loadNearbyProducts();

    return () => {
      cancelled = true;
    };
  }, [radiusKm]);

  const categories = useMemo<Category[]>(() => {
    const unique = new Map<string, string>();
    for (const product of products) {
      if (!product.category) continue;
      unique.set(toCategoryId(product.category), product.category);
    }

    const dynamicCategories = Array.from(unique.entries()).map(([id, label]) => ({
      id,
      label,
    }));

    return [{ id: "all", label: "Todos" }, ...dynamicCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || toCategoryId(product.category) === activeCategory;

      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;

      return (
        product.title.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, activeCategory, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const productsToShow = filteredProducts.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="catalog-section" id="productos">
      <div className="container catalog-shell">
        <div className="catalog-head">
          <h2>Give All You Need</h2>
          <div>
            <div className="catalog-search">
              <input
                type="text"
                placeholder="Buscar en Renthing..."
                aria-label="Buscar en Renthing"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setPage(1);
                }}
              />
              <select
                value={radiusKm}
                aria-label="Radio de busqueda"
                onChange={(event) => {
                  setRadiusKm(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <p>{locationMessage}</p>
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
            {loading ? (
              <p>Cargando productos...</p>
            ) : error ? (
              <p>{error}</p>
            ) : productsToShow.length === 0 ? (
              <p>No hay productos disponibles para esta ubicacion.</p>
            ) : (
              <div className="product-grid">
                {productsToShow.map((product) => (
                  <article className="product-card" key={product.id}>
                    <span className="product-chip">{product.category || "Otros"}</span>
                    <div className="product-media">
                      <Image
                        src={product.image_url || DEFAULT_PRODUCT_IMAGE}
                        alt={product.title}
                        width={360}
                        height={220}
                        unoptimized
                      />
                    </div>
                    <h4>{product.title}</h4>
                    <p className="product-meta">
                      <span>{product.owner_name}</span>
                      <span>
                        {product.distance_km !== null
                          ? `${product.distance_km.toFixed(1)} km`
                          : "Sin distancia"}
                      </span>
                    </p>
                    {product.description && <p className="product-meta">{product.description}</p>}
                    {product.address && <p className="product-meta">{product.address}</p>}
                    <p className="product-price">{formatPrice(product.daily_price)} / dia</p>
                    <button type="button" className="rent-btn">
                      Rentar ahora
                    </button>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && productsToShow.length > 0 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}