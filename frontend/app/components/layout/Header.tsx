"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Home, LayoutGrid, LogOut } from "lucide-react";
import AuthModal from "../auth";

const DEFAULT_PROFILE_IMAGE_PATH = "/images/default-profile-user.png";

export default function Header() {
  const { data: session, status, update } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = status === "authenticated";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsMenuOpen(false);
    window.location.reload();
  };

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const backendToken = session?.user?.backendToken;
    if (!backendToken) {
      console.error("No hay token de backend para actualizar la imagen");
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
        throw new Error(data?.error || "No se pudo actualizar la foto de perfil.");
      }

      if (data?.picture_url) {
        await update({ image: data.picture_url });
      }
    } catch (error) {
      console.error("Error actualizando foto de perfil:", error);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="header-logo" aria-label="Renthing inicio">
            <span>Renthing</span>
          </Link>

          <nav className="header-nav" aria-label="Navegación principal">
            <a href="#productos">Shop</a>
            <a href="#recomendaciones">Blog</a>
          </nav>

          <div className="header-actions">
            {isLoggedIn ? (
              <div className="header-profile-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="header-hidden-file-input"
                />

                <div
                  className="header-profile"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  title="Abrir menú de perfil"
                >
                  <Image
                    src={session?.user?.image || DEFAULT_PROFILE_IMAGE_PATH}
                    alt="Perfil de usuario"
                    className="header-avatar"
                    width={40}
                    height={40}
                    unoptimized
                  />
                  {isUploadingImage && <span className="header-profile-loading">...</span>}
                </div>

                {isMenuOpen && (
                  <div className="header-dropdown">
                    <div className="header-dropdown-user">
                      <button
                        type="button"
                        className="header-dropdown-user-avatar"
                        title="Haz clic para cambiar tu foto"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image
                          src={session?.user?.image || DEFAULT_PROFILE_IMAGE_PATH}
                          alt="Perfil"
                          width={34}
                          height={34}
                          unoptimized
                        />
                      </button>
                      <div className="header-dropdown-user-meta">
                        <p className="header-dropdown-user-name">
                          {session?.user?.name || "Usuario"}
                        </p>
                      </div>
                    </div>

                    <div className="header-dropdown-divider" />

                    <Link
                      href={session?.user ? "/dashboard" : "/"}
                      className="header-dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutGrid size={16} />
                      Alquilar
                    </Link>

                    <Link
                      href="/"
                      className="header-dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home size={16} />
                      Pagina principal
                    </Link>

                    <div className="header-dropdown-divider" />

                    <button
                      type="button"
                      className="header-dropdown-item logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="header-access-btn" onClick={() => setIsAuthOpen(true)}>
                Acceder
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}