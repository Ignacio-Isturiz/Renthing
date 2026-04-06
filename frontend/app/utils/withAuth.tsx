"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * HOC para proteger rutas que requieren autenticación.
 * Verifica que el usuario esté autenticado y tenga un ID válido.
 *
 * Uso:
 * export default withAuth(MyDashboard);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const { data: session, status } = useSession();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Montar el componente (solo en cliente)
    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Validar autenticación
    useEffect(() => {
      if (!isMounted) return;

      if (status === "loading") {
        return;
      }

      // Si no está logueado, redirigir
      if (status === "unauthenticated") {
        redirect("/");
        return;
      }

      // Validar que tenga un ID válido
      const userId = (session?.user as any)?.id;
      if (!userId || userId === "undefined") {
        console.error("Usuario autenticado pero sin ID válido");
        redirect("/");
        return;
      }

      setIsAuthorized(true);
    }, [isMounted, status, session]);

    // No renderizar nada hasta estar montado
    if (!isMounted) {
      return null;
    }

    // Mostrar loading mientras se verifica
    if (status === "loading" || !isAuthorized) {
      return (
        <div className="p-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      );
    }

    // Renderizar el componente si está autenticado
    return <Component {...props} />;
  };
}
