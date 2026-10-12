// Range un exercice guidé (fichier source JSON) dans une étape de formation.json.
// Les blocs « data » qui citent un fichier CSV (`csv`) reçoivent ses colonnes et ses lignes.
// Usage : node scripts/import-exercice.mjs <exercice.json> <formation.json> <slug-du-module> <slug-de-l-etape>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [exercisePath, formationPath, moduleSlug, stepSlug] = process.argv.slice(2);
if (!exercisePath || !formationPath || !moduleSlug || !stepSlug) {
  console.error("Usage : node scripts/import-exercice.mjs <exercice.json> <formation.json> <slug-du-module> <slug-de-l-etape>");
  process.exit(1);
}

const fmt = new Intl.NumberFormat("fr-FR");

function readCsv(file) {
  const lines = readFileSync(file, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
  const rows = lines.map((l) => l.split(";"));
  return { header: rows[0], rows: rows.slice(1) };
}

// Colonnes numériques : alignées à droite, montants affichés avec séparateurs de milliers.
function csvBlock(block, dir) {
  const { csv, ...rest } = block;
  const { header, rows } = readCsv(path.join(dir, csv));
  const numeric = header.map((_, i) => rows.every((r) => r[i] === "" || /^-?\d+(\.\d+)?$/.test(r[i])) && i > 0);
  const labels = { Libelle: "Libellé", "Solde debiteur 2025": "Débit 2025", "Solde crediteur 2025": "Crédit 2025", "Solde debiteur 2024": "Débit 2024", "Solde crediteur 2024": "Crédit 2024" };
  return {
    ...rest,
    columns: header.map((h, i) => ({ label: labels[h] ?? h, ...(numeric[i] ? { align: "right" } : {}) })),
    rows: rows.map((r) => r.map((c, i) => (numeric[i] && c ? fmt.format(Number(c)) : c))),
    copyRows: rows,
  };
}

const exercise = JSON.parse(readFileSync(exercisePath, "utf8"));
const dir = path.dirname(exercisePath);
const expand = (blocks) => blocks.map((b) => (b.type === "data" && b.csv ? csvBlock(b, dir) : b));
exercise.intro.blocks = expand(exercise.intro.blocks);
exercise.parts = exercise.parts.map((p) => ({ ...p, blocks: expand(p.blocks) }));

const pkg = JSON.parse(readFileSync(formationPath, "utf8"));
const mod = pkg.modules.find((m) => m.slug === moduleSlug);
const step = mod?.steps.find((s) => s.slug === stepSlug);
if (!step) throw new Error(`Étape introuvable : ${moduleSlug}/${stepSlug}`);
if (step.kind !== "exercise") throw new Error(`L'étape ${stepSlug} n'est pas un exercice (${step.kind}).`);
step.content = exercise;
writeFileSync(formationPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Exercice écrit dans « ${step.title} » : ${exercise.parts.length} parties.`);
