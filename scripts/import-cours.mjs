// Convertit un fichier « cours » (format du prototype) en étapes génériques,
// et les range dans le module correspondant du fichier formation.json.
// Usage : node scripts/import-cours.mjs <cours.json> <formation.json> <slug-du-module>
import { readFileSync, writeFileSync } from "node:fs";

const [coursPath, formationPath, moduleSlug] = process.argv.slice(2);
if (!coursPath || !formationPath || !moduleSlug) {
  console.error("Usage : node scripts/import-cours.mjs <cours.json> <formation.json> <slug-du-module>");
  process.exit(1);
}
const cours = JSON.parse(readFileSync(coursPath, "utf8"));
const pkg = JSON.parse(readFileSync(formationPath, "utf8"));
const mod = pkg.modules.find((m) => m.slug === moduleSlug);
if (!mod) throw new Error(`Module introuvable : ${moduleSlug}`);

const lessons = cours.modules[0].lecons.map((l, i) => ({
  slug: `lecon-${i + 1}`,
  position: i + 1,
  kind: "lesson",
  title: l.titre,
  status: "published",
  content: {
    objective: l.objectif,
    duration: l.duree,
    screens: l.cartes.map((c) => ({ title: c.titre, html: c.html, showPrompt: Boolean(c.prompt) })),
    prompt: l.prompt ? { title: l.prompt.titre, note: l.prompt.note ?? null, text: l.prompt.texte } : null,
    questions: (l.quiz ?? []).map((q) => ({
      question: q.q,
      options: q.opts,
      answer: q.ok,
      explanation: q.exp,
    })),
    recap: l.retenir,
    next: l.suite ?? null,
    sourcesHtml: l.sources ?? null,
  },
}));

// Les étapes suivantes seront rédigées dans l'éditeur ; on garde leur place dans le plan.
const later = [
  { slug: "exercice", kind: "exercise", title: "Exercice : Nordelia Distribution", content: { duration: "60 min en 5 étapes" } },
  { slug: "auto-correction", kind: "self_review", title: "Auto-correction", content: { duration: "grille sur 20 et corrigé" } },
  { slug: "fin", kind: "module_end", title: "Fin du module", content: { duration: "attestation" } },
].map((s, i) => ({ ...s, position: lessons.length + i + 1, status: "published" }));

mod.steps = [...lessons, ...later];
writeFileSync(formationPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`${mod.steps.length} étapes écrites dans le module « ${mod.title} ».`);
