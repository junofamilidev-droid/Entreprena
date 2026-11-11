import { NextResponse, type NextRequest } from "next/server";
import { aAcces } from "@/lib/acces/acces";
import { adminClient } from "@/lib/supabase/admin";
import { hasSupabase, supabaseUrl } from "@/lib/supabase/env";
import { FILES_BUCKET } from "@/lib/sessions/files";

// Téléchargement d'un fichier de session (données fictives, outil Claude) : réservé aux apprenants
// qui ont accès à la formation. Chemin : <formation>/<module>/<session>/<fichier>.
// Le fichier est servi par un lien temporaire (2 minutes) vers le stockage.

export async function GET(request: NextRequest, { params }: { params: Promise<{ chemin: string[] }> }) {
  const { chemin } = await params;
  if (chemin.length !== 4 || chemin.some((p) => !p || p === "." || p === ".." || p.includes("/"))) return new NextResponse("Fichier introuvable", { status: 404 });
  if (!hasSupabase) return new NextResponse("Fichier introuvable", { status: 404 });
  const [formation] = chemin;
  const acces = await aAcces(formation);
  if (!acces.ok) {
    const cible = acces.connecte ? `/formations/${encodeURIComponent(formation)}?acces=requis` : `/app/connexion?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(new URL(cible, request.nextUrl.origin));
  }
  const objet = chemin.join("/"); // segments déjà décodés par Next.js
  const db = adminClient();
  if (!db) {
    // Développement sans clé secrète : le stockage est encore public.
    return NextResponse.redirect(`${supabaseUrl}/storage/v1/object/public/${FILES_BUCKET}/${chemin.map(encodeURIComponent).join("/")}`);
  }
  const { data, error } = await db.storage.from(FILES_BUCKET).createSignedUrl(objet, 120, { download: chemin[3] });
  if (error || !data?.signedUrl) return new NextResponse("Fichier introuvable", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
