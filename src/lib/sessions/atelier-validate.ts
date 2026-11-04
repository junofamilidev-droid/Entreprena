import type { AtelierSession } from "./atelier";

// Contrôle d'un fichier de session au format « atelier ». Chaque erreur dit où corriger :
// « Étape 2 (outil), « regles », règle 1 : … ».

export type AtelierParse = { ok: true; session: AtelierSession } | { ok: false; errors: string[] };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function parseAtelier(data: Record<string, unknown>): AtelierParse {
  const errors: string[] = [];
  const text = (v: unknown, where: string) => {
    if (typeof v !== "string" || !v.trim()) errors.push(`${where} : texte manquant ou vide.`);
  };
  const list = (v: unknown, where: string, min = 1) => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.trim()))
      errors.push(`${where} : liste de textes non vides, entre [ et ].`);
    else if (v.length < min) errors.push(`${where} : au moins ${min} élément${min > 1 ? "s" : ""}.`);
  };
  const record = (v: unknown, where: string, fields: string[], optional: string[] = []) => {
    if (!isRecord(v)) {
      errors.push(`${where} : à écrire entre { et }.`);
      return null;
    }
    for (const k of Object.keys(v)) if (!fields.includes(k) && !optional.includes(k)) errors.push(`${where} : champ « ${k} » inconnu.`);
    return v;
  };

  // En-tête
  if (typeof data.formation !== "string" || !SLUG.test(data.formation))
    errors.push("« formation » : identifiant en minuscules et tirets, par exemple « auditeur-augmente-ia ».");
  if (typeof data.module !== "string" || !SLUG.test(data.module))
    errors.push("« module » : identifiant en minuscules et tirets, par exemple « revue-analytique ».");
  if (!Number.isInteger(data.session) || (data.session as number) < 1) errors.push("« session » : numéro entier à partir de 1.");
  text(data.titre, "« titre »");
  if (typeof data.duree_min !== "number" || data.duree_min <= 0) errors.push("« duree_min » : nombre de minutes, par exemple 45.");
  else if (data.duree_min > 60) errors.push(`« duree_min » : ${data.duree_min} minutes, une session ne doit pas dépasser 60 minutes.`);
  if (typeof data.maj !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.maj) || Number.isNaN(Date.parse(data.maj)))
    errors.push("« maj » : date au format AAAA-MM-JJ, par exemple 2026-11-04.");
  const top = ["format", "formation", "module", "session", "titre", "duree_min", "maj", "accueil", "mission", "tuteur", "etapes", "fin"];
  for (const k of Object.keys(data)) if (!top.includes(k)) errors.push(`Champ « ${k} » inconnu au format atelier.`);

  const accueil = record(data.accueil, "« accueil »", ["ce_que_vous_allez_faire", "ce_que_vous_emportez", "pourquoi"]);
  if (accueil) {
    text(accueil.ce_que_vous_allez_faire, "« accueil », « ce_que_vous_allez_faire »");
    list(accueil.ce_que_vous_emportez, "« accueil », « ce_que_vous_emportez »");
    text(accueil.pourquoi, "« accueil », « pourquoi »");
  }
  const mission = record(data.mission, "« mission »", ["expediteur", "objet", "message", "echeance", "livrable", "a_copier"]);
  if (mission) for (const k of ["expediteur", "objet", "message", "echeance", "livrable", "a_copier"]) text(mission[k], `« mission », « ${k} »`);
  const tuteur = record(data.tuteur, "« tuteur »", ["nom", "role"]);
  if (tuteur) for (const k of ["nom", "role"]) text(tuteur[k], `« tuteur », « ${k} »`);
  const fin = record(data.fin, "« fin »", ["recapitulatif"]);
  if (fin) list(fin.recapitulatif, "« fin », « recapitulatif »");

  // Étapes
  if (!Array.isArray(data.etapes) || data.etapes.length === 0) errors.push("« etapes » : liste d'au moins une étape, entre [ et ].");
  else
    data.etapes.forEach((e: unknown, i: number) => {
      const p0 = isRecord(e) && isRecord(e.panneau) ? String(e.panneau.type ?? "?") : "?";
      const w = `Étape ${i + 1} (${p0})`;
      const etape = record(e, `Étape ${i + 1}`, ["titre", "objectif", "pourquoi", "a_faire", "aides", "panneau"], ["relance"]);
      if (!etape) return;
      for (const k of ["titre", "objectif", "pourquoi"]) text(etape[k], `${w}, « ${k} »`);
      list(etape.a_faire, `${w}, « a_faire »`);
      if (!Array.isArray(etape.aides)) errors.push(`${w}, « aides » : liste entre [ et ] (elle peut être vide).`);
      else
        etape.aides.forEach((a: unknown, j: number) => {
          const aide = record(a, `${w}, aide ${j + 1}`, ["question", "reponse"]);
          if (aide) for (const k of ["question", "reponse"]) text(aide[k], `${w}, aide ${j + 1}, « ${k} »`);
        });
      if (etape.relance !== undefined) {
        const r = record(etape.relance, `${w}, « relance »`, ["expediteur", "message"]);
        if (r) for (const k of ["expediteur", "message"]) text(r[k], `${w}, « relance », « ${k} »`);
      }
      const p = etape.panneau;
      if (!isRecord(p)) return void errors.push(`${w}, « panneau » : à écrire entre { et }, avec un « type ».`);
      const pw = `${w}, « panneau »`;
      switch (p.type) {
        case "quiz": {
          record(p, pw, ["type", "question", "choix", "bonne", "explication"]);
          text(p.question, `${pw}, « question »`);
          list(p.choix, `${pw}, « choix »`, 2);
          text(p.explication, `${pw}, « explication »`);
          const n = Array.isArray(p.choix) ? p.choix.length : 0;
          if (!Number.isInteger(p.bonne) || (p.bonne as number) < 0 || (p.bonne as number) >= n)
            errors.push(`${pw}, « bonne » : index de la bonne réponse, de 0 à ${Math.max(0, n - 1)} (le premier choix vaut 0).`);
          break;
        }
        case "outil": {
          record(p, pw, ["type", "fichier", "presentation", "regles", "installation"]);
          text(p.fichier, `${pw}, « fichier »`);
          text(p.presentation, `${pw}, « presentation »`);
          if (!Array.isArray(p.regles) || p.regles.length === 0) errors.push(`${pw}, « regles » : au moins une règle, entre [ et ].`);
          else
            p.regles.forEach((r: unknown, j: number) => {
              const rr = record(r, `${pw}, règle ${j + 1}`, ["titre", "extrait", "avec", "sans", "explication"]);
              if (rr) for (const k of ["titre", "extrait", "avec", "sans", "explication"]) text(rr[k], `${pw}, règle ${j + 1}, « ${k} »`);
            });
          if (!Array.isArray(p.installation) || p.installation.length === 0)
            errors.push(`${pw}, « installation » : au moins une étape d'installation, entre [ et ].`);
          else
            p.installation.forEach((s: unknown, j: number) => {
              const ss = record(s, `${pw}, installation ${j + 1}`, ["titre", "detail"]);
              if (ss) for (const k of ["titre", "detail"]) text(ss[k], `${pw}, installation ${j + 1}, « ${k} »`);
            });
          break;
        }
        case "test": {
          record(p, pw, ["type", "fichier_donnees", "consigne", "verifications"]);
          text(p.fichier_donnees, `${pw}, « fichier_donnees »`);
          text(p.consigne, `${pw}, « consigne »`);
          if (!Array.isArray(p.verifications) || p.verifications.length === 0)
            errors.push(`${pw}, « verifications » : au moins une vérification, entre [ et ].`);
          else
            p.verifications.forEach((v: unknown, j: number) => {
              const vw = `${pw}, vérification ${j + 1}`;
              const vv = record(v, vw, ["libelle", "mots_cles", "regle", "si_reussi", "si_manque"]);
              if (!vv) return;
              for (const k of ["libelle", "si_reussi", "si_manque"]) text(vv[k], `${vw}, « ${k} »`);
              list(vv.mots_cles, `${vw}, « mots_cles »`);
              if (vv.regle !== "tous" && vv.regle !== "un") errors.push(`${vw}, « regle » : « tous » ou « un ».`);
            });
          break;
        }
        case "personnaliser":
          record(p, pw, ["type", "commande", "etapes", "items"]);
          text(p.commande, `${pw}, « commande »`);
          list(p.etapes, `${pw}, « etapes »`);
          list(p.items, `${pw}, « items »`);
          break;
        case "fiche":
          record(p, pw, ["type", "titre", "etapes", "pieges"]);
          text(p.titre, `${pw}, « titre »`);
          list(p.etapes, `${pw}, « etapes »`);
          list(p.pieges, `${pw}, « pieges »`, 0);
          break;
        default:
          errors.push(`${pw}, « type » : « ${String(p.type ?? "")} » inconnu. Types possibles : quiz, outil, test, personnaliser, fiche.`);
      }
    });

  if (errors.length) return { ok: false, errors };
  return { ok: true, session: data as unknown as AtelierSession };
}
