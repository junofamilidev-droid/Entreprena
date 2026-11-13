import type { Metadata } from "next";
import { site } from "@/lib/site";
import { ENTREPRISE, aCompleter } from "@/lib/vitrine/legal";

export const metadata: Metadata = { title: "Conditions générales de vente", description: `Conditions générales de vente des formations ${site.name}` };

// BROUILLON À FAIRE VALIDER par un professionnel du droit avant toute vente réelle.
// L'article 7 (accès immédiat) est la clause acceptée avec la case des CGV sur la page de paiement.

const E = ENTREPRISE;

const ARTICLES: { titre: string; texte: string[] }[] = [
  {
    titre: "1. Vendeur",
    texte: [
      `Les formations sont vendues par ${aCompleter(E.nom)}, ${aCompleter(E.statut)}, SIRET ${aCompleter(E.siret)}, ${aCompleter(E.adresse)}. Contact : ${aCompleter(E.email)}.`,
    ],
  },
  {
    titre: "2. Objet",
    texte: [
      "Les présentes conditions s'appliquent à l'achat en ligne des formations proposées sur le site : des parcours pratiques en ligne, composés de modules, de dossiers fictifs et d'outils à installer dans Claude (fichiers numériques).",
      "Toute commande vaut acceptation des présentes conditions, que l'acheteur accepte en cochant la case prévue sur la page de paiement.",
    ],
  },
  {
    titre: "3. Prix et paiement",
    texte: [
      `Les prix sont indiqués en euros, toutes taxes comprises. ${E.mentionTva || "[mention de TVA à compléter]"}`,
      "Le paiement s'effectue en une seule fois, en ligne, par carte bancaire ou par les moyens proposés sur la page de paiement sécurisée de notre prestataire Stripe. Aucune donnée bancaire n'est conservée par le vendeur.",
    ],
  },
  {
    titre: "4. Accès à la formation",
    texte: [
      "L'accès est ouvert dès la confirmation du paiement, sur le compte associé à l'adresse email utilisée lors du paiement. Les modules déjà publiés sont accessibles immédiatement ; les modules annoncés comme à venir sont accessibles sans supplément dès leur publication.",
      "L'accès est personnel : il ne peut être ni partagé, ni cédé.",
    ],
  },
  {
    titre: "5. Outils téléchargés",
    texte: [
      "Les outils et fichiers fournis (skills, modèles, référentiels) peuvent être conservés et utilisés par l'acheteur pour son activité professionnelle. Leur revente, leur diffusion ou leur mise à disposition de tiers est interdite.",
      "Leur utilisation suppose un compte Claude, souscrit séparément par l'acheteur auprès de son éditeur.",
    ],
  },
  {
    titre: "6. Certificat",
    texte: ["Un certificat de fin de formation pratique, adossé aux livrables produits, est délivré à l'issue du parcours. La formation est une formation opérationnelle continue, non rattachée au RNCP."],
  },
  {
    titre: "7. Accès immédiat et droit de rétractation",
    texte: [
      "La formation est un contenu numérique fourni sans support matériel. En acceptant les présentes conditions lors du paiement, l'acheteur demande expressément que l'accès à la formation commence immédiatement, avant la fin du délai de rétractation de quatorze jours, et reconnaît qu'il perd ainsi son droit de rétractation dès cet accès, conformément à l'article L221-28, 13°, du Code de la consommation.",
      "Une confirmation de la commande, rappelant cet accord, est adressée à l'acheteur par email.",
    ],
  },
  {
    titre: "8. Responsabilité",
    texte: [
      "La formation enseigne une méthode et fournit des outils d'aide au travail. Les résultats produits avec l'IA doivent toujours être vérifiés par l'utilisateur, qui reste seul responsable de leur usage professionnel et du respect des règles de son employeur, notamment en matière de confidentialité des données.",
    ],
  },
  {
    titre: "9. Données personnelles",
    texte: ["Les données nécessaires à la commande (email, paiement) sont traitées pour l'exécution du contrat. Elles ne sont ni revendues ni partagées. Voir la politique de confidentialité."],
  },
  {
    titre: "10. Réclamations et médiation",
    texte: [
      `Pour toute réclamation : ${aCompleter(E.email)}. En cas de litige non résolu, l'acheteur consommateur peut recourir gratuitement au médiateur de la consommation : ${aCompleter(E.mediateur)}.`,
      "Les présentes conditions sont soumises au droit français.",
    ],
  },
];

export default function CgvPage() {
  return (
    <article className="site-container site-section">
      <h1 className="type-display max-w-[16ch]">Conditions générales de vente</h1>
      <p className="mt-6 type-small text-muted-foreground">Version du [date à compléter].</p>
      <div className="mt-12 grid max-w-[46rem] gap-10">
        {ARTICLES.map((a) => (
          <section key={a.titre}>
            <h2 className="type-h3">{a.titre}</h2>
            {a.texte.map((t) => (
              <p key={t.slice(0, 40)} className="mt-3 type-body text-foreground/80">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
