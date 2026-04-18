"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Drill,
  Filter,
  Plus,
  Search,
  Speaker,
  Star,
  User,
} from "lucide-react";
import styles from "./dashboard.module.css";
import {
  fetchDashboardData,
  type DashboardPayload,
  type DashboardProduct,
  type DashboardRentalRequest,
} from "../../services/dashboard.api";
import {
  createProduct,
  suggestProductCategory,
} from "../../services/products.api";

function formatCurrency(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatDateLabel(dateValue: string): string {
  return new Date(dateValue).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}

function getProductIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("taladro")) return Drill;
  if (n.includes("parlante")) return Speaker;
  return Box;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo leer la imagen seleccionada."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

async function getCurrentBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
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

async function reverseGeocodeLocation(latitude: number, longitude: number): Promise<{
  country: string;
  state: string;
  city: string;
}> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "14",
    addressdetails: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo resolver pais, estado y ciudad desde tu ubicacion.");
  }

  const payload: {
    address?: {
      country?: string;
      state?: string;
      state_district?: string;
      region?: string;
      city?: string;
      city_district?: string;
      town?: string;
      village?: string;
      hamlet?: string;
      suburb?: string;
      county?: string;
      municipality?: string;
    };
  } = await response.json();

  const address = payload.address ?? {};
  return {
    country: address.country ?? "",
    state: address.state ?? address.state_district ?? address.region ?? address.county ?? "",
    city:
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.city_district ??
      address.suburb ??
      address.hamlet ??
      address.county ??
      "",
  };
}

type TopSection = "explorar" | "mis-alquileres";
type RentalsTab = "solicitudes" | "productos" | "ganancias";
const DEFAULT_PROFILE_IMAGE_PATH = "/images/default-profile-user.png";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [topSection, setTopSection] = useState<TopSection>("explorar");
  const [rentalsTab, setRentalsTab] = useState<RentalsTab>("solicitudes");
  const [dashboardData, setDashboardData] =
    useState<DashboardPayload | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: "",
    daily_price: "",
    image_url: "",
    latitude: "",
    longitude: "",
    country: "",
    state: "",
    city: "",
    address: "",
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const backendToken = String(session?.user?.backendToken || "");

  useEffect(() => {
    let cancelled = false;
    const title = productForm.title.trim();

    if (!title) {
      setIsSuggestingCategory(false);
      setProductForm((current) =>
        current.category ? { ...current, category: "" } : current
      );
      return;
    }

    setIsSuggestingCategory(true);

    const timeoutId = window.setTimeout(() => {
      void suggestProductCategory(title)
        .then((suggestion) => {
          if (cancelled) return;
          setProductForm((current) =>
            current.category === suggestion.label
              ? current
              : { ...current, category: suggestion.label }
          );
        })
        .catch((error) => {
          if (cancelled) return;
          console.error(
            "No se pudo sugerir la categoria:",
            error instanceof Error ? error.message : error
          );
          setProductForm((current) => ({ ...current, category: "" }));
        })
        .finally(() => {
          if (!cancelled) {
            setIsSuggestingCategory(false);
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [productForm.title]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status !== "authenticated") return;

    if (!backendToken) {
      setError(
        "Tu sesión no tiene token de backend. Cierra sesión y vuelve a iniciar."
      );
      setLoadingData(false);
      return;
    }

    let isCancelled = false;

    fetchDashboardData(backendToken)
      .then((data) => {
        if (!isCancelled) setDashboardData(data);
      })
      .catch((err) => {
        if (!isCancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Error cargando dashboard"
          );
      })
      .finally(() => {
        if (!isCancelled) setLoadingData(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [status, backendToken, router]);

  const userName = useMemo(() => {
    return (
      dashboardData?.user?.name ||
      session?.user?.name ||
      "Usuario"
    );
  }, [dashboardData, session?.user?.name]);

  const products = useMemo(() => dashboardData?.products ?? [], [dashboardData]);
  const pendingRequests = useMemo(
    () => dashboardData?.pending_requests ?? [],
    [dashboardData]
  );
  const activeRentals = useMemo(
    () => dashboardData?.active_rentals ?? [],
    [dashboardData]
  );
  const recentEarnings = useMemo(
    () => dashboardData?.recent_earnings ?? [],
    [dashboardData]
  );

  const filteredProducts = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchValue]);

  const availableProducts = useMemo(
    () => filteredProducts.filter((p) => p.status === "available"),
    [filteredProducts]
  );
  const rentedProducts = useMemo(
    () => filteredProducts.filter((p) => p.status === "rented"),
    [filteredProducts]
  );

  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of recentEarnings) {
      const d = new Date(e.earned_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    const values = Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => (a.key > b.key ? 1 : -1))
      .slice(-3);
    if (!values.length) return [0, 0, 0];
    if (values.length === 1) return [0, values[0].value * 0.7, values[0].value];
    if (values.length === 2) return [values[0].value * 0.7, values[0].value, values[1].value];
    return values.map((v) => v.value);
  }, [recentEarnings]);

  const chartMax = Math.max(...monthlySeries, 1);

  if (loadingData) return null;
  if (error) {
    const isConnectionError =
      error.toLowerCase().includes("failed to fetch") ||
      error.toLowerCase().includes("network") ||
      error.toLowerCase().includes("refused");

    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <div className={styles.content}>
            <div className={styles.panelLarge}>
              <h2 className={styles.sectionTitle}>No se pudo cargar la dashboard</h2>
              <p className={styles.muted}>{error}</p>
              {isConnectionError && (
                <p className={styles.muted}>
                  Parece que el backend no esta corriendo en http://localhost:8000.
                  Levantalo con: <strong>cd backend && ./venv/bin/python manage.py runserver</strong>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }
  if (!dashboardData) return null;

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!backendToken) {
      console.error("No hay token de backend para actualizar imagen");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

      const response = await fetch(
        `${apiBaseUrl}/api/auth/profile/picture/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${backendToken}`,
          },
          body: formData,
        }
      );

      const rawResponse = await response.text();
      let data: { error?: string; picture_url?: string } = {};

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse) as { error?: string; picture_url?: string };
        } catch {
          if (!response.ok) {
            throw new Error(
              `Respuesta inesperada del servidor (${response.status}). Verifica NEXT_PUBLIC_API_URL y el backend.`
            );
          }
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la foto.");
      }

      if (data?.picture_url) {
        await update({ image: data.picture_url });
      }
    } catch (updateError) {
      console.error("Error actualizando imagen de perfil:", updateError);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handlePublishProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublishError("");
    setPublishSuccess("");

    if (!backendToken) {
      setPublishError("No hay token de backend. Cierra sesión y vuelve a iniciar.");
      return;
    }

    if (!productForm.title.trim() || !productForm.daily_price.trim()) {
      setPublishError("Titulo y precio por dia son obligatorios.");
      return;
    }

    if (!productForm.category.trim()) {
      setPublishError("Espera a que el sistema asigne una categoria valida.");
      return;
    }

    if (!productForm.latitude.trim() || !productForm.longitude.trim()) {
      setPublishError("Debes usar tu ubicacion actual para completar pais, estado y ciudad.");
      return;
    }

    if (!productForm.image_url.trim()) {
      setPublishError("La imagen del producto es obligatoria.");
      return;
    }

    try {
      setIsPublishing(true);
      const created = await createProduct(
        {
          title: productForm.title.trim(),
          description: productForm.description.trim() || undefined,
          category: productForm.category.trim(),
          daily_price: productForm.daily_price.trim(),
          image_url: productForm.image_url.trim(),
          latitude: Number(productForm.latitude),
          longitude: Number(productForm.longitude),
          address:
            productForm.address.trim() ||
            [productForm.city, productForm.state, productForm.country]
              .map((value) => value.trim())
              .filter(Boolean)
              .join(", ") ||
            undefined,
        },
        backendToken
      );

      setDashboardData((previous) => {
        if (!previous) return previous;

        const createdProduct: DashboardProduct = {
          id: created.id,
          title: created.title,
          description: created.description || "",
          category: created.category,
          image_url: created.image_url || "",
          daily_price: created.daily_price,
          status: created.status,
          status_label: created.status_label,
          created_at: created.created_at,
        };

        return {
          ...previous,
          summary: {
            ...previous.summary,
            products_count: previous.summary.products_count + 1,
          },
          products: [createdProduct, ...previous.products],
        };
      });

      setPublishSuccess("Producto publicado correctamente.");
      setProductForm((current) => ({
        ...current,
        title: "",
        description: "",
        category: "",
        daily_price: "",
        image_url: "",
        latitude: "",
        longitude: "",
        country: "",
        state: "",
        city: "",
        address: "",
      }));
      setShowPublishForm(false);
    } catch (creationError) {
      setPublishError(
        creationError instanceof Error
          ? creationError.message
          : "No se pudo publicar el producto."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setPublishError("");

    try {
      setIsResolvingLocation(true);
      const coords = await getCurrentBrowserLocation();
      const place = await reverseGeocodeLocation(coords.latitude, coords.longitude);
      setProductForm((current) => ({
        ...current,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
        country: place.country,
        state: place.state,
        city: place.city,
        address:
          current.address.trim() ||
          [place.city, place.state, place.country].filter(Boolean).join(", "),
      }));
    } catch (locationError) {
      setPublishError(
        locationError instanceof Error
          ? locationError.message
          : "No se pudo obtener la ubicacion actual."
      );
    } finally {
      setIsResolvingLocation(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>

        <header className={styles.topbar}>
          <div className={styles.brand}>Renthing</div>

          <div className={styles.topbarRight}>
            <div className={styles.topSwitch}>
              <button
                type="button"
                className={`${styles.topSwitchBtn} ${topSection === "explorar" ? styles.topSwitchBtnActive : ""}`}
                onClick={() => setTopSection("explorar")}
              >
                Explorar
              </button>
              <button
                type="button"
                className={`${styles.topSwitchBtn} ${topSection === "mis-alquileres" ? styles.topSwitchBtnActive : ""}`}
                onClick={() => setTopSection("mis-alquileres")}
              >
                Mis alquileres
              </button>
            </div>

            <div className="header-profile-container">
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="header-hidden-file-input"
              />

              <button
                type="button"
                className="header-profile"
                aria-label="Abrir menu de perfil"
                onClick={() => setIsProfileMenuOpen((value) => !value)}
              >
                <Image
                  src={session?.user?.image || DEFAULT_PROFILE_IMAGE_PATH}
                  alt={userName}
                  width={40}
                  height={40}
                  className="header-avatar"
                  unoptimized
                />
                {isUploadingImage && (
                  <span className="header-profile-loading">...</span>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="header-dropdown">
                  <div className="header-dropdown-user">
                    <button
                      type="button"
                      className="header-dropdown-user-avatar"
                      title="Haz clic para cambiar tu foto"
                      onClick={() => profileImageInputRef.current?.click()}
                    >
                      <Image
                        src={session?.user?.image || DEFAULT_PROFILE_IMAGE_PATH}
                        alt={userName}
                        width={40}
                        height={40}
                        unoptimized
                      />
                    </button>

                    <div className="header-dropdown-user-meta">
                      <span className="header-dropdown-user-name">{userName}</span>
                    </div>
                  </div>

                  <div className="header-dropdown-divider" />

                  <Link
                    href={session?.user ? "/dashboard" : "/"}
                    className="header-dropdown-item"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    Alquilar
                  </Link>

                  <Link
                    href="/"
                    className="header-dropdown-item"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9.5L12 3l9 6.5"></path>
                      <path d="M5 10v10h14V10"></path>
                    </svg>
                    Pagina principal
                  </Link>

                  <div className="header-dropdown-divider" />

                  <button
                    type="button"
                    className="header-dropdown-item logout-btn"
                    onClick={async () => {
                      setIsProfileMenuOpen(false);
                      await signOut({ callbackUrl: "/" });
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {topSection === "explorar" && (
          <section className={styles.content}>
            <header className={styles.pageHead}>
              <h1>Hola, {userName} 👋</h1>
              <p>
                Has ganado <strong>{formatCurrency(dashboardData.summary.monthly_earnings)}</strong> este mes
              </p>
            </header>

            <section className={styles.summaryGrid}>
              <Card icon={<Box size={16} />} label="Productos" value={dashboardData.summary.products_count} />
              <Card icon={<CalendarDays size={16} />} label="Alquilados" value={dashboardData.summary.rented_count} />
              <Card icon={<Star size={16} />} label="Rating" value={dashboardData.summary.rating.toFixed(1)} />
              <Card icon={<CalendarDays size={16} />} label="Pendientes" value={dashboardData.summary.pending_requests} />
            </section>

            <section className={styles.exploreGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Acciones rápidas</h2>
                </div>

                <button
                  type="button"
                  className={styles.publishInline}
                  onClick={() => {
                    setShowPublishForm((value) => !value);
                    setPublishError("");
                    setPublishSuccess("");
                  }}
                >
                  <Plus size={16} /> Publicar producto
                </button>

                {showPublishForm && (
                  <PublishProductForm
                    productForm={productForm}
                    isPublishing={isPublishing}
                    isResolvingLocation={isResolvingLocation}
                    isSuggestingCategory={isSuggestingCategory}
                    publishError={publishError}
                    publishSuccess={publishSuccess}
                    onChange={setProductForm}
                    onSubmit={handlePublishProduct}
                    onUseCurrentLocation={handleUseCurrentLocation}
                    setPublishError={setPublishError}
                  />
                )}

                <div className={styles.listStack}>
                  {pendingRequests.length === 0 ? (
                    <p className={styles.muted}>No tienes solicitudes pendientes.</p>
                  ) : (
                    pendingRequests.slice(0, 1).map((req) => (
                      <RequestItem key={req.id} request={req} />
                    ))
                  )}
                </div>

                <div className={styles.earningsMini}>
                  <h3>Ingresos recientes</h3>
                  <div className={styles.earningsMiniRows}>
                    {recentEarnings.length === 0 ? (
                      <p className={styles.muted}>Sin ingresos aún.</p>
                    ) : (
                      recentEarnings.slice(0, 3).map((e) => (
                        <div className={styles.earnRow} key={e.id}>
                          <span>{e.product_title || "Producto"}</span>
                          <strong>{formatCurrency(e.amount)}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Mis productos</h2>
                  <button type="button" className={styles.linkBtn}>Ver todos</button>
                </div>

                <div className={styles.listStack}>
                  {products.length === 0 ? (
                    <p className={styles.muted}>Todavía no tienes productos.</p>
                  ) : (
                    products.slice(0, 3).map((p) => (
                      <ProductCompact key={p.id} product={p} />
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className={styles.btnPrimaryWide}
                  onClick={() => {
                    setShowPublishForm(true);
                    setPublishError("");
                    setPublishSuccess("");
                  }}
                >
                  <Plus size={16} /> Publicar producto
                </button>
              </div>
            </section>
          </section>
        )}

        {topSection === "mis-alquileres" && (
          <section className={styles.content}>
            <header className={styles.rentalsHead}>
              <h1>Mis alquileres</h1>

              <nav className={styles.rentalsTabs}>
                <button
                  type="button"
                  className={`${styles.rentalsTab} ${rentalsTab === "solicitudes" ? styles.rentalsTabActive : ""}`}
                  onClick={() => setRentalsTab("solicitudes")}
                >
                  Solicitudes
                </button>
                <button
                  type="button"
                  className={`${styles.rentalsTab} ${rentalsTab === "productos" ? styles.rentalsTabActive : ""}`}
                  onClick={() => setRentalsTab("productos")}
                >
                  Productos <span className={styles.countPill}>{products.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.rentalsTab} ${rentalsTab === "ganancias" ? styles.rentalsTabActive : ""}`}
                  onClick={() => setRentalsTab("ganancias")}
                >
                  Ganancias
                </button>
              </nav>
            </header>

            {rentalsTab === "solicitudes" && (
              <>
                <section className={styles.toolbar}>
                  <div className={styles.badgeTab}>Pendientes <span>{pendingRequests.length}</span></div>
                  <div className={styles.toolbarControls}>
                    <button type="button" className={styles.selectLike}>Todos los productos <ChevronDown size={15} /></button>
                    <label className={styles.searchLike}>
                      <Search size={15} />
                      <input
                        type="text"
                        placeholder="Buscar"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                    </label>
                    <button type="button" className={styles.iconBtnOutline}><Filter size={15} /></button>
                  </div>
                </section>

                <section className={styles.panelLarge}>
                  {pendingRequests.length === 0 ? (
                    <p className={styles.muted}>No tienes solicitudes pendientes.</p>
                  ) : (
                    pendingRequests.slice(0, 1).map((req) => (
                      <RequestItem key={req.id} request={req} />
                    ))
                  )}
                </section>

                <section className={styles.splitGrid}>
                  <div className={styles.panel}>
                    <h3 className={styles.sectionTitle}>Activos</h3>
                    {activeRentals.length === 0 ? (
                      <p className={styles.muted}>Sin alquileres activos.</p>
                    ) : (
                      activeRentals.slice(0, 2).map((r) => (
                        <RentalActiveCard key={r.id} request={r} />
                      ))
                    )}
                  </div>

                  <div className={styles.panel}>
                    <h3 className={styles.sectionTitle}>Activos</h3>
                    {activeRentals.length <= 2 ? (
                      <p className={styles.muted}>No hay más alquileres activos.</p>
                    ) : (
                      activeRentals.slice(2, 4).map((r) => (
                        <RentalActiveCard key={r.id} request={r} />
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {rentalsTab === "productos" && (
              <>
                <section className={styles.toolbar}>
                  <div className={styles.filtersInline}>
                    <span className={styles.badgeTab}>Todos <span>{filteredProducts.length}</span></span>
                    <span className={styles.badgeTab}>Disponibles <span>{availableProducts.length}</span></span>
                    <span className={styles.badgeTab}>Alquilados <span>{rentedProducts.length}</span></span>
                  </div>

                  <div className={styles.toolbarControls}>
                    <button type="button" className={styles.selectLike}>Todas las categorias <ChevronDown size={15} /></button>
                    <label className={styles.searchLike}>
                      <Search size={15} />
                      <input
                        type="text"
                        placeholder="Buscar"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                    </label>
                    <button type="button" className={styles.iconBtnOutline}><Filter size={15} /></button>
                  </div>
                </section>

                <div className={styles.productsHeaderActions}>
                  <button
                    type="button"
                    className={styles.btnPrimaryWide}
                    onClick={() => {
                      setShowPublishForm((value) => !value);
                      setPublishError("");
                      setPublishSuccess("");
                    }}
                  >
                    <Plus size={16} /> Publicar producto
                  </button>
                </div>

                {showPublishForm && (
                  <PublishProductForm
                    productForm={productForm}
                    isPublishing={isPublishing}
                    isResolvingLocation={isResolvingLocation}
                    isSuggestingCategory={isSuggestingCategory}
                    publishError={publishError}
                    publishSuccess={publishSuccess}
                    onChange={setProductForm}
                    onSubmit={handlePublishProduct}
                    onUseCurrentLocation={handleUseCurrentLocation}
                    setPublishError={setPublishError}
                  />
                )}

                <section className={styles.productsGrid}>
                  {filteredProducts.length === 0 ? (
                    <p className={styles.muted}>No hay productos para los filtros actuales.</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <ProductCardLarge key={p.id} product={p} />
                    ))
                  )}
                </section>
              </>
            )}

            {rentalsTab === "ganancias" && (
              <>
                <section className={styles.toolbar}>
                  <div className={styles.filtersInline}>
                    <span className={styles.badgeTab}>Este mes</span>
                    <span className={styles.badgeTab}>Abr</span>
                    <span className={styles.badgeTab}>Mar</span>
                  </div>
                  <div className={styles.toolbarControls}>
                    <button type="button" className={styles.selectLike}>Todos los productos <ChevronDown size={15} /></button>
                  </div>
                </section>

                <section className={styles.earningsPanel}>
                  <div className={styles.chartBlock}>
                    <h3 className={styles.sectionTitle}>Ganancias mensuales</h3>
                    <p className={styles.earningsMain}>{formatCurrency(dashboardData.summary.monthly_earnings)}</p>
                    <p className={styles.muted}>Datos reales según tus transacciones registradas.</p>

                    <div className={styles.chartLines}>
                      {monthlySeries.map((value, index) => {
                        const height = Math.max((value / chartMax) * 100, 8);
                        return (
                          <div className={styles.chartPoint} key={`${value}-${index}`}>
                            <div className={styles.chartBar} style={{ height: `${height}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.tableBlock}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Fecha</th>
                          <th>Ganancia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEarnings.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={styles.muted}>Sin ingresos registrados.</td>
                          </tr>
                        ) : (
                          recentEarnings.map((earning) => (
                            <tr key={earning.id}>
                              <td>{earning.product_title || "Producto"}</td>
                              <td>{formatDateLabel(earning.earned_at)}</td>
                              <td>{formatCurrency(earning.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

/* ================= COMPONENTES ================= */

function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        {icon} {label}
      </div>
      <p className={styles.cardValue}>{value}</p>
    </article>
  );
}

function RequestItem({
  request,
}: {
  request: DashboardRentalRequest;
}) {
  return (
    <article className={styles.requestCard}>
      <div className={styles.requestMain}>
        <div className={styles.avatar}><User size={16} /></div>
        <div>
          <p className={styles.itemName}>{request.renter_name}</p>
          <p className={styles.itemMeta}>Quiere alquilar: {request.product_title}</p>
          <p className={styles.itemMeta}>{formatDateRange(request.start_date, request.end_date)}</p>
        </div>
      </div>

      <div className={styles.rowActions}>
        <button className={styles.btnSuccess}>Aceptar</button>
        <button className={styles.btnGhost}>Rechazar</button>
      </div>
    </article>
  );
}

function ProductCompact({
  product,
}: {
  product: DashboardProduct;
}) {
  const isRented = product.status === "rented";
  const Icon = getProductIcon(product.title);

  return (
    <div className={styles.productCompact}>
      <div className={styles.productCompactMain}>
        <div className={styles.productIcon}><Icon size={16} /></div>
        <div>
          <p className={styles.itemName}>{product.title}</p>
          <small className={styles.itemMeta}>{formatCurrency(product.daily_price)} / día</small>
        </div>
      </div>

      <span className={isRented ? styles.badgeRented : styles.badgeAvailable}>
        {product.status_label}
      </span>
    </div>
  );
}

function RentalActiveCard({ request }: { request: DashboardRentalRequest }) {
  return (
    <article className={styles.activeCard}>
      <div>
        <p className={styles.itemName}>{request.renter_name}</p>
        <p className={styles.itemMeta}>{request.product_title}</p>
        <p className={styles.itemMeta}>{formatDateRange(request.start_date, request.end_date)}</p>
      </div>
      <span className={styles.badgeRented}>{request.status_label}</span>
    </article>
  );
}

function ProductCardLarge({ product }: { product: DashboardProduct }) {
  const isRented = product.status === "rented";
  const Icon = getProductIcon(product.title);

  return (
    <article className={styles.productCardLarge}>
      <div className={styles.productVisual}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className={styles.productVisualImage}
            unoptimized
          />
        ) : (
          <Icon size={56} />
        )}
      </div>
      <h3 className={styles.productTitle}>{product.title}</h3>
      {product.description && <p className={styles.productDescription}>{product.description}</p>}
      <span className={isRented ? styles.badgeRented : styles.badgeAvailable}>{product.status_label}</span>

      <div className={styles.productMetaRow}>
        <span><CircleDollarSign size={14} /> {formatCurrency(product.daily_price)}</span>
        <span>{product.category || "Sin categoría"}</span>
      </div>

      <div className={styles.rowActions}>
        <button type="button" className={styles.btnGhost}>Editar</button>
        <button type="button" className={styles.btnGhost}>Ver detalles <ChevronRight size={14} /></button>
      </div>
    </article>
  );
}

function PublishProductForm({
  productForm,
  isPublishing,
  isResolvingLocation,
  isSuggestingCategory,
  publishError,
  publishSuccess,
  onChange,
  onSubmit,
  onUseCurrentLocation,
  setPublishError,
}: {
  productForm: {
    title: string;
    description: string;
    category: string;
    daily_price: string;
    image_url: string;
    latitude: string;
    longitude: string;
    country: string;
    state: string;
    city: string;
    address: string;
  };
  isPublishing: boolean;
  isResolvingLocation: boolean;
  isSuggestingCategory: boolean;
  publishError: string;
  publishSuccess: string;
  onChange: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      category: string;
      daily_price: string;
      image_url: string;
      latitude: string;
      longitude: string;
      country: string;
      state: string;
      city: string;
      address: string;
    }>
  >;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onUseCurrentLocation: () => Promise<void>;
  setPublishError: React.Dispatch<React.SetStateAction<string>>;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleFileSelection = async (selectedFile?: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setPublishError("Debes seleccionar una imagen valida.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      onChange((current) => ({ ...current, image_url: dataUrl }));
      setPublishError("");
    } catch (fileError) {
      setPublishError(
        fileError instanceof Error ? fileError.message : "No se pudo leer la imagen."
      );
    }
  };

  return (
    <form className={styles.publishForm} onSubmit={onSubmit}>
      <div className={styles.publishGrid}>
        <label>
          Titulo
          <input
            type="text"
            value={productForm.title}
            onChange={(event) =>
              onChange((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Descripcion
          <textarea
            value={productForm.description}
            onChange={(event) =>
              onChange((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            placeholder="Describe el producto, su estado y lo que incluye"
          />
        </label>

        <label>
          Categoria asignada
          <div className={styles.categoryPanel}>
            <div className={styles.categoryTagWrap}>
              {isSuggestingCategory ? (
                <span className={styles.categoryTagMuted}>Analizando el titulo...</span>
              ) : productForm.category ? (
                <span className={styles.categoryTag}>{productForm.category}</span>
              ) : (
                <span className={styles.categoryTagMuted}>Primero coloca un titulo</span>
              )}
            </div>
          </div>
        </label>

        <label>
          Precio por dia
          <input
            type="number"
            min="0"
            step="1"
            value={productForm.daily_price}
            onChange={(event) =>
              onChange((current) => ({ ...current, daily_price: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Pais
          <input
            type="text"
            value={productForm.country}
            onChange={(event) =>
              onChange((current) => ({ ...current, country: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Estado / Departamento
          <input
            type="text"
            value={productForm.state}
            onChange={(event) =>
              onChange((current) => ({ ...current, state: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Ciudad
          <input
            type="text"
            value={productForm.city}
            onChange={(event) =>
              onChange((current) => ({ ...current, city: event.target.value }))
            }
            required
          />
        </label>

        <label className={styles.publishFullRow}>
          Direccion (opcional)
          <input
            type="text"
            value={productForm.address}
            onChange={(event) =>
              onChange((current) => ({ ...current, address: event.target.value }))
            }
            placeholder="Ej: Calle 72 #10-34, Bogota"
          />
        </label>

        <div className={styles.publishFullRow}>
          <span className={styles.publishFieldLabel}>Imagen del producto</span>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={(event) => {
              void handleFileSelection(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div
            className={`${styles.imageDropzone} ${isDraggingImage ? styles.imageDropzoneActive : ""} ${productForm.image_url ? styles.imageDropzoneFilled : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingImage(false);
              void handleFileSelection(event.dataTransfer.files?.[0]);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                imageInputRef.current?.click();
              }
            }}
          >
            {productForm.image_url ? (
              <div className={styles.imageDropzonePreview}>
                <Image
                  src={productForm.image_url}
                  alt="Vista previa de la imagen del producto"
                  width={96}
                  height={96}
                  className={styles.imageDropzonePreviewImage}
                  unoptimized
                />
                <div>
                  <strong>Imagen lista</strong>
                  <p>Haz clic o arrastra otra foto para reemplazarla.</p>
                </div>
              </div>
            ) : (
              <div className={styles.imageDropzoneText}>
                <strong>Agrega o arrastra tus fotos aquí</strong>
                <p>
                  La imagen es obligatoria. Usa una foto limpia, sin bordes, logos ni marcas de agua.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {publishError && <p className={styles.publishError}>{publishError}</p>}
      {publishSuccess && <p className={styles.publishSuccess}>{publishSuccess}</p>}

      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={onUseCurrentLocation}
          disabled={isResolvingLocation || isPublishing}
        >
          {isResolvingLocation ? "Obteniendo GPS..." : "Usar mi ubicacion actual"}
        </button>
        <button type="submit" className={styles.btnPrimaryWide} disabled={isPublishing}>
          {isPublishing ? "Publicando..." : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}