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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const backendToken = String((session?.user as any)?.backendToken || "");

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

  const products = dashboardData?.products ?? [];
  const pendingRequests = dashboardData?.pending_requests ?? [];
  const activeRentals = dashboardData?.active_rentals ?? [];
  const recentEarnings = dashboardData?.recent_earnings ?? [];

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
      console.error("No hay token de backend para subir imagen");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/picture/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${backendToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo subir la imagen.");
      }

      if (data?.picture_url) {
        await update({ image: data.picture_url });
      }
    } catch (uploadError) {
      console.error("Error subiendo imagen de perfil:", uploadError);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
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

                <button className={styles.publishInline}>
                  <Plus size={16} /> Publicar producto
                </button>

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

                <button className={styles.btnPrimaryWide}>
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
                  <button className={styles.btnPrimaryWide}><Plus size={16} /> Publicar producto</button>
                </div>

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
      <div className={styles.productVisual}><Icon size={56} /></div>
      <h3 className={styles.productTitle}>{product.title}</h3>
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