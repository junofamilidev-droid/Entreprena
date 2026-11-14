import "server-only";
import { getFormation } from "@/lib/content/source";
import { accorderAcces } from "./acces";
import { envoyerConfirmationCommande } from "@/lib/emails/envois";
import type { CheckoutSession } from "@/lib/stripe";

/** Première session de la formation (module ouvert), où l'acheteur arrive après le paiement. */
export async function premiereSession(slug: string) {
  const f = await getFormation(slug);
  const mod = f?.modules.find((m) => m.availability === "open") ?? f?.modules[0];
  return mod ? `/app/formations/${slug}/${mod.slug}/session/1` : `/app/formations/${slug}`;
}

/** Enregistre l'achat d'une session Stripe payée (appelé au retour du paiement et par Stripe lui-même). */
export async function enregistrerAchat(s: CheckoutSession) {
  const email = s.customer_details?.email;
  const formation = s.metadata?.formation;
  if (s.payment_status !== "paid" || !email || !formation) return null;
  const ligne = await accorderAcces({
    email,
    formation,
    origine: "achat",
    userId: s.client_reference_id,
    stripeSessionId: s.id,
    montantCents: s.amount_total,
    // Case des CGV cochée sur la page Stripe (les CGV contiennent la clause d'accès immédiat).
    renonciationAt: s.consent?.terms_of_service === "accepted" ? new Date(s.created * 1000).toISOString() : null,
  });
  // Confirmation de commande (une seule fois, même si Stripe et le retour de paiement arrivent ensemble).
  await envoyerConfirmationCommande(ligne, await premiereSession(formation)).catch(() => false);
  return ligne;
}
