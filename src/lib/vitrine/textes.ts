// Textes de la vitrine (site public). Pour changer une phrase du site, c'est ici.
// Rien n'est propre à un métier : les formations elles-mêmes viennent de la base (ou de content/).
// Règle de ton : on nomme le changement sans exagérer, et on montre aussitôt quoi faire.
// Aucun chiffre sans source vérifiable.

/** Libellé unique du bouton principal de l'accueil et du catalogue. */
export const CTA_FORMATIONS = "Voir les formations";
/** Libellé unique du bouton d'achat, sur toutes les pages de formation. */
export const CTA_ACHAT = "Commencer la formation";

export const accueil = {
  hero: {
    // Trois titres proposés ; le premier est affiché.
    // 2. « L'IA entre dans votre métier. Apprenez à la piloter, dossier par dossier. »
    // 3. « Gardez la main sur votre métier quand l'IA s'y installe. »
    title: "Votre métier change avec l'IA. Voici exactement quoi faire.",
    subtitle:
      "Des formations courtes, par métier, sur des missions réalistes, avec des outils Claude réglés par des experts.",
    // Lien secondaire du haut de page : le diagnostic (« Comment ça marche » reste dans le menu).
    secondary: "Faire le diagnostic (2 min)",
    secondaryHref: "/diagnostic",
  },

  constat: {
    // Ton : un senior de terrain qui briefe un collègue à 18 h 30 devant un dossier. Direct, complice, zéro blabla.
    eyebrow: "Le constat",
    title: "Ce que l'IA change, sans dramatiser.",
    // Chaque chiffre a sa source vérifiable (lien). Ne jamais ajouter de chiffre sans source primaire.
    chiffres: [
      {
        label: "Ce que vous ressentez",
        valeur: 61,
        suffixe: " %",
        texte: "des cadres craignent d'être remplacés, au moins en partie, par l'intelligence artificielle.",
        source: "Baromètre Odoxa, avril 2026",
        url: "https://www.odoxa.fr/sondage/61-des-cadres-craignent-detre-remplaces-par-lia/",
      },
      {
        label: "La réalité du terrain",
        valeur: 77,
        suffixe: " %",
        // Formulation fidèle à l'étude : la question porte sur les Français et sur la formation à l'IA.
        texte: "des Français jugent que les entreprises ne forment pas assez leurs salariés à l'IA.",
        source: "Étude Odoxa, avril 2026",
        url: "https://www.odoxa.fr/sondage/61-des-cadres-craignent-detre-remplaces-par-lia/",
      },
    ],
    commentaire:
      "L'inquiétude est légitime, et largement partagée. Ce qui manque surtout, c'est une formation sérieuse : savoir quoi confier à l'IA, comment la vérifier, et ce qui reste votre valeur ajoutée.",
    transition: "Une partie du travail part vers l'outil. Le reste devient plus important.",
    changeTitle: "Ce qui change dans votre métier",
    changeIntro: "Sur une mission type, l'outil prépare et vous gardez la main sur tout ce qui engage votre responsabilité.",
    reponse:
      "Ceux qui maîtrisent cette bascule ne deviennent pas moins utiles : ils deviennent ceux à qui on confie les dossiers sensibles. C'est exactement ce que nos formations vous font pratiquer, mission après mission.",
  },

  etapes: {
    title: "Comment ça marche",
    eyebrow: "Comment ça marche",
    intro: "Chaque module suit les trois mêmes temps, sur une vraie mission de votre métier.",
    labels: ["La mission", "L'outil", "Vos dossiers"],
    items: [
      {
        title: "Une mission réelle de votre métier",
        text: "Un dossier fictif mais complet, construit avec des professionnels : les mêmes pièces et les mêmes pièges que dans votre quotidien.",
      },
      {
        title: "Un outil d'expert installé dans Claude",
        text: "Le module vous remet un outil prêt à l'emploi : consignes, contrôles et format du livrable. Vous l'installez dans Claude en quelques minutes.",
      },
      {
        title: "Vous le pilotez, puis vous l'appliquez à vos dossiers",
        text: "Vous menez la mission avec l'outil, vous vérifiez ce qu'il produit, puis vous le réglez pour votre propre travail.",
      },
    ],
  },

  produit: {
    // Section des captures flottantes.
    word: "En mission",
    title: "Une session, comme une vraie mission",
    text: "Un message de votre responsable, un outil à installer, des vérifications à chaque étape, et une fiche que vous gardez.",
  },

  formations: {
    title: "Les formations par métier",
    intro: "Un métier à la fois, construit avec des personnes qui l'exercent. D'autres métiers suivront.",
  },

  pourQui: {
    title: "C'est pour vous si…",
    forWhom: [
      "Vous êtes en poste et votre métier commence à changer avec l'IA.",
      "Vous voulez pratiquer sur un cas concret, pas écouter une présentation générale.",
      "Vous pouvez dégager une à deux heures par module, à votre rythme.",
    ],
    notThisTitle: "Ce que ce n'est pas",
    notThis: [
      "Une formation à l'IA en général : chaque formation traite un métier précis.",
      "Un diplôme : l'attestation de fin de formation est adossée à vos livrables et n'a pas de valeur officielle.",
      "Un outil qui travaille à votre place : c'est vous qui vérifiez et qui signez.",
    ],
  },

  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Faut-il savoir coder ou déjà connaître l'IA ?",
        a: "Non. Chaque module part de zéro : vous installez l'outil pas à pas, puis vous l'utilisez sur la mission.",
      },
      {
        q: "De quoi ai-je besoin pour suivre une formation ?",
        a: "Un ordinateur et un compte Claude. [À COMPLÉTER : préciser l'offre Claude nécessaire pour installer les outils.]",
      },
      {
        q: "Mes données clients passent-elles par la plateforme ?",
        a: "Non. Les missions se font sur des dossiers fictifs. Quand vous appliquez l'outil à vos propres dossiers, vous le faites dans votre Claude, en suivant les règles de votre employeur : la formation vous apprend à retirer ce qui identifie un client.",
      },
      {
        q: "Que se passe-t-il si un module n'est pas encore disponible ?",
        a: "Sa date d'ouverture est affichée avant l'achat. Vous accédez tout de suite aux modules disponibles ; les suivants s'ouvrent automatiquement à leur date.",
      },
      {
        q: "L'attestation a-t-elle une valeur officielle ?",
        a: "Non. Elle atteste que vous avez rendu les livrables de la formation. Ce n'est ni un diplôme ni une certification professionnelle.",
      },
    ],
  },

  final: {
    title: "Choisissez votre métier et commencez cette semaine.",
  },
};
