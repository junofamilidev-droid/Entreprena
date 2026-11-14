import { describe, expect, it } from "vitest";
import { EMAILS, type NomEmail } from "@/lib/emails/textes";
import { construireEmail, remplir } from "@/lib/emails/gabarit";
import { EXEMPLE } from "@/lib/emails/exemples";

describe("emails automatiques", () => {
  const noms = Object.keys(EMAILS) as NomEmail[];
  it.each(noms.filter((n) => !n.startsWith("compte")))("« %s » se construit sans variable manquante", (nom) => {
    const e = construireEmail(EMAILS[nom], EXEMPLE, "Entreprena · contact");
    expect(e.objet).not.toMatch(/\{\{/);
    expect(e.html).not.toMatch(/\{\{/);
    expect(e.texte).not.toMatch(/\{\{/);
    expect(e.html.match(/padding:14px 24px/g)?.length).toBe(1); // un seul bouton principal
  });
  it("les emails de compte gardent le lien de Supabase", () => {
    const e = construireEmail(EMAILS.compteConfirmation, { lien_connexion: "{{ .ConfirmationURL }}" }, "p");
    expect(e.html).toContain('href="{{ .ConfirmationURL }}"');
    const c = construireEmail(EMAILS.compteCode, { lien_connexion: "{{ .ConfirmationURL }}", code: "{{ .Token }}" }, "p");
    expect(c.html).toContain("{{ .Token }}");
  });
  it("une variable absente bloque l'envoi", () => {
    expect(() => remplir("Bonjour {{inconnue}}", {})).toThrow("Variable manquante : inconnue");
  });
  it("échappe le HTML des valeurs", () => {
    const e = construireEmail({ objet: "x", apercu: "y", blocs: [{ p: "{{metier}}" }] }, { metier: "<script>" }, "p");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).not.toContain("<script>");
  });
  it("les emails de relance et d'annonce ont la désinscription", () => {
    for (const n of ["conseil1", "conseil1Auditeur", "conseil2", "conseil2Auditeur", "ouverture"] as NomEmail[]) {
      expect(construireEmail(EMAILS[n], EXEMPLE, "p").html).toContain("Se désinscrire");
    }
  });
});
