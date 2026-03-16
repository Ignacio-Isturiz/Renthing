"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "./AuthModal";

export default function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
            <button type="button" className="header-access-btn" onClick={() => setIsAuthOpen(true)}>
              Acceder
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
