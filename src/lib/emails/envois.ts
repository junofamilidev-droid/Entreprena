import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import { calculer, LIBELLE_EXPOSITION, type Cadre, type Frequence, type Objectif } from "@/lib/diagnostic-metier/calcul";
import { AUTRE, metierParId } from "@/lib/diagnostic-metier/metiers";
import { construirePlan } from "@/lib/diagnostic-metier/plan";
import { getFormation } from "@/lib/content/source";
import { METIERS_A_VENIR } from "@/lib/vitrine/metiers";
import { PAGES_FORMATION } from "@/lib/vitrine/pages-formation";
import { ENTREPRISE } from "@/lib/vitrine/legal";
import { EMAILS, type NomEmail } from "./textes";
import { construireEmail, type Variables } from "./gabarit";

// Envoi des emails automatiques, par le service Resend.
// Rien ne part tant que RESEND_API_KEY et EMAIL_EXPEDITEUR ne sont pas réglés dans Vercel :
// les fonctions ci-dessous s'arrêtent alors sans erreur (le site fonctionne normalement).
// Variables : RESEND_API_KEY, EMAIL_EXPEDITEUR (« Entreprena <bonjour@domaine.fr> »), EMAIL_REPONSE (facultatif),
// SITE_URL (« https://domaine.fr »), EMAIL_SECRET (facultatif : sinon la clé secrète Supabase signe les liens).

export const emailsActifs = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_EXPEDITEUR);

/** Adresse du site pour les liens des emails (pas de requête en cours lors des envois programmés). */
export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const pied = () => `Entreprena · ${ENTREPRISE.email || "[adresse de contact à compléter]"}`;

/* ---------- Liens signés (plan personnel, désinscription) ---------- */

function secret() {
  const s = process.env.EMAIL_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error("Aucun secret pour signer les liens");
  return s;
}
export function jeton(portee: string) {
  return createHmac("sha256", secret()).update(portee).digest("base64url").slice(0, 32);
}
export function jetonValide(portee: string, t: string | null | undefined) {
  if (!t) return false;
  try {
    const a = Buffer.from(jeton(portee));
    const b = Buffer.from(t);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
export const lienPlan = (id: string) => `${siteUrl()}/diagnostic/plan/${id}?t=${jeton(`plan:${id}`)}`;
export function lienDesinscription(email: string, portee: string) {
  const e = Buffer.from(email).toString("base64url");
  return `${siteUrl()}/desinscription?e=${e}&s=${encodeURIComponent(portee)}&t=${jeton(`${portee}:${email}`)}`;
}

/* ---------- Envoi ---------- */

async function envoyer(a: string, nom: NomEmail, v: Variables): Promise<boolean> {
  if (!emailsActifs()) return false;
  const email = construireEmail(EMAILS[nom], v, pied());
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_EXPEDITEUR,
      to: [a],
      reply_to: process.env.EMAIL_REPONSE || undefined,
      subject: email.objet,
      html: email.html,
      text: email.texte,
      headers: v.lien_desinscription ? { "List-Unsubscribe": `<${v.lien_desinscription}>` } : undefined,
    }),
    cache: "no-store",
  });
  return r.ok;
}

/* ---------- Diagnostic : plan (J0), conseils (J+2, J+5) ---------- */

export type LigneDiagnostic = {
  id: string;
  email: string | null;
  metier: string;
  metier_autre: string | null;
  taches: string[];
  frequence_ia: Frequence;
  cadre: Cadre;
  objectif: Objectif;
};

/** Ce que le métier propose ensuite : la page de sa formation (publiée ou en préparation). */
async function formationDuMetier(metierId: string) {
  const m = metierParId(metierId);
  if (m?.formation) {
    const f = await getFormation(m.formation);
    return { disponible: true, titre: f?.title ?? m.libelle, lien: `${siteUrl()}/formations/${m.formation}`, slug: m.formation };
  }
  const aVenir = METIERS_A_VENIR.find((x) => x.diag === metierId);
  return {
    disponible: false,
    titre: aVenir ? `la formation ${aVenir.nom}` : "nos formations",
    lien: aVenir ? `${siteUrl()}/formations/${aVenir.slug}` : `${siteUrl()}/formations`,
    slug: null,
  };
}

/** Variables d'un email de diagnostic, recalculées à partir des réponses enregistrées. */
export async function variablesDiagnostic(d: LigneDiagnostic): Promise<Variables> {
  const metier = metierParId(d.metier);
  if (!metier || !d.email) throw new Error("Diagnostic incomplet");
  const resultat = calculer({ metier: d.metier, metierAutre: d.metier_autre ?? undefined, taches: d.taches, frequence: d.frequence_ia, cadre: d.cadre, objectif: d.objectif }, metier.taches);
  const plan = construirePlan(metier, resultat, { cadre: d.cadre, objectif: d.objectif, metierAutre: d.metier_autre ?? undefined }, false);
  const f = await formationDuMetier(d.metier);
  return {
    metier: metier.id === AUTRE ? d.metier_autre || "votre métier" : metier.libelle,
    niveau: LIBELLE_EXPOSITION[resultat.niveau].replace(/^Exposition /, ""),
    score: String(resultat.score),
    tache: plan.tache.libelle,
    tache_ia: plan.tache.ia,
    tache_humain: plan.tache.humain,
    tache_action: plan.tache.action,
    cadre_titre: plan.cadre.titre,
    cadre_texte: plan.cadre.texte,
    intro_plan: plan.ton,
    formation_titre: f.titre,
    lien_formation: f.lien,
    ligne_formation: f.disponible ? `Pour aller plus loin : ${f.titre}` : "Être prévenu de l'ouverture d'une formation pour votre métier",
    lien_plan: lienPlan(d.id),
  };
}

const COLONNES = "id, email, metier, metier_autre, taches, frequence_ia, cadre, objectif";

/** « Votre plan d'action », une seule fois par diagnostic. */
export async function envoyerPlan(id: string) {
  const db = adminClient();
  if (!db || !emailsActifs()) return false;
  // On marque d'abord (seulement si ce n'est pas déjà fait) : deux appels simultanés n'envoient qu'un email.
  const { data } = await db.from("diagnostics_metier").update({ j0_sent_at: new Date().toISOString() }).eq("id", id).is("j0_sent_at", null).not("email", "is", null).select(COLONNES);
  const d = data?.[0] as LigneDiagnostic | undefined;
  if (!d?.email) return false;
  return envoyer(d.email, "plan", await variablesDiagnostic(d));
}

/** Diagnostics à relancer : case cochée, pas désinscrit, pas encore envoyé, entre `jours` et `jours + 7` jours. */
export async function envoyerConseils(n: 1 | 2, maintenant = Date.now()) {
  const db = adminClient();
  if (!db || !emailsActifs()) return { envoyes: 0 };
  const jours = n === 1 ? 2 : 5;
  const colonne = n === 1 ? "j2_sent_at" : "j5_sent_at";
  const avant = new Date(maintenant - jours * 86400_000).toISOString();
  const pasAvant = new Date(maintenant - (jours + 7) * 86400_000).toISOString(); // pas de rattrapage de vieux diagnostics
  const { data: lignes } = await db
    .from("diagnostics_metier")
    .select(`${COLONNES}, j2_sent_at`)
    .eq("consentement_emails", true)
    .is("desinscrit_at", null)
    .is(colonne, null)
    .not("email", "is", null)
    .lte("created_at", avant)
    .gte("created_at", pasAvant)
    .limit(200);
  // Le conseil 2 suit toujours le conseil 1.
  const data = ((lignes ?? []) as (LigneDiagnostic & { j2_sent_at: string | null })[]).filter((d) => n === 1 || d.j2_sent_at);
  let envoyes = 0;
  for (const d of data) {
    const { data: marque } = await db.from("diagnostics_metier").update({ [colonne]: new Date(maintenant).toISOString() }).eq("id", d.id).is(colonne, null).select("id");
    if (!marque?.length || !d.email) continue;
    const v = { ...(await variablesDiagnostic(d)), lien_desinscription: lienDesinscription(d.email, "conseils") };
    const nom: NomEmail = d.metier === "auditeur" ? (n === 1 ? "conseil1Auditeur" : "conseil2Auditeur") : n === 1 ? "conseil1" : "conseil2";
    if (await envoyer(d.email, nom, v)) envoyes++;
  }
  return { envoyes };
}

/* ---------- Achats et accès offerts ---------- */

const MENTION_TVA = () => ENTREPRISE.mentionTva || "[mention de TVA à compléter]";
const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
const vendeur = () => [ENTREPRISE.nom, ENTREPRISE.statut, ENTREPRISE.adresse, ENTREPRISE.siret && `SIRET ${ENTREPRISE.siret}`].filter(Boolean).join(", ") || "[nom, statut, adresse, SIRET à compléter]";

type Acces = { id: string; email: string; formation_slug: string; montant_cents: number | null; created_at: string };

/** Marque l'accès comme « email envoyé » (une seule fois) ; renvoie false s'il l'était déjà. */
async function marquerConfirmation(id: string) {
  const db = adminClient();
  if (!db) return false;
  const { data } = await db.from("acces").update({ confirmation_envoyee_at: new Date().toISOString() }).eq("id", id).is("confirmation_envoyee_at", null).select("id");
  return Boolean(data?.length);
}

/** Confirmation de commande (vaut confirmation sur support durable). `suite` : page où mène le bouton. */
export async function envoyerConfirmationCommande(a: Acces, suite: string) {
  if (!emailsActifs() || !(await marquerConfirmation(a.id))) return false;
  const f = await getFormation(a.formation_slug);
  return envoyer(a.email, "commande", {
    formation_titre: f?.title ?? a.formation_slug,
    prix: euros(a.montant_cents ?? (PAGES_FORMATION[a.formation_slug]?.prix ?? 0) * 100),
    mention_tva: MENTION_TVA(),
    date_achat: new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    numero_commande: a.id.slice(0, 8).toUpperCase(),
    lien_cgv: `${siteUrl()}/cgv`,
    lien_connexion: `${siteUrl()}/app/connexion?next=${encodeURIComponent(suite)}`,
    vendeur: vendeur(),
  });
}

/** Accès offert à un testeur, avec son lien de connexion directe. */
export async function envoyerAccesTesteur(a: Acces, lienConnexion: string) {
  if (!emailsActifs() || !(await marquerConfirmation(a.id))) return false;
  const f = await getFormation(a.formation_slug);
  return envoyer(a.email, "testeur", { formation_titre: f?.title ?? a.formation_slug, lien_connexion: lienConnexion });
}

/* ---------- Annonce d'ouverture ---------- */

/** Formation visée par une inscription « Être prévenu » : « ventes:<formation> » ou le métier du diagnostic. */
async function cibleAnnonce(cle: string) {
  if (cle.startsWith("ventes:")) {
    const slug = cle.slice(7);
    const f = await getFormation(slug);
    return { titre: f?.title ?? slug, lien: `${siteUrl()}/formations/${slug}`, prix: PAGES_FORMATION[slug]?.prix };
  }
  const f = await formationDuMetier(cle);
  const prix = f.slug ? PAGES_FORMATION[f.slug]?.prix : undefined;
  return { titre: f.titre.replace(/^la formation /, "La formation "), lien: f.lien, prix };
}

/** Envoie l'annonce d'ouverture à tous les inscrits de cette clé qui ne l'ont pas encore reçue. */
export async function envoyerAnnonce(cle: string) {
  const db = adminClient();
  if (!db) return { envoyes: 0, erreur: "Clé secrète Supabase absente" };
  if (!emailsActifs()) return { envoyes: 0, erreur: "Envoi d'emails non configuré (RESEND_API_KEY, EMAIL_EXPEDITEUR)" };
  const c = await cibleAnnonce(cle);
  if (c.prix == null) return { envoyes: 0, erreur: "Cette formation n'a pas encore de prix (pages-formation.ts) : elle n'est pas ouverte." };
  const { data } = await db.from("notifications_metier").select("email").eq("metier", cle).is("annonce_envoyee_at", null).limit(1000);
  let envoyes = 0;
  for (const { email } of (data ?? []) as { email: string }[]) {
    const { data: marque } = await db.from("notifications_metier").update({ annonce_envoyee_at: new Date().toISOString() }).eq("email", email).eq("metier", cle).is("annonce_envoyee_at", null).select("email");
    if (!marque?.length) continue;
    const ok = await envoyer(email, "ouverture", {
      formation_titre: c.titre,
      prix: euros(c.prix * 100),
      mention_tva: MENTION_TVA(),
      lien_formation: c.lien,
      lien_desinscription: lienDesinscription(email, `ouverture:${cle}`),
    });
    if (ok) envoyes++;
  }
  return { envoyes };
}
