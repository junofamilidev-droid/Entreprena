// Extrait du prototype fourni (prototype-parcours-audit.html), conservé comme référence de test.
/* ---- Données du diagnostic : estimations, non validées par des auditeurs ---- */
var TASKS = [
  {id:1, nom:"Tests de détail", detail:"pointage de pièces, rapprochements, séparation des exercices", type:25,
   ia:"extraire les données de factures, rapprocher pièces et journal, lister les écarts",
   limite:"elle lit mal les scans, les pièces sont des données clients, et un écart manqué ne se voit pas", expo:3, module:3},
  {id:2, nom:"Documentation", detail:"feuilles de travail, notes de synthèse", type:20,
   ia:"structurer des notes brutes, rédiger une conclusion à partir de constats fournis",
   limite:"elle peut écrire des travaux non faits, et un texte plausible masque un vide", expo:5, module:5},
  {id:3, nom:"Revue analytique", detail:"variations N/N-1, ratios", type:10,
   ia:"calculer les variations, isoler celles au-dessus d'un seuil, proposer hypothèses et questions",
   limite:"elle ne connaît pas le client : une hypothèse n'est pas un élément probant", expo:5, module:1},
  {id:4, nom:"Tests sur les écritures comptables", detail:"à partir du FEC", type:5,
   ia:"filtrer sur critères (week-end, montants ronds, opérations diverses de clôture)",
   limite:"la tâche est déjà outillée en cabinet, les fichiers sont gros et les faux positifs nombreux", expo:4, module:2},
  {id:5, nom:"Collecte des documents", detail:"demandes et relances du client", type:10,
   ia:"préparer la liste de pièces, les relances et le tableau de suivi",
   limite:"le gain est réel mais la valeur perçue est faible", expo:2, module:0},
  {id:6, nom:"Circularisation", detail:"confirmations de tiers", type:8,
   ia:"aider à la sélection, aux lettres, au suivi et au rapprochement des réponses",
   limite:"l'auditeur doit garder la maîtrise des envois, et les noms de tiers sont sensibles", expo:3, module:4},
  {id:7, nom:"Prise de connaissance", detail:"et contrôle interne", type:8,
   ia:"transformer des notes d'entretien en description de procédure",
   limite:"les notes sont confidentielles et les risques proposés restent génériques", expo:3, module:0},
  {id:8, nom:"Contrôle des comptes annuels", detail:"et de l'annexe", type:7,
   ia:"cadrer annexe et balance, lister les informations obligatoires",
   limite:"son référentiel n'est pas forcément à jour", expo:3, module:0},
  {id:9, nom:"Recherche technique", detail:"règle comptable, norme", type:4,
   ia:"dégrossir une question, proposer un plan de note",
   limite:"elle peut citer des références inventées ou périmées", expo:2, module:0},
  {id:10, nom:"Inventaire physique", detail:"", type:3,
   ia:"préparer et exploiter la feuille de comptage",
   limite:"la tâche est physique, l'apport est marginal", expo:1, module:0}
];
var MODULES = {1:"Revue analytique", 2:"Tests sur les écritures comptables", 3:"Tests de détail et sondage", 4:"Circularisation", 5:"Synthèse de mission"};

function computeDiag(a) {
  var w = TASKS.map(function (t) { return Number((a.temps || {})[t.id] || 0); });
  var tot = w.reduce(function (s, x) { return s + x; }, 0);
  if (!tot) return null;
  var parts = TASKS.map(function (t, i) {
    return {t: t, share: w[i] / tot, contrib: (w[i] / tot) * t.expo};
  });
  var moy = parts.reduce(function (s, p) { return s + p.contrib; }, 0);
  var score = Math.round(moy / 5 * 100);
  var expo = score >= 70 ? "forte" : score >= 55 ? "marquée" : "modérée";

  var usages = a.usages || [];
  var pts = ({jamais:0, mois:1, semaine:2, jour:3}[a.freq] || 0)
          + ({fait:2, saurais:1, non:0}[a.anonym] || 0)
          + ({echantillon:2, relis:1, telquel:0, pas:0}[a.verif] || 0)
          + (usages.indexOf("audit") >= 0 ? 1 : 0);
  var niveau = pts >= 6 ? "Avancé" : pts >= 3 ? "Intermédiaire" : "Débutant";

  var entree, cible, raison;
  if (a.regle === "interdit") {
    entree = "Module 1, leçon 1"; cible = "lecon-1";
    raison = "Votre cabinet interdit l'IA : la leçon 1 pose les trois questions à régler avant tout usage, et l'exercice ne porte que sur des données fictives.";
  } else if (a.regle === "aucune") {
    entree = "Module 1, leçon 1"; cible = "lecon-1";
    raison = "Vous ne connaissez pas de règle écrite dans votre cabinet : c'est la première question de la routine.";
  } else if (a.anonym === "non") {
    entree = "Module 1, leçon 1"; cible = "lecon-1";
    raison = "Vous n'avez pas encore le geste d'anonymisation : la leçon 1 le montre en quatre étapes.";
  } else if (niveau === "Débutant") {
    entree = "Module 1, leçon 1"; cible = "lecon-1";
    raison = "Vous utilisez peu l'IA au travail : commencez par le début. Les quatre leçons se lisent en 25 minutes environ.";
  } else if (niveau === "Intermédiaire") {
    entree = "Module 1, leçon 2"; cible = "lecon-2";
    raison = "Vous avez déjà le cadre et le geste d'anonymisation. Lisez le « À retenir » de la leçon 1, puis commencez à la leçon 2 : faire calculer, puis contrôler.";
  } else {
    entree = "Module 1, exercice"; cible = "exercice";
    raison = "Vous pratiquez déjà et vous vérifiez sur échantillon. Allez directement à l'exercice Nordelia et gardez les leçons comme référence.";
  }

  var tri = parts.slice().sort(function (x, y) { return y.contrib - x.contrib; });
  var top = tri[0];
  var suite = tri.filter(function (p) { return p.t.module > 1 && p.share > 0; })[0] || null;

  var plan = [];
  plan.push({
    outil: "Relisez la charte IA de votre cabinet et notez quels outils et quelles données elle autorise pour une revue analytique.",
    sansoutil: "Demandez par écrit à votre chef de mission quel outil utiliser, et avec quelles données.",
    interdit: "Gardez l'IA hors de tout dossier client. Avant l'exercice sur données fictives, vérifiez que votre charte n'interdit pas l'usage d'un outil personnel.",
    aucune: "Cette semaine, demandez par écrit à votre chef de mission la règle du cabinet sur l'IA."
  }[a.regle] || "Vérifiez la règle de votre cabinet sur l'IA.");
  plan.push("Faites le module 1 à partir de ce point d'entrée (" + entree.replace("Module 1, ", "") + "). Prévoyez 60 minutes pour l'exercice.");
  var p3 = "Sur votre tâche la plus exposée, « " + top.t.nom + " » (" + Math.round(top.share * 100) + " % de votre temps) : une IA sait aujourd'hui "
         + top.t.ia + ". Limite à garder en tête : " + top.t.limite + ". ";
  p3 += top.t.module === 1 ? "C'est la tâche du module 1."
      : top.t.module ? "Elle est traitée au module " + top.t.module + " (à venir)."
      : "Elle n'a pas de module dédié dans ce parcours.";
  plan.push(p3);

  return {score: score, expo: expo, parts: tri, pts: pts, niveau: niveau, entree: entree, cible: cible, raison: raison, suite: suite, plan: plan};
}
if (typeof module !== "undefined") module.exports = {computeDiag: computeDiag, TASKS: TASKS};
