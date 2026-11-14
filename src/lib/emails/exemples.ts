// Valeurs d'exemple pour l'aperçu des emails dans l'espace réservé (aucun envoi).
import type { Variables } from "./gabarit";

export const EXEMPLE: Variables = {
  metier: "Auditeur",
  niveau: "forte",
  score: "100",
  tache: "Revue analytique",
  tache_ia: "Calculer les variations, isoler celles au-dessus d'un seuil, proposer hypothèses et questions.",
  tache_humain: "Connaître le client ; une hypothèse n'est pas un élément probant.",
  tache_action: "Sur une balance fictive, demandez à l'IA les variations au-dessus de vos seuils, puis recalculez-en deux à la main.",
  cadre_titre: "Votre cadre : la prudence maximale par défaut",
  cadre_texte: "Cette semaine, demandez la règle par écrit à votre responsable. En attendant sa réponse, agissez comme si l'envoi de données clients était interdit : travaillez uniquement sur des données fictives ou anonymisées.",
  intro_plan: "Pour gagner du temps dès cette semaine, ne cherchez pas à tout automatiser : confiez à l'IA la préparation de votre tâche la plus lourde, et gardez le contrôle final.",
  formation_titre: "Auditeur augmenté par l'IA",
  ligne_formation: "Pour aller plus loin : Auditeur augmenté par l'IA",
  lien_formation: "https://exemple/formations/auditeur-augmente-ia",
  lien_plan: "https://exemple/diagnostic/plan/…",
  prix: "79,00 €",
  mention_tva: "TVA non applicable, art. 293 B du CGI",
  numero_commande: "3F9A2C1B",
  date_achat: "14 novembre 2026",
  lien_cgv: "https://exemple/cgv",
  lien_connexion: "https://exemple/app/connexion",
  lien_desinscription: "https://exemple/desinscription?…",
  vendeur: "[nom, statut, adresse, SIRET à compléter]",
};
