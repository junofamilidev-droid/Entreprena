"use server";

// Écritures de l'espace réservé. Chaque action vérifie le compte administrateur, écrit avec la
// session de l'administrateur (les règles d'accès de la base s'appliquent), puis rafraîchit le
// contenu affiché sur le site.

import { updateTag } from "next/cache";
import { requireAdmin } from "./guard";
import { CONTENT_TAG, readLocalPackages } from "@/lib/content/source";
import type { PublicationStatus, StepKind } from "@/lib/content/types";

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

type Table = "formations" | "modules" | "steps" | "diagnostics";

function message(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "Cet identifiant est déjà utilisé à ce niveau : choisissez-en un autre.";
  if (error.code === "23514") return "Une valeur n'a pas le bon format (identifiant : minuscules, chiffres et tirets).";
  if (error.code === "42501") return "Action refusée : ce compte n'est pas administrateur.";
  return `Enregistrement impossible : ${error.message ?? "erreur inconnue"}.`;
}

async function write<T>(run: (client: Awaited<ReturnType<typeof requireAdmin>>["client"]) => PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>): Promise<Result<T>> {
  const { client } = await requireAdmin();
  const { data, error } = await run(client);
  if (error) return { ok: false, error: message(error) };
  updateTag(CONTENT_TAG);
  return { ok: true, data: data ?? undefined };
}

/* ---------------- Mises à jour génériques ---------------- */

const EDITABLE: Record<Table, string[]> = {
  formations: ["slug", "title", "domain", "audience", "promise", "summary", "for_whom", "not_this", "method", "tutor_url", "presale", "status", "position"],
  modules: ["slug", "title", "summary", "deliverable", "duration_label", "availability", "status", "position"],
  steps: ["slug", "title", "kind", "content", "status", "position"],
  diagnostics: ["config", "status"],
};

export async function updateRow(table: Table, id: string, values: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(values).filter(([k]) => EDITABLE[table].includes(k)));
  return write((c) => c.from(table).update(clean).eq("id", id).select("id").single());
}

export async function setStatus(table: Table, id: string, status: PublicationStatus) {
  return updateRow(table, id, { status });
}

export async function deleteRow(table: Exclude<Table, "diagnostics">, id: string) {
  return write((c) => c.from(table).delete().eq("id", id).select("id"));
}

/** Échange la place d'un module ou d'une étape avec son voisin. */
export async function move(table: "modules" | "steps", id: string, direction: -1 | 1) {
  const { client } = await requireAdmin();
  const parent = table === "modules" ? "formation_id" : "module_id";
  const { data: row } = await client.from(table).select(`id, position, ${parent}`).eq("id", id).single();
  if (!row) return { ok: false, error: "Élément introuvable." } satisfies Result;
  const r = row as unknown as Record<string, string | number>;
  const { data: siblings } = await client.from(table).select("id, position").eq(parent, r[parent] as string).order("position");
  const list = (siblings ?? []) as { id: string; position: number }[];
  const i = list.findIndex((s) => s.id === id);
  const j = i + direction;
  if (j < 0 || j >= list.length) return { ok: true } satisfies Result;
  // Renumérotation complète : les positions restent 1, 2, 3… même après des suppressions.
  [list[i], list[j]] = [list[j], list[i]];
  for (const [k, s] of list.entries()) {
    const { error } = await client.from(table).update({ position: k + 1 }).eq("id", s.id);
    if (error) return { ok: false, error: message(error) } satisfies Result;
  }
  updateTag(CONTENT_TAG);
  return { ok: true } satisfies Result;
}

/* ---------------- Créations ---------------- */

async function nextPosition(table: "formations" | "modules" | "steps", parent?: [string, string]) {
  const { client } = await requireAdmin();
  let q = client.from(table).select("position").order("position", { ascending: false }).limit(1);
  if (parent) q = q.eq(parent[0], parent[1]);
  const { data } = await q;
  return ((data?.[0]?.position as number | undefined) ?? 0) + 1;
}

export async function createFormation(title: string) {
  const position = await nextPosition("formations");
  return write<{ id: string }>((c) =>
    c.from("formations").insert({ title, slug: slugifySync(title), position, status: "draft" }).select("id").single(),
  );
}

export async function createModule(formationId: string, title: string) {
  const position = await nextPosition("modules", ["formation_id", formationId]);
  return write<{ id: string }>((c) =>
    c
      .from("modules")
      .insert({ formation_id: formationId, title, slug: slugifySync(title), position, status: "draft", availability: "coming_soon" })
      .select("id")
      .single(),
  );
}

const EMPTY_CONTENT: Record<StepKind, unknown> = {
  lesson: { objective: "", duration: "", screens: [{ title: "Premier écran", html: "<p></p>" }], prompt: null, questions: [], recap: "", next: null, sourcesHtml: null },
  quiz: { questions: [] },
  exercise: { duration: "", intro: { title: "", blocks: [] }, parts: [] },
  self_review: { exerciseStep: "", title: "Auto-correction", intro: "", total: 20, passMark: 14, criteria: [], eliminatory: { title: "Critères éliminatoires", items: [] } },
  module_end: { reviewStep: "", title: "Bilan du module", template: "{nom} a validé ce module le {date}, avec la note de {note} sur 20.", notice: "", retry: "" },
};

export async function createStep(moduleId: string, title: string, kind: StepKind) {
  const position = await nextPosition("steps", ["module_id", moduleId]);
  return write<{ id: string }>((c) =>
    c
      .from("steps")
      .insert({ module_id: moduleId, title, kind, slug: slugifySync(title), position, status: "draft", content: EMPTY_CONTENT[kind] })
      .select("id")
      .single(),
  );
}

export async function saveDiagnostic(formationId: string, config: unknown, status: PublicationStatus) {
  return write((c) => c.from("diagnostics").upsert({ formation_id: formationId, config, status }, { onConflict: "formation_id" }).select("id").single());
}

function slugifySync(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sans-titre"
  );
}

/* ---------------- Import des fichiers ---------------- */

/**
 * Copie le contenu des fichiers (dossier content/) dans la base. Les éléments sont reconnus par
 * leur identifiant (slug) : ceux qui existent déjà sont remplacés par la version des fichiers,
 * les autres sont créés. Rien n'est supprimé de la base.
 */
export async function importFromFiles(): Promise<Result<{ formations: number; modules: number; steps: number }>> {
  const { client } = await requireAdmin();
  const packages = await readLocalPackages();
  let modules = 0;
  let steps = 0;
  for (const p of packages) {
    const f = p.formation;
    const { data: fRow, error: fErr } = await client
      .from("formations")
      .upsert(
        {
          slug: f.slug,
          title: f.title,
          domain: f.domain,
          audience: f.audience,
          promise: f.promise,
          summary: f.summary,
          for_whom: f.forWhom,
          not_this: f.notThis,
          method: f.method,
          tutor_url: f.tutorUrl,
          presale: f.presale,
          status: f.status,
          position: f.position,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (fErr || !fRow) return { ok: false, error: message(fErr ?? {}) };
    for (const m of p.modules) {
      const { data: mRow, error: mErr } = await client
        .from("modules")
        .upsert(
          {
            formation_id: fRow.id,
            slug: m.slug,
            position: m.position,
            title: m.title,
            summary: m.summary,
            deliverable: m.deliverable,
            duration_label: m.durationLabel,
            availability: m.availability,
            status: m.status,
          },
          { onConflict: "formation_id,slug" },
        )
        .select("id")
        .single();
      if (mErr || !mRow) return { ok: false, error: message(mErr ?? {}) };
      modules++;
      const rows = (m.steps ?? []).map((s) => ({
        module_id: mRow.id,
        slug: s.slug,
        position: s.position,
        kind: s.kind,
        title: s.title,
        content: s.content,
        status: s.status,
      }));
      if (rows.length) {
        const { error } = await client.from("steps").upsert(rows, { onConflict: "module_id,slug" });
        if (error) return { ok: false, error: message(error) };
        steps += rows.length;
      }
    }
    if (p.diagnostic) {
      const { error } = await client
        .from("diagnostics")
        .upsert({ formation_id: fRow.id, config: p.diagnostic.config, status: p.diagnostic.status }, { onConflict: "formation_id" });
      if (error) return { ok: false, error: message(error) };
    }
  }
  updateTag(CONTENT_TAG);
  return { ok: true, data: { formations: packages.length, modules, steps } };
}
