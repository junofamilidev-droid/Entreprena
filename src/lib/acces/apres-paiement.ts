import "server-only";
import { getFormation } from "@/lib/content/source";
import { accorderAcces } from "./acces";
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
  return accorderAcces({
    email,
    formation,
    origine: "achat",
    userId: s.client_reference_id,
    stripeSessionId: s.id,
    montantCents: s.amount_total,
    renonciationAt: s.metadata?.renonciation ?? null,
  });
}
