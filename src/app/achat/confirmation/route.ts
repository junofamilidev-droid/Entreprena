import { NextResponse, type NextRequest } from "next/server";
import { lireCheckout } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { lienConnexion, utilisateurCourant } from "@/lib/acces/acces";
import { enregistrerAchat, premiereSession } from "@/lib/acces/apres-paiement";

// Retour de Stripe après le paiement : on vérifie le paiement auprès de Stripe (jamais sur la foi de l'adresse),
// on ouvre l'accès, puis on connecte l'acheteur et on l'emmène sur la session 1.
// La connexion automatique ne sert qu'une fois, et seulement dans les 2 heures qui suivent le paiement.

const DELAI_CONNEXION_MS = 2 * 3600_000;

export async function GET(request: NextRequest) {
  const origine = request.nextUrl.origin;
  const merci = (etat: string) => NextResponse.redirect(new URL(`/achat/merci?etat=${etat}`, origine));
  const id = request.nextUrl.searchParams.get("session_id");
  if (!id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return merci("introuvable");

  try {
    const session = await lireCheckout(id);
    if (session.payment_status !== "paid") return merci("attente");
    const ligne = await enregistrerAchat(session);
    if (!ligne) return merci("attente");
    const suite = await premiereSession(ligne.formation_slug);

    const user = await utilisateurCourant();
    if (user?.id === ligne.user_id) return NextResponse.redirect(new URL(suite, origine));

    const recent = Date.now() - session.created * 1000 < DELAI_CONNEXION_MS;
    if (!ligne.connexion_utilisee_at && recent) {
      // Marque la connexion comme utilisée AVANT de la donner : un deuxième passage ne connecte plus personne.
      const { data: marque } = await adminClient()!
        .from("acces")
        .update({ connexion_utilisee_at: new Date().toISOString() })
        .eq("id", ligne.id)
        .is("connexion_utilisee_at", null)
        .select("id");
      if (marque?.length) return NextResponse.redirect(await lienConnexion(ligne.email, suite, origine));
    }
    return merci("connexion");
  } catch {
    return merci("erreur");
  }
}
