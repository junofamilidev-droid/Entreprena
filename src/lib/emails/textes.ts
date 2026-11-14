// Textes des emails automatiques (v1, 14 novembre 2026). FICHIER DE TEXTES : modifiable sans toucher au code.
// - {{variable}} : remplacée à l'envoi (voir la liste dans gabarit.ts). Une variable inconnue bloque l'envoi.
// - Blocs : « p » (paragraphe), « titre », « liste », « bouton » (un seul par email), « discret » (petite ligne),
//   « raison » (pourquoi la personne reçoit cet email, avec le lien de désinscription).
// À compléter au lancement : adresse de contact (pied de page) et identité du vendeur (src/lib/vitrine/legal.ts).

export type Bloc =
  | { p: string }
  | { titre: string }
  | { liste: string[] }
  | { bouton: string; lien: string }
  | { discret: string; lien?: string }
  | { raison: string };

export type ModeleEmail = { objet: string; apercu: string; blocs: Bloc[] };

const BONJOUR: Bloc = { p: "Bonjour," };
const RAISON_CONSEILS: Bloc = {
  raison: "Vous recevez cet email parce que vous avez accepté deux conseils sur votre métier lors de votre diagnostic.",
};

export const EMAILS = {
  /** 1. Après le diagnostic, à toute personne qui a laissé son email. */
  plan: {
    objet: "Votre plan d'action : {{metier}} et l'IA",
    apercu: "Exposition {{niveau}} ({{score}}/100) et une action concrète à tester.",
    blocs: [
      BONJOUR,
      { p: "Vous avez demandé votre plan d'action sur le site d'Entreprena. Le voici." },
      { p: "{{intro_plan}}" },
      { titre: "Votre résultat : exposition {{niveau}} ({{score}}/100)" },
      { titre: "{{cadre_titre}}" },
      { p: "{{cadre_texte}}" },
      { titre: "La tâche la plus exposée : {{tache}}" },
      { liste: ["Ce que l'IA sait faire : {{tache_ia}}", "Ce qui reste sous votre responsabilité : {{tache_humain}}", "À tester cette semaine : {{tache_action}}"] },
      { bouton: "Revoir mon plan", lien: "{{lien_plan}}" },
      { discret: "{{ligne_formation}}", lien: "{{lien_formation}}" },
      { raison: "Vous recevez cet email parce que vous avez demandé votre plan d'action sur notre site." },
    ],
  },

  /** 2. Conseil n° 1, 2 jours après (case des conseils cochée). Version Auditeur. */
  conseil1Auditeur: {
    objet: "Revue analytique : le réflexe à prendre avec l'IA",
    apercu: "Faites calculer, ne laissez pas deviner.",
    blocs: [
      BONJOUR,
      { p: "Voici le premier conseil promis." },
      { p: "Quand vous confiez une balance à une IA, demandez-lui de calculer les écarts par un script, jamais « de tête ». C'est là que naissent les erreurs, en particulier sur les pourcentages au-delà de 100 %." },
      { p: "Recalculez ensuite vous-même deux écarts pris au hasard. S'ils sont justes, vous pouvez travailler sur le reste." },
      { p: "Enfin, demandez à l'IA des questions pour le client, pas des explications : le jugement reste le vôtre." },
      { bouton: "Revoir mon plan d'action", lien: "{{lien_plan}}" },
      RAISON_CONSEILS,
    ],
  },
  /** 2. Conseil n° 1, version générique (tous les autres métiers). */
  conseil1: {
    objet: "{{tache}} : par où commencer avec l'IA",
    apercu: "Commencez petit, sur un cas sans risque.",
    blocs: [
      BONJOUR,
      { p: "Voici le premier conseil promis, sur {{tache}}." },
      { p: "Ne commencez pas par un vrai dossier. Faites l'essai sur un exemple sans enjeu et sans donnée confidentielle : {{tache_action}}" },
      { p: "Comparez ensuite le résultat à ce que vous auriez produit seul. Notez ce qui est juste, ce qui manque et ce que vous avez dû vérifier." },
      { p: "Si l'essai est concluant, gardez votre consigne : c'est le début de votre méthode." },
      { bouton: "Revoir mon plan d'action", lien: "{{lien_plan}}" },
      RAISON_CONSEILS,
    ],
  },

  /** 3. Conseil n° 2, 5 jours après. Version Auditeur (formation disponible). */
  conseil2Auditeur: {
    objet: "Revue analytique : deux seuils valent mieux qu'un",
    apercu: "Le réglage qui évite de se noyer dans les écarts.",
    blocs: [
      BONJOUR,
      { p: "Voici le deuxième et dernier conseil." },
      { p: "Ne retenez un compte que s'il dépasse deux seuils à la fois : un montant et un pourcentage. Avec le seul seuil en euros, les ventes et les achats, qui suivent simplement l'activité, noient les vrais sujets." },
      { p: "Surveillez aussi les comptes partis de zéro : leur écart en pourcentage ne se calcule pas, et ils passent souvent inaperçus." },
      { p: "Ces réglages sont au cœur de {{formation_titre}}. Vous y construisez dans Claude votre propre outil de revue analytique, sur un cas fictif, puis vous l'adaptez à votre cabinet." },
      { bouton: "Découvrir la formation", lien: "{{lien_formation}}" },
      RAISON_CONSEILS,
    ],
  },
  /** 3. Conseil n° 2, version générique (formation en préparation). */
  conseil2: {
    objet: "{{tache}} : passer de l'essai à la méthode",
    apercu: "Une consigne réutilisable vaut mieux que dix essais.",
    blocs: [
      BONJOUR,
      { p: "Voici le deuxième et dernier conseil." },
      { p: "Quand un essai est concluant, transformez-le en méthode. Écrivez votre consigne une fois pour toutes, avec vos règles : le format attendu, les vérifications, ce que l'IA ne doit jamais faire. Puis réutilisez-la à chaque fois." },
      { p: "Vous gagnez en régularité, et vous savez exactement quoi vérifier." },
      { p: "Nous préparons une formation pour votre métier sur ce principe : chaque session vous fait repartir avec un outil prêt à l'emploi." },
      { bouton: "Être prévenu de l'ouverture", lien: "{{lien_formation}}" },
      RAISON_CONSEILS,
    ],
  },

  /** 4. Ouverture d'une formation, aux inscrits « Être prévenu ». Une seule fois. */
  ouverture: {
    objet: "{{formation_titre}} est ouverte",
    apercu: "Vous aviez demandé à être prévenu : c'est maintenant.",
    blocs: [
      BONJOUR,
      { p: "Vous aviez demandé à être prévenu : {{formation_titre}} est ouverte." },
      { p: "Chaque session porte sur une tâche réelle de votre métier. Vous y construisez, dans Claude, un outil que vous gardez et adaptez à votre pratique." },
      {
        liste: [
          "Prix : {{prix}} ({{mention_tva}})",
          "Accès immédiat après l'achat",
          "Certificat de fin de formation pratique, adossé aux livrables",
          "Prérequis : un compte Claude (détails sur la page de la formation)",
        ],
      },
      { bouton: "Découvrir la formation", lien: "{{lien_formation}}" },
      { raison: "Vous recevez cet email parce que vous vous êtes inscrit pour être prévenu de l'ouverture de cette formation. Il ne sera envoyé qu'une fois." },
    ],
  },

  /** 5. Confirmation de commande (vaut confirmation sur support durable). */
  commande: {
    objet: "Confirmation de votre commande n° {{numero_commande}}",
    apercu: "Votre accès est ouvert. Récapitulatif et informations légales.",
    blocs: [
      BONJOUR,
      { p: "Merci pour votre commande. Votre accès à la formation est ouvert dès maintenant." },
      { titre: "Récapitulatif" },
      { liste: ["Formation : {{formation_titre}}", "Prix : {{prix}} — {{mention_tva}}", "Date : {{date_achat}}", "Commande n° {{numero_commande}}"] },
      { titre: "Accès immédiat et droit de rétractation" },
      {
        p: "Lors de votre achat, vous avez demandé à accéder immédiatement à la formation et reconnu perdre ainsi votre droit de rétractation (article L221-28 du Code de la consommation). Cet email vous confirme cet accord.",
      },
      { discret: "Conditions générales de vente", lien: "{{lien_cgv}}" },
      { bouton: "Accéder à ma formation", lien: "{{lien_connexion}}" },
      { p: "Pour vous reconnecter plus tard : sur la page de connexion, cliquez sur « Mot de passe oublié » et indiquez cette adresse email. Vous recevrez un lien pour créer votre mot de passe." },
      { discret: "Vendeur : {{vendeur}}" },
    ],
  },

  /** 6. Accès offert à un testeur (envoyé depuis l'espace réservé). */
  testeur: {
    objet: "Votre accès à {{formation_titre}}",
    apercu: "Votre accès est offert. Votre avis nous sera précieux.",
    blocs: [
      BONJOUR,
      { p: "Merci d'avoir accepté de tester {{formation_titre}}. Votre accès est offert." },
      { p: "Ce que nous vous demandons :" },
      {
        liste: [
          "Faire la session 1 (environ 30 minutes).",
          "Répondre à cet email avec trois réponses courtes : l'outil vous servirait-il sur un vrai dossier, et pourquoi ? Qu'avez-vous trouvé inutile, confus ou faux ? Le recommanderiez-vous à un collègue, sur une note de 0 à 10 ?",
        ],
      },
      { bouton: "Accéder à la formation", lien: "{{lien_connexion}}" },
      { discret: "Ce lien ne fonctionne qu'une fois. Ensuite, utilisez « Mot de passe oublié » sur la page de connexion." },
    ],
  },

  /** 7a. Confirmation d'adresse (envoyé par Supabase : à coller dans Supabase, lien {{ .ConfirmationURL }}). */
  compteConfirmation: {
    objet: "Confirmez votre adresse email",
    apercu: "Un clic pour activer votre compte Entreprena.",
    blocs: [
      BONJOUR,
      { p: "Pour activer votre compte Entreprena, confirmez votre adresse email." },
      { bouton: "Confirmer mon adresse", lien: "{{lien_connexion}}" },
      { discret: "Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email : aucun compte ne sera activé." },
    ],
  },
  /** 7b. Réinitialisation du mot de passe (envoyé par Supabase, même principe). */
  compteMotDePasse: {
    objet: "Choisissez votre mot de passe",
    apercu: "Ce lien n'est valable qu'une fois.",
    blocs: [
      BONJOUR,
      { p: "Vous avez demandé à créer ou à réinitialiser votre mot de passe Entreprena." },
      { bouton: "Choisir mon mot de passe", lien: "{{lien_connexion}}" },
      { discret: "Ce lien n'est valable qu'une fois, et pour une durée limitée. Si vous n'avez rien demandé, ignorez cet email : votre mot de passe reste inchangé." },
    ],
  },
} satisfies Record<string, ModeleEmail>;

export type NomEmail = keyof typeof EMAILS;
