import "server-only";
import { getModule, listSessions } from "./source";
import type { FormationWithModules } from "./types";

// Durées affichées, calculées depuis le contenu : somme des sessions publiées d'un module,
// et à défaut des durées de ses étapes (« 6 min de lecture », « 25 min »).

export function minutesIn(text: string | null | undefined) {
  const m = text?.match(/(\d+)\s*min/);
  return m ? Number(m[1]) : 0;
}

/** « 45 min », « 1 h 25 ». */
export function durationText(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export interface ModuleDuration {
  minutes: number;
  sessions: number;
  /** « 45 min · 3 sessions », ou null si le contenu ne dit rien. */
  label: string | null;
}

export async function moduleDuration(formationSlug: string, moduleSlug: string): Promise<ModuleDuration> {
  const [sessions, mod] = await Promise.all([listSessions(formationSlug, moduleSlug), getModule(formationSlug, moduleSlug)]);
  const minutes =
    sessions.reduce((t, s) => t + s.durationMin, 0) +
    (mod?.steps ?? []).reduce((t, s) => t + minutesIn(s.content.duration as string | undefined), 0);
  const count = sessions.length ? ` · ${sessions.length} session${sessions.length > 1 ? "s" : ""}` : "";
  return { minutes, sessions: sessions.length, label: minutes ? `${durationText(minutes)}${count}` : null };
}

/** Durée de chaque module ouvert d'une formation, par identifiant de module. */
export async function formationDurations(formation: FormationWithModules) {
  const entries = await Promise.all(
    formation.modules
      .filter((m) => m.availability === "open")
      .map(async (m) => [m.slug, await moduleDuration(formation.slug, m.slug)] as const),
  );
  return Object.fromEntries(entries) as Record<string, ModuleDuration>;
}
