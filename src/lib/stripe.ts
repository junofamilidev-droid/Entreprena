import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Appels à Stripe sans bibliothèque : l'API reçoit des formulaires et renvoie du JSON.
// Clé : STRIPE_SECRET_KEY (variable d'environnement de Vercel, jamais dans le code).
// Sans clé, les ventes restent fermées (le site propose d'être prévenu).

export const ventesOuvertes = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** Transforme { a: { b: 1 } } en « a[b]=1 », le format attendu par Stripe. */
export function formulaire(obj: Record<string, unknown>, prefixe = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const cle = prefixe ? `${prefixe}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? formulaire(x as Record<string, unknown>, `${cle}[${i}]`, out) : out.append(`${cle}[${i}]`, String(x))));
    else if (typeof v === "object") formulaire(v as Record<string, unknown>, cle, out);
    else out.append(cle, String(v));
  }
  return out;
}

async function stripe<T>(chemin: string, params?: Record<string, unknown>): Promise<T> {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw new Error("Paiement non configuré");
  const r = await fetch(`https://api.stripe.com/v1/${chemin}`, {
    method: params ? "POST" : "GET",
    headers: { Authorization: `Bearer ${cle}`, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? formulaire(params) : undefined,
    cache: "no-store",
  });
  const json = (await r.json()) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(json.error?.message ?? `Stripe ${r.status}`);
  return json;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
  amount_total: number | null;
  created: number;
  client_reference_id: string | null;
  customer_details: { email: string | null } | null;
  metadata: Record<string, string>;
  /** « accepted » quand l'acheteur a coché la case des CGV sur la page de paiement. */
  consent: { terms_of_service: "accepted" | null } | null;
};

/**
 * Page de paiement Stripe. La case standard « J'accepte les conditions générales de vente » y est obligatoire :
 * les CGV contiennent la clause d'accès immédiat au contenu numérique (renonciation au droit de rétractation).
 * Prérequis : l'adresse des CGV renseignée dans Stripe (Paramètres → Informations publiques → Conditions d'utilisation).
 */
export function creerCheckout(p: { formation: string; titre: string; prixCents: number; origine: string; email?: string; userId?: string }) {
  return stripe<CheckoutSession>("checkout/sessions", {
    mode: "payment",
    locale: "fr",
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: p.prixCents, product_data: { name: p.titre } } }],
    customer_email: p.email,
    client_reference_id: p.userId,
    metadata: { formation: p.formation },
    consent_collection: { terms_of_service: "required" },
    custom_text: { terms_of_service_acceptance: { message: `J'accepte les [conditions générales de vente](${p.origine}/cgv).` } },
    payment_intent_data: { metadata: { formation: p.formation } },
    success_url: `${p.origine}/achat/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${p.origine}/formations/${p.formation}?paiement=annule`,
  });
}

export const lireCheckout = (id: string) => stripe<CheckoutSession>(`checkout/sessions/${encodeURIComponent(id)}`);

/**
 * Vérifie la signature d'un événement envoyé par Stripe (en-tête « Stripe-Signature »),
 * et refuse un événement de plus de 5 minutes (rejeu).
 */
export function signatureValide(corps: string, entete: string | null, secret: string, maintenant = Date.now()) {
  if (!entete) return false;
  const parts = Object.fromEntries(entete.split(",").map((x) => x.split("=") as [string, string]));
  const t = Number(parts.t);
  const v1 = entete
    .split(",")
    .filter((x) => x.startsWith("v1="))
    .map((x) => x.slice(3));
  if (!t || !v1.length || Math.abs(maintenant / 1000 - t) > 300) return false;
  const attendu = createHmac("sha256", secret).update(`${t}.${corps}`).digest();
  return v1.some((s) => {
    const b = Buffer.from(s, "hex");
    return b.length === attendu.length && timingSafeEqual(b, attendu);
  });
}
