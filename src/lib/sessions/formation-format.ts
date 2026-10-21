import { parseSession } from "./validate";
import type { Session } from "./types";

// Fichier d'une formation complète, rédigé par Claude et collé dans l'espace réservé :
// la fiche de la formation, ses modules dans l'ordre, et éventuellement ses sessions.

export interface FormationFile {
  formation: {
    identifiant: string;
    titre: string;
    domaine: string;
    public: string;
    /** Les passages écrits ==ainsi== sont surlignés sur le site. */
    promesse: string;
    resume: string;
    pour_qui: string[];
    ce_que_ce_n_est_pas: string[];
  };
  modules: {
    identifiant: string;
    titre: string;
    resume: string;
    livrable: string;
    /** Ouvert aux apprenants, ou visible dans le plan comme « à venir ». */
    ouvert: boolean;
  }[];
  sessions: Session[];
}

export type FormationParse = { ok: true; file: FormationFile } | { ok: false; errors: string[] };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function parseFormationFile(input: string | unknown): FormationParse {
  let data: unknown = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (e) {
      const where = String((e as Error).message).match(/position (\d+)/);
      const line = where ? input.slice(0, Number(where[1])).split("\n").length : null;
      return {
        ok: false,
        errors: [
          `Le texte collé n'est pas un JSON valide${line ? ` (vers la ligne ${line})` : ""}. Vérifiez les guillemets, les virgules entre les éléments et qu'il n'y a pas de virgule avant } ou ].`,
        ],
      };
    }
  }
  if (!isRecord(data)) return { ok: false, errors: ["Le fichier doit commencer par { et décrire une formation."] };
  if (!isRecord(data.formation) && typeof data.formation === "string" && Array.isArray(data.blocs))
    return { ok: false, errors: ["Ce fichier est une session, pas une formation : utilisez « Importer une session (JSON) »."] };

  const errors: string[] = [];
  const text = (v: unknown, where: string) => {
    if (typeof v !== "string" || !v.trim()) errors.push(`${where} : texte manquant ou vide.`);
  };
  const list = (v: unknown, where: string) => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.trim())) errors.push(`${where} : liste de textes non vides, entre [ et ].`);
  };
  const slug = (v: unknown, where: string, example: string) => {
    if (typeof v !== "string" || !SLUG.test(v)) errors.push(`${where} : identifiant en minuscules et tirets, par exemple « ${example} ».`);
  };

  const f = data.formation;
  if (!isRecord(f)) errors.push("« formation » : la fiche de la formation, entre { et }.");
  else {
    slug(f.identifiant, "Formation, « identifiant »", "controleur-gestion-ia");
    for (const k of ["titre", "domaine", "public", "promesse", "resume"]) text(f[k], `Formation, « ${k} »`);
    for (const k of ["pour_qui", "ce_que_ce_n_est_pas"]) list(f[k], `Formation, « ${k} »`);
    for (const k of Object.keys(f))
      if (!["identifiant", "titre", "domaine", "public", "promesse", "resume", "pour_qui", "ce_que_ce_n_est_pas"].includes(k))
        errors.push(`Formation : champ « ${k} » inconnu.`);
  }

  const moduleIds: string[] = [];
  if (!Array.isArray(data.modules) || data.modules.length === 0) errors.push("« modules » : liste d'au moins un module, entre [ et ].");
  else
    data.modules.forEach((m: unknown, i: number) => {
      const w = `Module ${i + 1}`;
      if (!isRecord(m)) return void errors.push(`${w} : chaque module doit être écrit entre { et }.`);
      slug(m.identifiant, `${w}, « identifiant »`, "suivi-budgetaire");
      if (typeof m.identifiant === "string") {
        if (moduleIds.includes(m.identifiant)) errors.push(`${w} : l'identifiant « ${m.identifiant} » est déjà pris par un autre module.`);
        moduleIds.push(m.identifiant);
      }
      for (const k of ["titre", "resume", "livrable"]) text(m[k], `${w}, « ${k} »`);
      if (typeof m.ouvert !== "boolean") errors.push(`${w}, « ouvert » : true (ouvert aux apprenants) ou false (à venir), sans guillemets.`);
      for (const k of Object.keys(m)) if (!["identifiant", "titre", "resume", "livrable", "ouvert"].includes(k)) errors.push(`${w} : champ « ${k} » inconnu.`);
    });

  const sessions: Session[] = [];
  if (data.sessions !== undefined) {
    if (!Array.isArray(data.sessions)) errors.push("« sessions » : liste de sessions, entre [ et ], ou rien.");
    else {
      const seen = new Set<string>();
      data.sessions.forEach((s: unknown, i: number) => {
        const label = isRecord(s) ? `Session ${i + 1} (${String(s.module ?? "?")}, n° ${String(s.session ?? "?")})` : `Session ${i + 1}`;
        const r = parseSession(s);
        if (!r.ok) errors.push(...r.errors.map((e) => `${label} · ${e}`));
        if (!isRecord(s)) return;
        // Cohérence avec la formation et ses modules, même si la session a d'autres erreurs.
        const fid = isRecord(f) ? f.identifiant : undefined;
        if (typeof s.formation === "string" && s.formation !== fid)
          errors.push(`${label} : « formation » vaut « ${s.formation} », il faut « ${String(fid)} ».`);
        if (typeof s.module === "string" && !moduleIds.includes(s.module))
          errors.push(`${label} : le module « ${s.module} » n'est pas dans la liste « modules ».`);
        const k = `${String(s.module)}/${String(s.session)}`;
        if (seen.has(k)) errors.push(`${label} : deux sessions portent le numéro ${String(s.session)} dans ce module.`);
        seen.add(k);
        if (r.ok) sessions.push(r.session);
      });
    }
  }
  for (const k of Object.keys(data)) if (!["formation", "modules", "sessions"].includes(k)) errors.push(`Champ « ${k} » inconnu (attendus : formation, modules, sessions).`);

  if (errors.length) return { ok: false, errors };
  return { ok: true, file: { formation: f as FormationFile["formation"], modules: data.modules as FormationFile["modules"], sessions } };
}
