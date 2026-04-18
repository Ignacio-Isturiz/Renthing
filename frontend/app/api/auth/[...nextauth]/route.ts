import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      async profile(profile) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: profile.email,
                first_name: profile.given_name || "",
                last_name: profile.family_name || "",
                google_id: profile.sub,
                picture: profile.picture,
              }),
            }
          );
          const data = await res.json();
          
          // Garantizar que el ID siempre sea un string válido
          const userId = String(data.id || profile.sub || "");
          
          if (!userId) {
            console.error("No se pudo obtener ID del usuario en Google signin");
            throw new Error("Invalid user ID");
          }

          return {
            id: userId,
            email: profile.email || "",
            name: profile.name || "",
            image: profile.picture,
            backendToken: data.token || "",
          };
        } catch (error) {
          console.error("Error en Google signin:", error);
          throw error;
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: credentials.email,
                password: credentials.password,
              }),
            }
          );
          
          const data = await res.json();

          if (!res.ok) {
            console.error("Login failed:", data);
            return null;
          }

          // Garantizar que el ID siempre sea un string válido
          const userId = String(data.user_id || data.id || "");
          
          if (!userId) {
            console.error("No se pudo obtener ID del usuario en login");
            return null;
          }

          const firstName = String(data.user?.first_name || "").trim();
          const lastName = String(data.user?.last_name || "").trim();
          const fullName = `${firstName} ${lastName}`.trim();

          // Retornamos el objeto usuario con el ID que viene de Django
          return {
            id: userId,
            email: data.email || credentials.email,
            name: fullName || data.name || firstName || "Usuario",
            image: data.user?.picture || "",
            backendToken: data.token || "",
          };
        } catch (error) {
          console.error("Error en login:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const normalizeImage = (value: unknown): string => {
        if (typeof value !== "string") return "";
        return value.startsWith("data:image/") ? "" : value;
      };

      // Si es el primer login, guardar el ID en el token
      if (user) {
        const userId = String(user.id);
        if (!userId || userId === "undefined") {
          console.error("❌ ERROR: user.id es inválido", { user, userId });
          return token;
        }
        console.log("✅ JWT callback: Guardando ID en token", { userId });
        token.id = userId;
        token.email = user.email;
        token.name = user.name;
        token.image = normalizeImage(user.image) || token.image;
        token.backendToken = user.backendToken || "";
      }

      if (trigger === "update" && session?.image) {
        token.image = normalizeImage(session.image);
      }

      return token;
    },
    async session({ session, token }) {
      // Pasar el ID y email del token a la sesión del cliente
      if (session?.user) {
        const tokenId = String(token.id || "");
        if (!tokenId || tokenId === "undefined") {
          console.error("❌ ERROR: token.id no está disponible", { token, session });
        } else {
          console.log("✅ Session callback: ID disponible", { tokenId });
        }
        session.user.id = tokenId;
        session.user.email = token.email || undefined;
        session.user.name = token.name || undefined;
        session.user.image = token.image || "";
        session.user.backendToken = token.backendToken || "";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };