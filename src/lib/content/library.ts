import "server-only";
import { getModule, getSession, listFormations, listSessions } from "./source";
import type { FormationWithModules, LessonContent, ModuleWithSteps } from "./types";
import type { SessionItem } from "@/components/platform/session-list";
import type { FicheBlock, OutilBlock, PromptBlock, Session } from "@/lib/sessions/types";
import { forLearner } from "@/lib/sessions/display";
import { filesBase } from "@/lib/sessions/files";
import { moduleDuration } from "./durations";

export interface OpenModule {
  formationSlug: string;
  formationTitle: string;
  module: ModuleWithSteps;
}

/** Tous les modules ouverts, avec leurs étapes publiées. */
export async function openModules(): Promise<{ open: OpenModule[]; soon: OpenModule["module"][]; formations: Awaited<ReturnType<typeof listFormations>> }> {
  const formations = await listFormations();
  const open: OpenModule[] = [];
  for (const f of formations) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      const mod = await getModule(f.slug, m.slug);
      if (mod) open.push({ formationSlug: f.slug, formationTitle: f.title, module: mod });
    }
  }
  const soon = formations.flatMap((f) => f.modules.filter((m) => m.availability !== "open").map((m) => ({ ...m, steps: [] })));
  return { open, soon, formations };
}

export function lessonContent(step: ModuleWithSteps["steps"][number]) {
  return step.kind === "lesson" ? (step.content as unknown as LessonContent) : null;
}

/* ---------------- Sessions en blocs ---------------- */


/** Sessions et durée calculée de chaque module ouvert, par clé « formation/module ». */
export async function sessionsIndex(formations: FormationWithModules[]) {
  const sessions: Record<string, SessionItem[]> = {};
  const durations: Record<string, string | null> = {};
  for (const f of formations) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      const key = `${f.slug}/${m.slug}`;
      const [list, d] = await Promise.all([listSessions(f.slug, m.slug), moduleDuration(f.slug, m.slug)]);
      sessions[key] = list.map((s) => ({ number: s.number, title: s.title, durationMin: s.durationMin }));
      durations[key] = d.label;
    }
  }
  return { sessions, durations };
}

export interface ToolboxEntry<T> {
  block: T;
  /** Clé de progression de la session qui le donne. */
  sessionKey: string;
  sessionLabel: string;
  href: string;
  fileUrl?: string;
}

/** Outils, fiches et prompts de toutes les sessions publiées, pour « Ma boîte à outils ». */
export async function toolbox() {
  const formations = await listFormations();
  const tools: ToolboxEntry<OutilBlock>[] = [];
  const fiches: ToolboxEntry<FicheBlock>[] = [];
  const prompts: ToolboxEntry<PromptBlock>[] = [];
  for (const f of formations) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      for (const summary of await listSessions(f.slug, m.slug)) {
        const record = await getSession(f.slug, m.slug, summary.number);
        if (!record) continue;
        const s: Session = forLearner(record.content);
        const base = {
          sessionKey: `${f.slug}/${m.slug}/session-${s.session}`,
          sessionLabel: `Module ${m.position} · session ${s.session} : ${s.titre}`,
          href: `/formations/${f.slug}/${m.slug}/session/${s.session}`,
        };
        for (const b of s.blocs) {
          if (b.type === "outil") tools.push({ ...base, block: b, fileUrl: `${filesBase(s)}/${encodeURIComponent(b.fichier)}` });
          if (b.type === "fiche") fiches.push({ ...base, block: b });
          if (b.type === "prompt") prompts.push({ ...base, block: b });
        }
      }
    }
  }
  return { tools, fiches, prompts };
}
