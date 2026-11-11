// Textes des pages de formation (/formations/[slug]) propres à la vente : tarif, kit, comparatif, FAQ.
// Le reste (titre, promesse, modules, méthode, « pour qui ») vient du contenu de la formation (espace réservé).
// FICHIER DE TEXTES : modifiable sans toucher au reste du code. Tout est en BROUILLON, à relire.

export type FichierKit = { nom: string; role: string };
export type CommandeKit = { commande: string; role: string };

export type PageFormation = {
  /** Prix de lancement en euros TTC, paiement unique. */
  prix: number;
  inclus: string[];
  /** Le kit téléchargeable (outil Claude) du module ouvert. */
  kit: {
    nom: string;
    module: string;
    intro: string;
    commandes: CommandeKit[];
    fichiers: FichierKit[];
    livrable: string;
  };
  comparatif: { critere: string; seul: string; formation: string }[];
  faq: { q: string; a: string }[];
};

export const PAGES_FORMATION: Record<string, PageFormation> = {
  "auditeur-augmente-ia": {
    prix: 79,
    inclus: [
      "Les 5 modules du parcours : le module 1 dès aujourd'hui, les modules 2 à 5 à leur sortie, sans supplément",
      "Un outil Claude prêt à installer par module, que vous gardez",
      "Un dossier fictif complet (Nordelia) pour vous entraîner sans données clients",
      "Les mises à jour des modules et des outils",
      "Le certificat de fin de formation, adossé à vos livrables",
    ],
    kit: {
      nom: "revue-analytique",
      module: "Module 1 · Revue analytique",
      intro: "Un skill Claude complet, prêt à installer : il fait les calculs, applique un référentiel d'audit et produit le classeur à transmettre au chef de mission.",
      commandes: [
        { commande: "/revue", role: "La revue complète d'une balance N / N-1 avec vos seuils, et le classeur Excel." },
        { commande: "/approfondir", role: "L'analyse détaillée d'un compte retenu, par exemple la balance âgée des clients." },
        { commande: "/integrer", role: "Le report des réponses du client, compte par compte, et les incohérences entre elles." },
        { commande: "/personnaliser", role: "Vos réglages : le modèle de votre cabinet, vos mentions, votre niveau." },
      ],
      fichiers: [
        { nom: "SKILL.md", role: "La méthode en 4 étapes et les garde-fous" },
        { nom: "references/referentiel.md", role: "21 familles de comptes : risque, assertion, procédure, pièce à demander" },
        { nom: "references/profil-modele.md", role: "Les réglages par défaut, à adapter à votre cabinet" },
        { nom: "references/format-annotations.md", role: "Le format des questions et des statuts par compte" },
        { nom: "scripts/revue.py", role: "Les calculs exacts : écarts, seuils, corrélations, classeur" },
      ],
      livrable: "Un classeur Excel en 4 onglets : Synthèse, Comptes retenus, Balance et écarts, Contrôles.",
    },
    comparatif: [
      { critere: "Données clients", seul: "On colle la balance telle quelle, avec le nom du client.", formation: "L'outil refuse tout fichier qui identifie le client." },
      { critere: "Calculs", seul: "L'IA calcule de tête : un écart faux passe inaperçu.", formation: "Chaque chiffre vient d'un script, et vous en recalculez un à la main." },
      { critere: "Méthode", seul: "Une réponse différente à chaque question posée.", formation: "Les deux seuils, le référentiel, les corrélations : toujours la même méthode." },
      { critere: "Livrable", seul: "Un texte à remettre en forme.", formation: "Un classeur prêt à transmettre au chef de mission." },
      { critere: "Responsabilité", seul: "La tentation de recopier la conclusion de l'IA.", formation: "Un compte retenu est une question, jamais une conclusion : vous jugez." },
    ],
    faq: [
      {
        q: "Faut-il un compte Claude ?",
        a: "Oui : les outils de la formation s'installent dans votre compte Claude. La première leçon vous montre comment faire, pas à pas.",
      },
      {
        q: "Puis-je utiliser l'outil sur mes vrais dossiers ?",
        a: "Seulement si votre cabinet l'autorise, et sur des fichiers anonymisés. La formation se fait sur un dossier fictif ; la première leçon traite justement ce que votre cabinet permet.",
      },
      {
        q: "Combien de temps faut-il ?",
        a: "Environ 1 h 30 pour le module 1. Vous avancez à votre rythme, module par module.",
      },
      {
        q: "Que se passe-t-il pour les modules pas encore sortis ?",
        a: "Ils sont compris dans le prix. Vous y accédez dès leur sortie, sans rien payer de plus.",
      },
      {
        q: "Est-ce une formation certifiante ?",
        a: "Non. Le certificat de fin de formation atteste vos livrables, mais n'a pas de valeur officielle : ce n'est ni un diplôme ni une certification professionnelle.",
      },
      {
        q: "Est-ce un abonnement ?",
        a: "Non : un paiement unique. Les outils installés restent à vous.",
      },
    ],
  },
};
