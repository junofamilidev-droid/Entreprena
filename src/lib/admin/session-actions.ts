"use server";

// Écritures des sessions en blocs : import d'un fichier JSON, enregistrement après édition,
// publication et suppression. Chaque écriture repasse par le contrôle du format.

import { updateTag } from "next/cache";
import { requireAdmin } from "./guard";
import type { Result } from "./actions";
import { CONTENT_TAG } from "@/lib/content/source";
import { parseSession } from "@/lib/sessions/validate";
import type { PublicationStatus } from "@/lib/content/types";

type Client = Awaited<ReturnType<typeof requireAdmin>>["client"];

async function findModule(client: Client, formationSlug: string, moduleSlug: string) {
  const { data: f } = await client.from("formations").select("id, title").eq("slug", formationSlug).maybeSingle();
  if (!f) return { error: `Formation « ${formationSlug} » introuvable : vérifiez le champ « formation » (identifiant de la formation).` };
  const { data: m } = await client.from("modules").select("id").eq("formation_id", f.id).eq("slug", moduleSlug).maybeSingle();
  if (!m) return { error: `Module « ${moduleSlug} » introuvable dans « ${f.title} » : créez-le d'abord, ou corrigez le champ « module ».` };
  return { moduleId: m.id as string };
}

/** Importe une session collée. Si la session existe déjà (même module, même numéro), elle est remplacée. */
export async function importSession(json: string, publish: boolean): Promise<Result<{ id: string; replaced: boolean }>> {
  const parsed = parseSession(json);
  if (!parsed.ok) return { ok: false, error: parsed.errors.join("\n") };
  const s = parsed.session;
  const { client } = await requireAdmin();
  const found = await findModule(client, s.formation, s.module);
  if ("error" in found) return { ok: false, error: found.error ?? "" };
  const { data: existing } = await client.from("sessions").select("id").eq("module_id", found.moduleId).eq("number", s.session).maybeSingle();
  const { data, error } = await client
    .from("sessions")
    .upsert(
      {
        module_id: found.moduleId,
        number: s.session,
        title: s.titre,
        duration_min: s.duree_min,
        content: s,
        status: publish ? "published" : "draft",
      },
      { onConflict: "module_id,number" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: `Enregistrement impossible : ${error?.message ?? "erreur inconnue"}.` };
  updateTag(CONTENT_TAG);
  return { ok: true, data: { id: data.id as string, replaced: Boolean(existing) } };
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
