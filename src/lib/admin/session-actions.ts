"use server";

// Écritures des sessions en blocs : import d'un fichier JSON, enregistrement après édition,
// publication et suppression. Chaque écriture repasse par le contrôle du format.

import { updateTag } from "next/cache";
import { requireAdmin } from "./guard";
import type { Result } from "./actions";
import { CONTENT_TAG } from "@/lib/content/source";
import { parseSession } from "@/lib/sessions/validate";
import { parseFormationFile } from "@/lib/sessions/formation-format";
import type { Session } from "@/lib/sessions/types";
import type { PublicationStatus } from "@/lib/content/types";

type Client = Awaited<ReturnType<typeof requireAdmin>>["client"];

async function findModule(client: Client, formationSlug: string, moduleSlug: string) {
  const { data: f } = await client.from("formations").select("id, title").eq("slug", formationSlug).maybeSingle();
  if (!f) return { error: `Formation « ${formationSlug} » introuvable : vérifiez le champ « formation » (identifiant de la formation).` };
  const { data: m } = await client.from("modules").select("id").eq("formation_id", f.id).eq("slug", moduleSlug).maybeSingle();
  if (!m) return { error: `Module « ${moduleSlug} » introuvable dans « ${f.title} » : créez-le d'abord, ou corrigez le champ « module ».` };
  return { moduleId: m.id as string };
}

async function upsertSession(client: Client, moduleId: string, s: Session, publish: boolean) {
  const { data: existing } = await client.from("sessions").select("id").eq("module_id", moduleId).eq("number", s.session).maybeSingle();
  const { data, error } = await client
    .from("sessions")
    .upsert(
      { module_id: moduleId, number: s.session, title: s.titre, duration_min: s.duree_min, content: s, status: publish ? "published" : "draft" },
      { onConflict: "module_id,number" },
    )
    .select("id")
    .single();
  return { id: data?.id as string | undefined, replaced: Boolean(existing), error };
}

/** Importe une session collée. Si la session existe déjà (même module, même numéro), elle est remplacée. */
export async function importSession(json: string, publish: boolean): Promise<Result<{ id: string; replaced: boolean }>> {
  const parsed = parseSession(json);
  if (!parsed.ok) return { ok: false, error: parsed.errors.join("\n") };
  const s = parsed.session;
  const { client } = await requireAdmin();
  const found = await findModule(client, s.formation, s.module);
  if ("error" in found) return { ok: false, error: found.error ?? "" };
  const up = await upsertSession(client, found.moduleId, s, publish);
  if (up.error || !up.id) return { ok: false, error: `Enregistrement impossible : ${up.error?.message ?? "erreur inconnue"}.` };
  updateTag(CONTENT_TAG);
  return { ok: true, data: { id: up.id, replaced: up.replaced } };
}

/**
 * Importe une formation complète : sa fiche, ses modules (dans l'ordre du fichier) et ses sessions.
 * Formation et modules sont reconnus par leur identifiant : ceux qui existent sont mis à jour,
 * les autres créés. Rien n'est supprimé (un module absent du fichier reste en place).
 */
export async function importFormation(
  json: string,
  publish: boolean,
): Promise<Result<{ id: string; created: boolean; modules: number; sessions: number; untouched: string[] }>> {
  const parsed = parseFormationFile(json);
  if (!parsed.ok) return { ok: false, error: parsed.errors.join("\n") };
  const { formation: f, modules, sessions } = parsed.file;
  const { client } = await requireAdmin();
  const status = publish ? "published" : "draft";

  const { data: existing } = await client.from("formations").select("id, position").eq("slug", f.identifiant).maybeSingle();
  const { data: last } = await client.from("formations").select("position").order("position", { ascending: false }).limit(1);
  const values = {
    slug: f.identifiant,
    title: f.titre,
    domain: f.domaine,
    audience: f.public,
    promise: f.promesse,
    summary: f.resume,
    for_whom: f.pour_qui,
    not_this: f.ce_que_ce_n_est_pas,
    status,
    position: (existing?.position as number | undefined) ?? ((last?.[0]?.position as number | undefined) ?? 0) + 1,
  };
  const { data: row, error } = await client.from("formations").upsert(values, { onConflict: "slug" }).select("id").single();
  if (error || !row) return { ok: false, error: `Enregistrement de la formation impossible : ${error?.message ?? "erreur inconnue"}.` };

  const moduleIds = new Map<string, string>();
  for (const [i, m] of modules.entries()) {
    const { data: mRow, error: mErr } = await client
      .from("modules")
      .upsert(
        {
          formation_id: row.id,
          slug: m.identifiant,
          position: i + 1,
          title: m.titre,
          summary: m.resume,
          deliverable: m.livrable,
          availability: m.ouvert ? "open" : "coming_soon",
          status,
        },
        { onConflict: "formation_id,slug" },
      )
      .select("id")
      .single();
    if (mErr || !mRow) return { ok: false, error: `Module « ${m.identifiant} » : enregistrement impossible (${mErr?.message ?? "erreur inconnue"}).` };
    moduleIds.set(m.identifiant, mRow.id as string);
  }

  for (const s of sessions) {
    const up = await upsertSession(client, moduleIds.get(s.module)!, s, publish);
    if (up.error) return { ok: false, error: `Session ${s.session} du module « ${s.module} » : enregistrement impossible (${up.error.message}).` };
  }

  const { data: all } = await client.from("modules").select("slug").eq("formation_id", row.id);
  const untouched = (all ?? []).map((m) => m.slug as string).filter((s) => !moduleIds.has(s));
  updateTag(CONTENT_TAG);
  return { ok: true, data: { id: row.id as string, created: !existing, modules: modules.length, sessions: sessions.length, untouched } };
}

/** Enregistre une session modifiée dans l'éditeur (le format est vérifié avant). */
export async function saveSession(id: string, content: unknown): Promise<Result> {
  const parsed = parseSession(content);
  if (!parsed.ok) return { ok: false, error: parsed.errors.join("\n") };
  const s = parsed.session;
  const { client } = await requireAdmin();
  const { data: row } = await client.from("sessions").select("module_id, number").eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "Session introuvable." };
  const found = await findModule(client, s.formation, s.module);
  if ("error" in found) return { ok: false, error: found.error ?? "" };
  if (found.moduleId !== row.module_id || s.session !== row.number) {
    const { data: clash } = await client.from("sessions").select("id").eq("module_id", found.moduleId).eq("number", s.session).neq("id", id).maybeSingle();
    if (clash) return { ok: false, error: `Une session ${s.session} existe déjà dans ce module : changez de numéro.` };
  }
  const { error } = await client
    .from("sessions")
    .update({ module_id: found.moduleId, number: s.session, title: s.titre, duration_min: s.duree_min, content: s })
    .eq("id", id);
  if (error) return { ok: false, error: `Enregistrement impossible : ${error.message}.` };
  updateTag(CONTENT_TAG);
  return { ok: true };
}

export async function setSessionStatus(id: string, status: PublicationStatus): Promise<Result> {
  const { client } = await requireAdmin();
  const { error } = await client.from("sessions").update({ status }).eq("id", id);
  if (error) return { ok: false, error: `Modification impossible : ${error.message}.` };
  updateTag(CONTENT_TAG);
  return { ok: true };
}

export async function deleteSession(id: string): Promise<Result> {
  const { client } = await requireAdmin();
  const { error } = await client.from("sessions").delete().eq("id", id);
  if (error) return { ok: false, error: `Suppression impossible : ${error.message}.` };
  updateTag(CONTENT_TAG);
  return { ok: true };
}
