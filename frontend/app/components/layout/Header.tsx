"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import AuthModal from "../auth";

export default function Header() {
  const { data: session, status } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = status === "authenticated";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsMenuOpen(false);
    window.location.reload();
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
                <div
                  className="header-profile"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Image
                    src={session?.user?.image || "/images/default-avatar.jpg"}
                    alt="Perfil de usuario"
                    className="header-avatar"
                    width={40}
                    height={40}
                    unoptimized
                  />
                </div>

                {isMenuOpen && (
                  <div className="header-dropdown">
                    <button
                      type="button"
                      className="header-dropdown-item logout-btn"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
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