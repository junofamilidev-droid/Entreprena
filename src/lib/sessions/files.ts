import { supabaseUrl } from "@/lib/supabase/env";
import type { Session } from "./types";
import type { AtelierSession } from "./atelier";

// Fichiers d'une session (données fictives du défi, outils à télécharger), rangés dans le
// stockage « session-files » sous <formation>/<module>/<numéro de session>/<nom du fichier>.

export const FILES_BUCKET = "session-files";

export function filesPrefix(s: Pick<Session | AtelierSession, "formation" | "module" | "session">) {
  return `${s.formation}/${s.module}/${s.session}`;
}

/** Adresse publique du dossier de la session ; le lecteur y ajoute le nom de chaque fichier. */
export function filesBase(s: Pick<Session | AtelierSession, "formation" | "module" | "session">) {
  return `${supabaseUrl}/storage/v1/object/public/${FILES_BUCKET}/${filesPrefix(s)}`;
}

/** Noms de fichiers cités par la session (blocs, ou panneaux d'un atelier), dans l'ordre d'apparition. */
export function requiredFiles(s: Pick<Session, "blocs"> | Pick<AtelierSession, "etapes">) {
  const names: { name: string; usage: string }[] = [];
  if ("etapes" in s) {
    for (const e of s.etapes) {
      const p = e.panneau;
      const name = p.type === "outil" ? p.fichier : p.type === "test" ? p.fichier_donnees : null;
      if (name && !names.some((n) => n.name === name))
        names.push({ name, usage: p.type === "outil" ? "Outil à télécharger (skill)" : "Données du test" });
    }
    return names;
  }
  for (const b of s.blocs) {
    const name = b.type === "defi" ? b.donnees : b.type === "outil" ? b.fichier : null;
    if (name && !names.some((n) => n.name === name))
      names.push({ name, usage: b.type === "defi" ? "Données du défi" : "Outil à télécharger" });
  }
  return names;
}
