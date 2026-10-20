import { supabaseUrl } from "@/lib/supabase/env";
import type { Session } from "./types";

// Fichiers d'une session (données fictives du défi, outils à télécharger), rangés dans le
// stockage « session-files » sous <formation>/<module>/<numéro de session>/<nom du fichier>.

export const FILES_BUCKET = "session-files";

export function filesPrefix(s: Pick<Session, "formation" | "module" | "session">) {
  return `${s.formation}/${s.module}/${s.session}`;
}

/** Adresse publique du dossier de la session ; le lecteur y ajoute le nom de chaque fichier. */
export function filesBase(s: Pick<Session, "formation" | "module" | "session">) {
  return `${supabaseUrl}/storage/v1/object/public/${FILES_BUCKET}/${filesPrefix(s)}`;
}

/** Noms de fichiers cités par les blocs, dans l'ordre d'apparition. */
export function requiredFiles(s: Pick<Session, "blocs">) {
  const names: { name: string; usage: string }[] = [];
  for (const b of s.blocs) {
    const name = b.type === "defi" ? b.donnees : b.type === "outil" ? b.fichier : null;
    if (name && !names.some((n) => n.name === name))
      names.push({ name, usage: b.type === "defi" ? "Données du défi" : "Outil à télécharger" });
  }
  return names;
}
