import { Suspense } from "react";
import { Crumbs } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/admin/guard";
import { EMAILS, type NomEmail } from "@/lib/emails/textes";
import { construireEmail } from "@/lib/emails/gabarit";
import { EXEMPLE } from "@/lib/emails/exemples";
import { emailsActifs } from "@/lib/emails/envois";
import { ENTREPRISE } from "@/lib/vitrine/legal";

// Aperçu de tous les emails automatiques, avec des valeurs d'exemple. Aucun envoi.
const ORDRE: { nom: NomEmail; quand: string }[] = [
  { nom: "plan", quand: "1. Juste après le diagnostic, à toute personne qui laisse son email" },
  { nom: "conseil1Auditeur", quand: "2. Conseil n° 1, 2 jours après (case cochée) · version Auditeur" },
  { nom: "conseil1", quand: "2. Conseil n° 1 · version des autres métiers" },
  { nom: "conseil2Auditeur", quand: "3. Conseil n° 2, 5 jours après · version Auditeur" },
  { nom: "conseil2", quand: "3. Conseil n° 2 · version des autres métiers" },
  { nom: "ouverture", quand: "4. Annonce d'ouverture (bouton dans l'onglet Diagnostics)" },
  { nom: "commande", quand: "5. Confirmation de commande, après chaque achat" },
  { nom: "testeur", quand: "6. Accès offert à un testeur (onglet Accès et achats)" },
  { nom: "compteConfirmation", quand: "7a. Confirmation d'adresse : à coller dans Supabase (Authentication → Emails → Confirm signup)" },
  { nom: "compteCode", quand: "7c. Code de connexion : à coller dans Supabase (Authentication → Emails → Magic Link)" },
  { nom: "compteMotDePasse", quand: "7b. Mot de passe (secours) : à coller dans Supabase (Authentication → Emails → Reset password)" },
];

async function Apercus() {
  await requireAdmin();
  const pied = `Entreprena · ${ENTREPRISE.email || "[adresse de contact à compléter]"}`;
  return (
    <div className="space-y-10">
      <p className="rounded-md border bg-background p-4 text-sm">
        {emailsActifs() ? "L'envoi d'emails est actif sur ce déploiement." : "L'envoi d'emails n'est pas encore actif : aucun email ne part. Il s'activera avec le nom de domaine et la clé du service d'envoi."}
      </p>
      {ORDRE.map(({ nom, quand }) => {
        const supabase = nom.startsWith("compte");
        const e = construireEmail(EMAILS[nom], supabase ? { lien_connexion: "{{ .ConfirmationURL }}", code: "{{ .Token }}" } : EXEMPLE, pied);
        return (
          <section key={nom} className="space-y-3">
            <p className="text-sm text-muted-foreground">{quand}</p>
            <div className="rounded-md border bg-background p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Objet : </span>
                <span className="font-semibold">{e.objet}</span>
              </p>
              <p className="mt-1 text-muted-foreground">Aperçu : {e.apercu}</p>
            </div>
            <iframe title={e.objet} srcDoc={e.html} className="h-[640px] w-full rounded-md border bg-white" sandbox="" />
            {supabase && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Code à copier dans Supabase</summary>
                <textarea readOnly value={e.html} className="mt-2 h-40 w-full rounded-md border bg-background p-2 font-mono text-xs" />
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Emails" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Emails automatiques</h1>
        <p className="text-body text-muted-foreground">Aperçu de chaque email avec des valeurs d&apos;exemple. Les textes se modifient dans src/lib/emails/textes.ts.</p>
      </div>
      <Suspense>
        <Apercus />
      </Suspense>
    </div>
  );
}
