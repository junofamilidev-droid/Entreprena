import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabase, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Rafraîchit la session Supabase (cookies) à chaque requête de page, pour que le serveur
// et le navigateur voient le même apprenant connecté. Sans Supabase configuré, ne fait rien.
const PUBLIC_APP = ["/app/connexion", "/app/mot-de-passe-oublie", "/app/fichiers"];

export async function proxy(request: NextRequest) {
  if (!hasSupabase) return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await client.auth.getUser();

  // Espace apprenant réservé aux comptes connectés (sauf les pages pour se connecter).
  // Les fichiers vérifient eux-mêmes l'accès ; l'accès à chaque formation est vérifié page par page.
  const chemin = request.nextUrl.pathname;
  if (!data.user && chemin.startsWith("/app") && !PUBLIC_APP.some((p) => chemin === p || chemin.startsWith(`${p}/`))) {
    const url = new URL("/app/connexion", request.url);
    url.searchParams.set("next", chemin + request.nextUrl.search);
    const redirection = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirection.cookies.set(c));
    return redirection;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
