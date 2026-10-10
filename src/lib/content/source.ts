import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hasSupabase } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  Diagnostic,
  DiagnosticConfig,
  Formation,
  FormationWithModules,
  Module,
} from "./types";

// Point d'accès unique au contenu.
// - Avec Supabase configuré : tout est lu dans la base de données.
// - Sans Supabase (aperçu en local uniquement) : lecture des fichiers d'import du dossier content/.

/* ---------------- Base de données ---------------- */

type Row = Record<string, unknown>;

function mapFormation(r: Row): Formation {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    domain: r.domain as string,
    audience: r.audience as string,
    promise: r.promise as string,
    summary: r.summary as string,
    forWhom: (r.for_whom as string[]) ?? [],
    notThis: (r.not_this as string[]) ?? [],
    method: (r.method as Formation["method"]) ?? [],
    tutorUrl: (r.tutor_url as string | null) ?? null,
    presale: r.presale as Formation["presale"],
    status: r.status as Formation["status"],
    position: r.position as number,
  };
}

function mapModule(r: Row): Module {
  return {
    id: r.id as string,
    formationId: r.formation_id as string,
    slug: r.slug as string,
    position: r.position as number,
    title: r.title as string,
    summary: r.summary as string,
    deliverable: r.deliverable as string,
    durationLabel: (r.duration_label as string | null) ?? null,
    availability: r.availability as Module["availability"],
    status: r.status as Module["status"],
  };
}

function withModules(r: Row): FormationWithModules {
  const modules = ((r.modules as Row[]) ?? []).map(mapModule).sort((a, b) => a.position - b.position);
  const diags = (r.diagnostics as Row[] | Row | null) ?? [];
  return {
    ...mapFormation(r),
    modules,
    hasDiagnostic: Array.isArray(diags) ? diags.length > 0 : Boolean(diags),
  };
}

const SELECT_FORMATION = "*, modules(*), diagnostics(id)";

async function dbListFormations() {
  const { data, error } = await createPublicClient()
    .from("formations")
    .select(SELECT_FORMATION)
    .order("position");
  if (error) throw error;
  return (data ?? []).map(withModules);
}

async function dbGetFormation(slug: string) {
  const { data, error } = await createPublicClient()
    .from("formations")
    .select(SELECT_FORMATION)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? withModules(data) : null;
}

async function dbGetDiagnostic(formationId: string): Promise<Diagnostic | null> {
  const { data, error } = await createPublicClient()
    .from("diagnostics")
    .select("*")
    .eq("formation_id", formationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    formationId: data.formation_id,
    config: data.config as DiagnosticConfig,
    status: data.status,
  };
}

/* ---------------- Fichiers d'import (aperçu local) ---------------- */

export interface ContentPackage {
  formation: Omit<Formation, "id">;
  modules: Omit<Module, "id" | "formationId">[];
  diagnostic?: { status: Diagnostic["status"]; config: DiagnosticConfig };
}

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readLocalPackages() {
  const dirs = await readdir(CONTENT_DIR, { withFileTypes: true });
  const packages: ContentPackage[] = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    try {
      const raw = await readFile(path.join(CONTENT_DIR, d.name, "formation.json"), "utf8");
      packages.push(JSON.parse(raw));
    } catch {
      // Dossier sans formation.json : ignoré.
    }
  }
  return packages;
}

function localFormation(p: ContentPackage): FormationWithModules {
  const id = `local-${p.formation.slug}`;
  return {
    ...p.formation,
    id,
    hasDiagnostic: Boolean(p.diagnostic),
    modules: p.modules
      .map((m) => ({ ...m, id: `${id}-${m.slug}`, formationId: id }))
      .sort((a, b) => a.position - b.position),
  };
}

/* ---------------- API publique ---------------- */
// Les lectures sont mises en cache (étiquette « content ») et rafraîchies toutes les heures,
// ou immédiatement quand l'espace réservé publie une modification.

export const CONTENT_TAG = "content";

function assertSource() {
  if (!hasSupabase && process.env.VERCEL) {
    throw new Error("Supabase n'est pas configuré : ajoutez les variables d'environnement dans Vercel.");
  }
}

export async function listFormations(): Promise<FormationWithModules[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  assertSource();
  if (hasSupabase) return dbListFormations();
  const all = (await readLocalPackages()).map(localFormation);
  return all.filter((f) => f.status === "published").sort((a, b) => a.position - b.position);
}

export async function getFormation(slug: string): Promise<FormationWithModules | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  assertSource();
  if (hasSupabase) return dbGetFormation(slug);
  const p = (await readLocalPackages()).find((x) => x.formation.slug === slug);
  return p && p.formation.status === "published" ? localFormation(p) : null;
}

export async function getDiagnostic(formationSlug: string): Promise<Diagnostic | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const formation = await getFormation(formationSlug);
  if (!formation) return null;
  if (hasSupabase) return dbGetDiagnostic(formation.id);
  const p = (await readLocalPackages()).find((x) => x.formation.slug === formationSlug);
  if (!p?.diagnostic) return null;
  return { id: `${formation.id}-diagnostic`, formationId: formation.id, ...p.diagnostic };
}
