import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";

// Arrivée depuis un lien reçu par email (confirmation d'adresse, mot de passe oublié).
// Supabase envoie soit un code (flux PKCE), soit un jeton : dans les deux cas on ouvre la session,
// puis on redirige vers `next` (une adresse du site uniquement).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const raw = url.searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const fail = new URL("/connexion?erreur=lien", url.origin);
  if (!hasSupabase) return NextResponse.redirect(fail);

  const client = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await client.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await client.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("lien incomplet") };

  return NextResponse.redirect(error ? fail : new URL(next, url.origin));
}
