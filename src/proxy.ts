import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabase, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Rafraîchit la session Supabase (cookies) à chaque requête de page, pour que le serveur
// et le navigateur voient le même apprenant connecté. Sans Supabase configuré, ne fait rien.
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
  await client.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
