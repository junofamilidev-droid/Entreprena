import type { Bloc, ModeleEmail } from "./textes";

// Mise en forme des emails : un gabarit HTML simple (styles en ligne, lisible sur téléphone et dans
// les messageries d'entreprise), plus une version texte. Module pur, testé.

export type Variables = Record<string, string>;

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Remplace les {{variables}} ; une variable absente est une erreur (on n'envoie jamais un email à trous). */
export function remplir(texte: string, v: Variables): string {
  return texte.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, nom: string) => {
    if (!(nom in v)) throw new Error(`Variable manquante : ${nom}`);
    return v[nom];
  });
}

const ENCRE = "#1f2a2c";
const DOUX = "#5b6668";
const PETROLE = "#1d4f52";

function blocHtml(b: Bloc, v: Variables): string {
  const t = (s: string) => echapper(remplir(s, v));
  if ("p" in b) return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${ENCRE}">${t(b.p)}</p>`;
  if ("titre" in b) return `<p style="margin:24px 0 8px;font-size:16px;line-height:1.4;font-weight:700;color:${ENCRE}">${t(b.titre)}</p>`;
  if ("liste" in b)
    return `<ul style="margin:0 0 16px;padding-left:20px">${b.liste.map((x) => `<li style="margin:0 0 8px;font-size:16px;line-height:1.55;color:${ENCRE}">${t(x)}</li>`).join("")}</ul>`;
  if ("bouton" in b)
    return `<p style="margin:28px 0"><a href="${t(b.lien)}" style="display:inline-block;background:${PETROLE};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 24px;border-radius:12px">${t(b.bouton)}</a></p>`;
  if ("discret" in b) {
    const texte = t(b.discret);
    if (!texte) return "";
    const contenu = b.lien ? `<a href="${t(b.lien)}" style="color:${PETROLE}">${texte}</a>` : texte;
    return `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${DOUX}">${contenu}</p>`;
  }
  const desinscription = v.lien_desinscription ? ` <a href="${echapper(v.lien_desinscription)}" style="color:${DOUX}">Se désinscrire</a>` : "";
  return `<p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:${DOUX}">${t(b.raison)}${desinscription}</p>`;
}

function blocTexte(b: Bloc, v: Variables): string {
  const t = (s: string) => remplir(s, v);
  if ("p" in b) return t(b.p);
  if ("titre" in b) return t(b.titre).toUpperCase();
  if ("liste" in b) return b.liste.map((x) => `- ${t(x)}`).join("\n");
  if ("bouton" in b) return `${t(b.bouton)} : ${t(b.lien)}`;
  if ("discret" in b) return b.lien && t(b.discret) ? `${t(b.discret)} : ${t(b.lien)}` : t(b.discret);
  return `${t(b.raison)}${v.lien_desinscription ? `\nSe désinscrire : ${v.lien_desinscription}` : ""}`;
}

export type EmailPret = { objet: string; apercu: string; html: string; texte: string };

/** Construit l'email complet : objet, texte d'aperçu, HTML et version texte. `pied` : « Entreprena · contact ». */
export function construireEmail(m: ModeleEmail, v: Variables, pied: string): EmailPret {
  const objet = remplir(m.objet, v);
  const apercu = remplir(m.apercu, v);
  const corps = m.blocs.map((b) => blocHtml(b, v)).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(objet)}</title></head>
<body style="margin:0;padding:0;background:#f6f1e7">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${echapper(apercu)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border-radius:20px;border:1px solid #e7dfd0">
<tr><td style="padding:32px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<p style="margin:0 0 24px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${ENCRE}">Entreprena<span style="color:${PETROLE}">.</span></p>
${corps}
</td></tr>
<tr><td style="padding:16px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:${DOUX};border-top:1px solid #efe8da">${echapper(pied)}</td></tr>
</table></td></tr></table></body></html>`;
  const texte = [...m.blocs.map((b) => blocTexte(b, v)).filter(Boolean), "", pied].join("\n\n");
  return { objet, apercu, html, texte };
}
