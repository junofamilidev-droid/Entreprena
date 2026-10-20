"use client";

import { hasSupabase } from "@/lib/supabase/env";
import { supabase } from "@/lib/auth/session";

// Mesure anonyme des sessions : commencée, terminée, durée réelle, gain mesuré, réponses trouvées.
// Aucun lien avec le compte : un identifiant tiré au hasard dans ce navigateur, pour compter
// les apprenants distincts. Chaque événement n'est envoyé qu'une fois par session.

const VISITOR = "visiteur:v1";
const SENT = "mesures-envoyees:v1";

function visitor() {
  try {
    let id = localStorage.getItem(VISITOR);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR, id);
    }
    return id;
  } catch {
    return null;
  }
}

export interface SessionMeasure {
  duration_sec?: number;
  gain_sec?: number;
  found?: number;
  expected?: number;
}

export function trackSession(sessionKey: string, event: "started" | "completed", measure: SessionMeasure = {}) {
  if (!hasSupabase) return;
  const id = visitor();
  if (!id) return;
  let sent: string[] = [];
  try {
    sent = JSON.parse(localStorage.getItem(SENT) ?? "[]");
  } catch {
    sent = [];
  }
  const tag = `${sessionKey}:${event}`;
  if (sent.includes(tag)) return;
  const clean = Object.fromEntries(Object.entries(measure).filter(([, v]) => Number.isFinite(v) && (v as number) >= 0).map(([k, v]) => [k, Math.round(v as number)]));
  void supabase()
    .from("session_events")
    .insert({ visitor: id, session_key: sessionKey, event, ...clean })
    .then(({ error }) => {
      if (error) return;
      try {
        localStorage.setItem(SENT, JSON.stringify([...sent, tag].slice(-500)));
      } catch {
        // Stockage indisponible : l'événement pourra être renvoyé, sans gravité.
      }
    });
}
