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
      "Des formations courtes, par métier, sur des missions réalistes. Vous repartez avec des outils Claude réglés par des experts, et vous savez les appliquer à vos propres dossiers.",
    secondary: "Comment ça marche",
  },

  constat: {
    title: "L'IA fait déjà une partie du travail. Pas celle qui compte le plus.",
    text: [
      "L'IA produit déjà en quelques minutes une partie du travail qui prenait des heures : trier, calculer, rédiger un premier jet.",
      "Ce qu'elle ne fait pas seule : juger, vérifier, engager sa responsabilité. C'est là que votre métier se déplace, et c'est là que votre valeur se joue.",
    ],
    answerTitle: "Ce que vous pouvez faire dès maintenant",
    answer: [
      "Savoir quelles tâches confier à l'IA, et lesquelles garder.",
      "Travailler avec des outils réglés pour votre métier, plutôt qu'avec un assistant généraliste.",
      "Vérifier ce que l'IA produit, avec une méthode que vous pouvez défendre devant un relecteur.",
    ],
  },

  etapes: {
    title: "Comment ça marche",
    intro: "Chaque module suit les trois mêmes temps.",
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
    title: "Pour qui",
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
