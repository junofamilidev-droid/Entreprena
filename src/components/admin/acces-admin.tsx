"use client";

import * as React from "react";
import { CopyIcon, GiftIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/admin/kit";
import { creerLienConnexion, offrirAcces, retirerAcces } from "@/lib/admin/acces-actions";

export type LigneAdmin = {
  id: string;
  created_at: string;
  email: string;
  formation_slug: string;
  origine: "achat" | "offert";
  montant_cents: number | null;
  revoque_at: string | null;
};

const date = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const euros = (c: number | null) => (c == null ? "–" : `${(c / 100).toLocaleString("fr-FR")} €`);

export function AccesAdmin({ lignes, formations }: { lignes: LigneAdmin[]; formations: { slug: string; titre: string }[] }) {
  const [email, setEmail] = React.useState("");
  const [formation, setFormation] = React.useState(formations[0]?.slug ?? "");
  const [message, setMessage] = React.useState<{ ok: boolean; texte: string } | null>(null);
  const [lien, setLien] = React.useState<{ id: string; url: string } | null>(null);
  const [pending, start] = React.useTransition();
  const titre = (slug: string) => formations.find((f) => f.slug === slug)?.titre ?? slug;
  const actifs = lignes.filter((l) => !l.revoque_at);
  const ventes = actifs.filter((l) => l.origine === "achat");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Accès actifs", String(actifs.length)],
          ["Achats", String(ventes.length)],
          ["Encaissé (hors frais Stripe)", euros(ventes.reduce((s, l) => s + (l.montant_cents ?? 0), 0))],
        ].map(([l, v]) => (
          <div key={l} className="rounded-md border bg-background p-4">
            <p className="text-caption text-muted-foreground">{l}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <Section title="Offrir un accès à un testeur">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            start(async () => {
              const r = await offrirAcces({ email, formation });
              setMessage(r.ok ? { ok: true, texte: r.message ?? "Fait." } : { ok: false, texte: r.erreur });
              if (r.ok) setEmail("");
            });
          }}
        >
          <label className="flex-1 space-y-1.5 text-sm">
            <span className="font-medium">Email du testeur</span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@exemple.fr" />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Formation</span>
            <select value={formation} onChange={(e) => setFormation(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-64">
              {formations.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.titre}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={pending}>
            <GiftIcon /> Offrir l&apos;accès
          </Button>
        </form>
        {message && <p className={message.ok ? "text-sm text-emerald-700 dark:text-emerald-400" : "text-sm text-destructive"}>{message.texte}</p>}
        <p className="text-sm text-muted-foreground">
          Le compte est créé s&apos;il n&apos;existe pas. Pour que le testeur se connecte sans mot de passe, cliquez ensuite sur « Lien de connexion » dans la liste et envoyez-lui le lien (valable une fois, environ une heure).
        </p>
      </Section>

      <Section title="Tous les accès">
        {lignes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun accès pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-caption text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Formation</th>
                  <th className="px-3 py-2 text-left font-medium">Origine</th>
                  <th className="px-3 py-2 text-right font-medium">Montant</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {lignes.map((l) => (
                  <React.Fragment key={l.id}>
                    <tr className={l.revoque_at ? "text-muted-foreground line-through decoration-1" : ""}>
                      <td className="px-3 py-2.5">{l.email}</td>
                      <td className="px-3 py-2.5">{titre(l.formation_slug)}</td>
                      <td className="px-3 py-2.5">{l.origine === "achat" ? "Achat" : "Offert"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{euros(l.montant_cents)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{date(l.created_at)}</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap no-underline">
                        {!l.revoque_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                const r = await creerLienConnexion(l.id);
                                if (r.ok && r.lien) setLien({ id: l.id, url: r.lien });
                                else if (!r.ok) setMessage({ ok: false, texte: r.erreur });
                              })
                            }
                          >
                            <LinkIcon /> Lien de connexion
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            if (!l.revoque_at && !confirm(`Retirer l'accès de ${l.email} ?`)) return;
                            start(async () => void (await retirerAcces(l.id, !l.revoque_at)));
                          }}
                        >
                          {l.revoque_at ? "Rétablir" : "Retirer"}
                        </Button>
                      </td>
                    </tr>
                    {lien?.id === l.id && (
                      <tr>
                        <td colSpan={6} className="bg-muted/40 px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Input readOnly value={lien.url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                            <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(lien.url)}>
                              <CopyIcon /> Copier
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
