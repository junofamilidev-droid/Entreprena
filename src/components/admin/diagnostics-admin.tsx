"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/admin/kit";
import { cn } from "@/lib/utils";
import { compter, entonnoir, metiersAutres, parMetier, versCsv, type Evenement, type LigneDiagnostic, type Notification } from "@/lib/diagnostic-metier/stats";

// Tableau de bord du diagnostic : chiffres clés, entonnoir, métiers, avis d'ouverture, export CSV.

const PERIODES = [
  { v: 7, l: "7 jours" },
  { v: 30, l: "30 jours" },
  { v: 90, l: "90 jours" },
  { v: 0, l: "Tout" },
] as const;

const NIVEAUX = [
  { k: "moderee", l: "Modérée", c: "bg-[#9fd1c9]" },
  { k: "marquee", l: "Marquée", c: "bg-[#e9b872]" },
  { k: "forte", l: "Forte", c: "bg-[#d9824f]" },
] as const;

export function DiagnosticsAdmin({
  diagnostics,
  evenements,
  notifications,
  metiers,
}: {
  diagnostics: LigneDiagnostic[];
  evenements: (Evenement & { created_at: string })[];
  notifications: Notification[];
  metiers: Record<string, string>;
}) {
  const [periode, setPeriode] = React.useState<number>(30);
  // Date limite calculée une fois par choix de période (pas pendant le rendu).
  const [depuis, setDepuis] = React.useState<string | null>(null);
  React.useEffect(() => {
    const t = setTimeout(() => setDepuis(periode ? new Date(Date.now() - periode * 86400_000).toISOString() : null), 0);
    return () => clearTimeout(t);
  }, [periode]);

  const dans = React.useCallback(<T extends { created_at: string }>(l: T[]) => (depuis ? l.filter((x) => x.created_at >= depuis) : l), [depuis]);
  const lignes = React.useMemo(() => dans(diagnostics), [dans, diagnostics]);
  const notifs = React.useMemo(() => dans(notifications), [dans, notifications]);
  const etapes = React.useMemo(() => entonnoir(compter(dans(evenements))), [dans, evenements]);
  const libelle = React.useCallback((id: string) => metiers[id] ?? id, [metiers]);
  const repartition = React.useMemo(() => parMetier(lignes, notifs, libelle), [lignes, notifs, libelle]);
  const autres = React.useMemo(() => metiersAutres(lignes), [lignes]);

  const emails = lignes.filter((l) => l.email).length;
  const consentements = lignes.filter((l) => l.consentement_emails).length;
  const clics = lignes.filter((l) => l.a_clique_formation).length;
  const pc = (n: number, d: number) => (d ? ` (${Math.round((n / d) * 100)} %)` : "");

  function exporter() {
    const url = URL.createObjectURL(new Blob([versCsv(lignes, libelle)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Période" className="inline-flex rounded-md border bg-background p-0.5">
          {PERIODES.map((p) => (
            <button
              key={p.v}
              type="button"
              role="radio"
              aria-checked={periode === p.v}
              onClick={() => setPeriode(p.v)}
              className={cn("rounded px-3 py-1.5 text-sm", periode === p.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {p.l}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={exporter} disabled={!lignes.length}>
          <DownloadIcon /> Export CSV ({lignes.length})
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Diagnostics terminés", String(lignes.length)],
          ["Emails laissés", `${emails}${pc(emails, lignes.length)}`],
          ["Accord pour les emails", `${consentements}${pc(consentements, lignes.length)}`],
          ["Clics sur la formation", String(clics)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-md border bg-background p-4">
            <p className="text-caption text-muted-foreground">{l}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <Section title="Où les visiteurs s'arrêtent">
        <p className="text-sm text-muted-foreground">
          Chaque barre compte les visiteurs arrivés à cette étape. « Perte » : part de ceux de l&apos;étape précédente qui ne sont pas allés plus loin.
        </p>
        {etapes[0].nombre === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun démarrage sur cette période.</p>
        ) : (
          <ol className="space-y-2">
            {etapes.map((e) => (
              <li key={e.libelle} className="grid grid-cols-[10rem_1fr_7rem] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_8rem]">
                <span>{e.libelle}</span>
                <span className="h-6 overflow-hidden rounded bg-muted">
                  <span className="block h-full rounded bg-primary/80" style={{ width: `${e.part ?? 0}%` }} />
                </span>
                <span className="text-right tabular-nums">
                  {e.nombre}
                  {e.perte !== null && e.perte > 0 && <span className="text-muted-foreground"> · −{e.perte} %</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Par métier">
        {repartition.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun diagnostic sur cette période.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-caption text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Métier</th>
                  <th className="px-3 py-2 text-right font-medium">Diagnostics</th>
                  <th className="px-3 py-2 text-right font-medium">Emails</th>
                  <th className="px-3 py-2 text-right font-medium">Accords</th>
                  <th className="px-3 py-2 text-right font-medium">Score moyen</th>
                  <th className="px-3 py-2 text-left font-medium">Exposition</th>
                  <th className="px-3 py-2 text-right font-medium">À prévenir à l&apos;ouverture</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {repartition.map((r) => (
                  <tr key={r.metier}>
                    <td className="px-3 py-2.5">{r.metier}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.diagnostics}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.emails}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.consentements}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.scoreMoyen ?? "–"}</td>
                    <td className="px-3 py-2.5">
                      {r.diagnostics > 0 && (
                        <span className="flex h-2.5 w-28 overflow-hidden rounded-full bg-muted" title={NIVEAUX.map((n) => `${n.l} : ${r.niveaux[n.k]}`).join(" · ")}>
                          {NIVEAUX.map((n) => (
                            <span key={n.k} className={n.c} style={{ width: `${(r.niveaux[n.k] / r.diagnostics) * 100}%` }} />
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.notifications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex flex-wrap gap-4 text-caption text-muted-foreground">
          {NIVEAUX.map((n) => (
            <span key={n.k} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", n.c)} /> Exposition {n.l.toLowerCase()}
            </span>
          ))}
        </p>
      </Section>

      <Section title="Métiers saisis dans « Autre »">
        {autres.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun sur cette période.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {autres.map((a) => (
              <li key={a.libelle} className="rounded-full border bg-background px-3 py-1 text-sm">
                {a.libelle} <span className="text-muted-foreground tabular-nums">· {a.nombre}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
