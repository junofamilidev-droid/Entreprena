import { AI_TOOLS, type Session, type SessionBlock } from "./types";

// Contrôle d'un fichier de session collé dans l'espace réservé.
// Chaque erreur est écrite pour être comprise sans connaître le code : où, et quoi corriger.

export type ParseResult = { ok: true; session: Session } | { ok: false; errors: string[] };

export type Field = "texte" | "nombre" | "liste" | "liste?";
/** Champs de chaque type de bloc, dans l'ordre du format (sert aussi à l'éditeur). */
export const BLOCK_FIELDS: Record<SessionBlock["type"], Record<string, Field>> = {
  mission: { expediteur: "texte", objet: "texte", message: "texte", echeance: "texte", livrable: "texte" },
  defi: { consigne: "texte", donnees: "texte", temps_cible_min: "nombre", criteres: "liste", reponses_attendues: "liste?" },
  prompt: { texte: "texte", usage: "texte", resultat_attendu: "texte" },
  collage: { consigne: "texte", a_verifier: "liste" },
  controle: { items: "liste" },
  "repere-erreur": { lignes: "liste", ligne_fautive: "nombre", explication: "texte" },
  outil: { fichier: "texte", description: "texte", champs_a_adapter: "liste", mode_emploi: "texte" },
  gain: { tache: "texte", reference: "texte" },
  fiche: { titre: "texte", etapes: "liste", pieges: "liste" },
  texte: { contenu: "texte" },
};
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Transforme le texte collé en session, ou liste ce qui ne va pas. */
export function parseSession(input: string | unknown): ParseResult {
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
  if (!isRecord(data)) return { ok: false, errors: ["Le fichier doit commencer par { et décrire une seule session."] };
  if (isRecord(data.formation) && Array.isArray(data.modules))
    return {
      ok: false,
      errors: ["Ce fichier est une formation, pas une session : utilisez « Importer une formation (JSON) », depuis l'accueil de l'espace réservé."],
    };

  const errors: string[] = [];
  const text = (v: unknown, where: string, required = true) => {
    if (typeof v !== "string" || (required && !v.trim())) errors.push(`${where} : texte manquant ou vide.`);
  };

  text(data.formation, "« formation »");
  if (typeof data.formation === "string" && data.formation && !SLUG.test(data.formation))
    errors.push("« formation » : identifiant en minuscules et tirets, par exemple « auditeur-augmente-ia ».");
  text(data.module, "« module »");
  if (typeof data.module === "string" && data.module && !SLUG.test(data.module))
    errors.push("« module » : identifiant en minuscules et tirets, par exemple « revue-analytique ».");
  if (!Number.isInteger(data.session) || (data.session as number) < 1)
    errors.push("« session » : numéro entier à partir de 1.");
  text(data.titre, "« titre »");
  if (typeof data.duree_min !== "number" || data.duree_min <= 0) errors.push("« duree_min » : nombre de minutes, par exemple 15.");
  else if (data.duree_min > 15) errors.push(`« duree_min » : ${data.duree_min} minutes, une session ne doit pas dépasser 15 minutes.`);
  if (typeof data.maj !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.maj) || Number.isNaN(Date.parse(data.maj)))
    errors.push("« maj » : date au format AAAA-MM-JJ, par exemple 2026-10-19.");

  if (!Array.isArray(data.blocs) || data.blocs.length === 0) {
    errors.push("« blocs » : liste d'au moins un bloc, entre [ et ].");
  } else {
    const blocs: unknown[] = data.blocs;
    blocs.forEach((b, i) => {
      const where = `Bloc ${i + 1}`;
      if (!isRecord(b)) return void errors.push(`${where} : chaque bloc doit être écrit entre { et }.`);
      const fields = BLOCK_FIELDS[b.type as SessionBlock["type"]];
      if (!fields)
        return void errors.push(
          `${where} : type « ${String(b.type ?? "")} » inconnu. Types possibles : ${Object.keys(BLOCK_FIELDS).join(", ")}.`,
        );
      const w = `${where} (${b.type})`;
      for (const [name, kind] of Object.entries(fields)) {
        const v = b[name];
        if (v === undefined) {
          if (kind !== "liste?") errors.push(`${w} : champ « ${name} » manquant.`);
        }
        else if (kind === "texte") text(v, `${w}, « ${name} »`);
        else if (kind === "nombre" && typeof v !== "number") errors.push(`${w} : « ${name} » doit être un nombre, sans guillemets.`);
        else if ((kind === "liste" || kind === "liste?") && (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.trim())))
          errors.push(`${w} : « ${name} » doit être une liste de textes non vides, entre [ et ].`);
      }
      for (const name of Object.keys(b)) {
        if (name !== "type" && !(name in fields)) errors.push(`${w} : champ « ${name} » inconnu pour ce type de bloc.`);
      }
      if (b.type === "texte" && typeof b.contenu === "string" && b.contenu.split("\n").length > 3)
        errors.push(`${w} : 3 lignes maximum.`);
      if (b.type === "texte" && typeof b.contenu === "string" && b.contenu.length > 400)
        errors.push(`${w} : ${b.contenu.length} caractères, 400 au maximum (environ 3 lignes).`);
      if (b.type === "controle" && Array.isArray(b.items) && b.items.length === 0) errors.push(`${w} : au moins une case à cocher.`);
      if (b.type === "repere-erreur" && Array.isArray(b.lignes) && typeof b.ligne_fautive === "number") {
        if (b.lignes.length < 2) errors.push(`${w} : au moins 2 lignes, dont une fautive.`);
        else if (!Number.isInteger(b.ligne_fautive) || b.ligne_fautive < 1 || b.ligne_fautive > b.lignes.length)
          errors.push(`${w} : « ligne_fautive » doit être le numéro d'une des lignes, de 1 à ${b.lignes.length}.`);
      }
      if (b.type === "gain" && b.reference !== "defi") errors.push(`${w} : « reference » doit valoir « defi ».`);
    });
  }

  if (data.consignes_outils_ia !== undefined) {
    if (!isRecord(data.consignes_outils_ia)) errors.push("« consignes_outils_ia » : écrire entre { et }.");
    else
      for (const [k, v] of Object.entries(data.consignes_outils_ia)) {
        if (!(AI_TOOLS as readonly string[]).includes(k))
          errors.push(`« consignes_outils_ia » : outil « ${k} » inconnu. Outils possibles : ${AI_TOOLS.join(", ")}.`);
        else if (typeof v !== "string") errors.push(`« consignes_outils_ia », « ${k} » : texte attendu.`);
      }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, session: { consignes_outils_ia: {}, ...data } as unknown as Session };
}
