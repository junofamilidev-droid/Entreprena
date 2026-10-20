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
  ModuleWithSteps,
  Step,
} from "./types";
import type { Session } from "@/lib/sessions/types";

// Point d'accès unique au contenu : la base de données, alimentée depuis l'espace réservé.
// Le dossier content/ ne sert qu'à l'import initial (bouton « Importer le contenu initial »),
// et au travail local sans base : sans Supabase configuré, ou avec CONTENT_SOURCE=files.

/* ---------------- Base de données ---------------- */

type Row = Record<string, unknown>;

export function mapFormation(r: Row): Formation {
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

export function mapModule(r: Row): Module {
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

export function mapStep(r: Row): ModuleWithSteps["steps"][number] {
  return {
    id: r.id as string,
    moduleId: r.module_id as string,
    slug: r.slug as string,
    position: r.position as number,
    kind: r.kind as Step["kind"],
    title: r.title as string,
    content: (r.content as ModuleWithSteps["steps"][number]["content"]) ?? {},
    status: r.status as Step["status"],
  };
}

async function dbGetModule(formationSlug: string, moduleSlug: string): Promise<ModuleWithSteps | null> {
  const formation = await dbGetFormation(formationSlug);
  const mod = formation?.modules.find((m) => m.slug === moduleSlug);
  if (!mod) return null;
  const { data, error } = await createPublicClient()
    .from("steps")
    .select("*")
    .eq("module_id", mod.id)
    .order("position");
  if (error) throw error;
  return { ...mod, steps: (data ?? []).map(mapStep) };
}

/* ---------------- Fichiers de contenu ---------------- */

export interface ContentPackage {
  formation: Omit<Formation, "id">;
  modules: (Omit<Module, "id" | "formationId"> & {
    steps?: Omit<ModuleWithSteps["steps"][number], "id" | "moduleId">[];
  })[];
  diagnostic?: { status: Diagnostic["status"]; config: DiagnosticConfig };
}

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function readLocalPackages() {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ steps, ...m }) => ({ ...m, id: `${id}-${m.slug}`, formationId: id }))
      .sort((a, b) => a.position - b.position),
  };
}

/* ---------------- API publique ---------------- */
// Les lectures sont mises en cache (étiquette « content ») et rafraîchies toutes les heures,
// ou immédiatement quand l'espace réservé publie une modification.

export const CONTENT_TAG = "content";

/** La base sert le contenu dès que Supabase est configuré ; les fichiers seulement en local. */
async function fromDb(): Promise<boolean> {
  return hasSupabase && process.env.CONTENT_SOURCE !== "files";
}

export async function listFormations(): Promise<FormationWithModules[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (await fromDb()) return dbListFormations();
  const all = (await readLocalPackages()).map(localFormation);
  return all.filter((f) => f.status === "published").sort((a, b) => a.position - b.position);
}

export async function getFormation(slug: string): Promise<FormationWithModules | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (await fromDb()) return dbGetFormation(slug);
  const p = (await readLocalPackages()).find((x) => x.formation.slug === slug);
  return p && p.formation.status === "published" ? localFormation(p) : null;
}

export async function getDiagnostic(formationSlug: string): Promise<Diagnostic | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const formation = await getFormation(formationSlug);
  if (!formation) return null;
  if (await fromDb()) return dbGetDiagnostic(formation.id);
  const p = (await readLocalPackages()).find((x) => x.formation.slug === formationSlug);
  if (!p?.diagnostic) return null;
  return { id: `${formation.id}-diagnostic`, formationId: formation.id, ...p.diagnostic };
}

export async function getModule(formationSlug: string, moduleSlug: string): Promise<ModuleWithSteps | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (await fromDb()) return dbGetModule(formationSlug, moduleSlug);
  const p = (await readLocalPackages()).find((x) => x.formation.slug === formationSlug);
  if (!p || p.formation.status !== "published") return null;
  const raw = p.modules.find((m) => m.slug === moduleSlug);
  if (!raw || raw.status !== "published") return null;
  const formationId = `local-${formationSlug}`;
  const id = `${formationId}-${raw.slug}`;
  const { steps = [], ...mod } = raw;
  return {
    ...mod,
    id,
    formationId,
    steps: steps
      .filter((s) => s.status === "published")
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ ...s, id: `${id}-${s.slug}`, moduleId: id })),
  };
}

/* ---------------- Sessions en blocs ---------------- */

export interface SessionSummary {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  durationMin: number;
  status: Step["status"];
}
export interface SessionRecord extends SessionSummary {
  content: Session;
}

export function mapSession(r: Row): SessionRecord {
  return {
    id: r.id as string,
    moduleId: r.module_id as string,
    number: r.number as number,
    title: r.title as string,
    durationMin: r.duration_min as number,
    status: r.status as Step["status"],
    content: r.content as Session,
  };
}

/** Sessions publiées d'un module, dans l'ordre (sans leurs blocs). */
export async function listSessions(formationSlug: string, moduleSlug: string): Promise<SessionSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (!(await fromDb())) return [];
  const formation = await getFormation(formationSlug);
  const mod = formation?.modules.find((m) => m.slug === moduleSlug);
  if (!mod) return [];
  const { data, error } = await createPublicClient()
    .from("sessions")
    .select("id, module_id, number, title, duration_min, status")
    .eq("module_id", mod.id)
    .eq("status", "published")
    .order("number");
  if (error) throw error;
  return (data ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...summary } = mapSession({ ...r, content: null });
    return summary;
  });
}

export async function getSession(formationSlug: string, moduleSlug: string, n: number): Promise<SessionRecord | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (!(await fromDb())) return null;
  const formation = await getFormation(formationSlug);
  const mod = formation?.modules.find((m) => m.slug === moduleSlug);
  if (!mod) return null;
  const { data, error } = await createPublicClient()
    .from("sessions")
    .select("*")
    .eq("module_id", mod.id)
    .eq("number", n)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data) : null;
}
