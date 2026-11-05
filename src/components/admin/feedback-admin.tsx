"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Section } from "./kit";
import { setFeedbackStatus } from "@/lib/feedback/actions";
import { FREE_TYPES, PRICE, SCREENS, STATUTS, type Answer, type Statut } from "@/lib/feedback/questions";
import { MIN_SAMPLE, euros, multiRanking, priceStats, recoStats, scaleAverages, toCsv, type FeedbackRow } from "@/lib/feedback/stats";

export interface Author {
  user_id: string;
  email: string;
  display_name: string | null;
}

const fmtDate = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const typeLabel = (t: string | null) => FREE_TYPES.find((x) => x.value === t)?.label ?? null;
const statutLabel = (s: Statut) => STATUTS.find((x) => x.value === s)?.label ?? s;

type NoteFilter = "toutes" | "0-6" | "7-8" | "9-10";

function Tile({ value, label, hint }: { value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  );
}

function PriceBlock({ title, values }: { title: string; values: Answer[] }) {
  const s = priceStats(values as (number | string | undefined)[]);
  const maxBucket = Math.max(1, ...s.tranches.map((t) => t.n));
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <p className="font-medium">{title}</p>
      {s.tropPetit && (
        <p className="rounded-md bg-warning/10 px-3 py-2 text-sm">
          Échantillon trop petit pour conclure ({s.repondants} réponse{s.repondants > 1 ? "s" : ""} sur {MIN_SAMPLE} minimum).
        </p>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Répondants</dt>
        <dd className="tabular-nums">{s.repondants}</dd>
        <dt className="text-muted-foreground">Médiane</dt>
        <dd className="font-semibold tabular-nums">{euros(s.mediane)}</dd>
        <dt className="text-muted-foreground">Quartiles (Q1 – Q3)</dt>
        <dd className="tabular-nums">{s.q1 === null ? "—" : `${euros(s.q1)} – ${euros(s.q3)}`}</dd>
        <dt className="text-muted-foreground">Refus de payer</dt>
        <dd className="tabular-nums">{s.refus}</dd>
      </dl>
      <ul className="space-y-1.5">
        {s.tranches.map((t) => (
          <li key={t.label} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{t.label}</span>
            <Bar pct={(t.n / maxBucket) * 100} />
            <span className="text-right tabular-nums">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const priceText = (v: Answer) => (v === undefined ? "—" : v === PRICE.refus ? "Refus" : euros(v as number));

function answerText(v: Answer) {
  if (v === undefined) return null;
  if (v === PRICE.refus) return "Je ne paierais pas pour cela";
  if (Array.isArray(v)) return v.join(" · ");
  return String(v);
}

function Detail({ row, author, formation, onStatus }: { row: FeedbackRow; author?: Author; formation?: string; onStatus: (s: Statut) => void }) {
  const a = row.answers ?? {};
  return (
    <div className="space-y-6 px-4 pb-8">
      <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Auteur</dt>
        <dd>
          {author?.display_name || "—"} <span className="text-muted-foreground">{author?.email}</span>
        </dd>
        <dt className="text-muted-foreground">Formation</dt>
        <dd>{formation ?? "—"}</dd>
        <dt className="text-muted-foreground">Envoyé le</dt>
        <dd>{fmtDate(row.created_at)}</dd>
        <dt className="text-muted-foreground">Depuis la page</dt>
        <dd className="font-mono text-xs">{row.page_origine ?? "—"}</dd>
      </dl>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Statut">
        {STATUTS.map((s) => (
          <Button key={s.value} size="sm" variant={row.statut === s.value ? "default" : "outline"} role="radio" aria-checked={row.statut === s.value} onClick={() => onStatus(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      {row.mode === "libre" ? (
        <div className="space-y-2">
          {typeLabel(row.type) && <p className="text-sm font-medium">{typeLabel(row.type)}</p>}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{row.message}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Tile value={row.reco ?? "—"} label="Recommandation" />
            <Tile value={priceText(a.prix_general)} label="Prix en général" />
            <Tile value={priceText(a.prix_ici)} label="Prix de cette formation" />
          </div>
          {SCREENS.map((s) => {
            const items = s.questions.flatMap((q) => {
              const out: { label: string; value: string }[] = [];
              const v = answerText(q.kind === "price" && typeof a[q.id] === "number" ? euros(a[q.id] as number) : a[q.id]);
              if (v) out.push({ label: q.label.replace("{formation}", formation ?? "cette formation"), value: v });
              if (q.kind === "multi" && q.other && typeof a[q.other.id] === "string") out.push({ label: `${q.other.option} : ${q.other.label}`, value: a[q.other.id] as string });
              return out;
            });
            if (!items.length) return null;
            return (
              <section key={s.id} className="space-y-2">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <dl className="space-y-2 text-sm">
                  {items.map((it) => (
                    <div key={it.label}>
                      <dt className="text-muted-foreground">{it.label}</dt>
                      <dd className="whitespace-pre-wrap">{it.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FeedbackAdmin({ rows: initial, authors, formations }: { rows: FeedbackRow[]; authors: Author[]; formations: { id: string; title: string }[] }) {
  const [rows, setRows] = React.useState(initial);
  const [mode, setMode] = React.useState<"tous" | "libre" | "formulaire">("tous");
  const [statut, setStatut] = React.useState<"tous" | Statut>("tous");
  const [note, setNote] = React.useState<NoteFilter>("toutes");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const byAuthor = React.useMemo(() => new Map(authors.map((a) => [a.user_id, a])), [authors]);
  const byFormation = React.useMemo(() => new Map(formations.map((f) => [f.id, f.title])), [formations]);

  const forms = rows.filter((r) => r.mode === "formulaire");
  const answers = forms.map((r) => r.answers ?? {});
  const reco = recoStats(forms.map((r) => r.reco).filter((x): x is number => x !== null));
  const averages = scaleAverages(answers);
  const formats = multiRanking(answers, "q_formats_souhaites");

  const shown = rows.filter((r) => {
    if (mode !== "tous" && r.mode !== mode) return false;
    if (statut !== "tous" && r.statut !== statut) return false;
    if (note !== "toutes") {
      if (r.reco === null) return false;
      const [lo, hi] = note.split("-").map(Number);
      if (r.reco < lo || r.reco > hi) return false;
    }
    return true;
  });
  const open = rows.find((r) => r.id === openId) ?? null;

  async function changeStatus(id: string, s: Statut) {
    const before = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, statut: s } : r)));
    const res = await setFeedbackStatus(id, s);
    if (!res.ok) {
      setRows(before);
      toast.error(res.error);
    }
  }

  function exportCsv() {
    const csv = toCsv(shown, new Map(authors.map((a) => [a.user_id, { email: a.email, name: a.display_name ?? "" }])), byFormation);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `avis-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const select = "h-9 rounded-md border bg-background px-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile value={rows.length} label="Avis reçus" hint={`${forms.length} questionnaire${forms.length > 1 ? "s" : ""}, ${rows.length - forms.length} message${rows.length - forms.length > 1 ? "s" : ""} libre${rows.length - forms.length > 1 ? "s" : ""}`} />
        <Tile value={reco.pctReco === null ? "—" : `${reco.pctReco} %`} label="Recommande (note ≥ 8)" hint="Seuil à confirmer" />
        <Tile value={reco.nps === null ? "—" : reco.nps > 0 ? `+${reco.nps}` : reco.nps} label="NPS" hint={reco.n ? `% de 9-10 moins % de 0-6, sur ${reco.n} note${reco.n > 1 ? "s" : ""}` : "Aucune note pour l'instant"} />
      </div>

      <Section title="Moyennes par thème (1 à 5)">
        {forms.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun questionnaire pour l&apos;instant.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {averages.map((t) => (
              <div key={t.theme} className="space-y-2">
                <p className="text-sm font-medium">{t.theme}</p>
                <ul className="space-y-2">
                  {t.questions.map((q) => (
                    <li key={q.id} className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{q.label}</span>
                        <span className="shrink-0 tabular-nums">{q.moyenne === null ? "—" : q.moyenne.toFixed(1).replace(".", ",")} <span className="text-caption text-muted-foreground">({q.n})</span></span>
                      </div>
                      <Bar pct={q.moyenne === null ? 0 : ((q.moyenne - 1) / 4) * 100} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Formats les plus demandés">
        {formats.repondants === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune réponse pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-1.5">
            {formats.items.map((f) => (
              <li key={f.option} className="grid grid-cols-[1fr_8rem_6rem] items-center gap-3 text-sm">
                <span>{f.option}</span>
                <Bar pct={f.pct} />
                <span className="text-right tabular-nums">
                  {f.n} · {f.pct} %
                </span>
              </li>
            ))}
            <li className="pt-1 text-caption text-muted-foreground">Sur {formats.repondants} personne{formats.repondants > 1 ? "s" : ""} ayant répondu.</li>
          </ul>
        )}
      </Section>

      <Section title="Prix">
        <div className="grid gap-4 md:grid-cols-2">
          <PriceBlock title="Pour une formation en ligne sur son métier" values={answers.map((a) => a.prix_general)} />
          <PriceBlock title="Pour cette formation" values={answers.map((a) => a.prix_ici)} />
        </div>
      </Section>

      <Section
        title={`Avis (${shown.length})`}
        aside={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!shown.length}>
            <DownloadIcon /> Export CSV
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filtrer par mode" className={select} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="tous">Tous les modes</option>
            <option value="libre">Message libre</option>
            <option value="formulaire">Questionnaire</option>
          </select>
          <select aria-label="Filtrer par statut" className={select} value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}>
            <option value="tous">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select aria-label="Filtrer par note" className={select} value={note} onChange={(e) => setNote(e.target.value as NoteFilter)}>
            <option value="toutes">Toutes les notes</option>
            <option value="0-6">0 à 6</option>
            <option value="7-8">7 à 8</option>
            <option value="9-10">9 à 10</option>
          </select>
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun avis {rows.length ? "pour ces filtres" : "pour l'instant"}.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {shown.map((r) => {
              const au = byAuthor.get(r.user_id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(r.id);
                      if (r.statut === "nouveau") void changeStatus(r.id, "lu");
                    }}
                    className="grid w-full grid-cols-[7rem_1fr_auto] items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="text-caption text-muted-foreground">{fmtDate(r.created_at)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {au?.display_name || au?.email || "Compte inconnu"}
                        <span className="ml-2 font-normal text-muted-foreground">{r.mode === "libre" ? typeLabel(r.type) ?? "Message libre" : `Questionnaire · note ${r.reco}`}</span>
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {r.mode === "libre" ? r.message : (r.answers?.t_pourquoi as string) || (r.answers?.t_idees as string) || "—"}
                      </span>
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-caption", r.statut === "nouveau" ? "bg-primary text-primary-foreground" : r.statut === "lu" ? "bg-muted" : "bg-success/15 text-success")}>
                      {statutLabel(r.statut)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-[32rem] overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.mode === "libre" ? "Message libre" : `Questionnaire · note ${open.reco} / 10`}</SheetTitle>
                <SheetDescription>{fmtDate(open.created_at)}</SheetDescription>
              </SheetHeader>
              <Detail row={open} author={byAuthor.get(open.user_id)} formation={open.formation_id ? byFormation.get(open.formation_id) : undefined} onStatus={(s) => changeStatus(open.id, s)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
