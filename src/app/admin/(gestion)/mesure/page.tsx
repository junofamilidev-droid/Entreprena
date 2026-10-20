import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Crumbs, Section } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/admin/guard";
import { formatSeconds } from "@/lib/sessions/progress";

interface Stat {
  session_key: string;
  started: number;
  completed: number;
  avg_duration_sec: number | null;
  avg_gain_sec: number | null;
  avg_score_pct: number | null;
}

async function Stats() {
  const { client } = await requireAdmin();
  const [{ data: stats, error }, { data: sessions }] = await Promise.all([
    client.from("session_stats").select("*"),
    client.from("sessions").select("number, title, modules(slug, position, formations(slug))"),
  ]);
  // Libellé lisible de chaque clé « formation/module/session-n ».
  const titles = new Map(
    (sessions ?? []).map((s) => {
      const m = s.modules as unknown as { slug: string; position: number; formations: { slug: string } };
      return [`${m.formations.slug}/${m.slug}/session-${s.number}`, `Module ${m.position} · session ${s.number} : ${s.title}`];
    }),
  );
  const rows = ((stats ?? []) as Stat[]).sort((a, b) => a.session_key.localeCompare(b.session_key));
  const cell = "px-3 py-2.5 text-right tabular-nums";

  if (error) return <p className="text-sm text-destructive">Lecture de la mesure impossible : {error.message}</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Aucune session commencée pour l&apos;instant. Les chiffres apparaîtront dès le premier apprenant.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-caption text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Session</th>
            <th className="px-3 py-2 text-right font-medium">Commencée</th>
            <th className="px-3 py-2 text-right font-medium">Terminée</th>
            <th className="px-3 py-2 text-right font-medium">Durée réelle moyenne</th>
            <th className="px-3 py-2 text-right font-medium">Gain moyen</th>
            <th className="px-3 py-2 text-right font-medium">Réponses trouvées</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.session_key}>
              <td className="px-3 py-2.5">{titles.get(r.session_key) ?? <span className="font-mono">{r.session_key}</span>}</td>
              <td className={cell}>{r.started}</td>
              <td className={cell}>
                {r.completed}
                {r.started > 0 && <span className="text-muted-foreground"> ({Math.round((r.completed / r.started) * 100)} %)</span>}
              </td>
              <td className={cell}>{r.avg_duration_sec != null ? formatSeconds(r.avg_duration_sec) : "–"}</td>
              <td className={cell}>{r.avg_gain_sec != null ? formatSeconds(r.avg_gain_sec) : "–"}</td>
              <td className={cell}>{r.avg_score_pct != null ? `${r.avg_score_pct} %` : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Guarded() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Mesure des sessions" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Mesure des sessions</h1>
        <p className="text-body text-muted-foreground">
          Mesure anonyme : aucun nom ni compte n&apos;est enregistré, seulement un identifiant tiré au hasard dans chaque navigateur
          pour compter les apprenants distincts. Les aperçus de l&apos;espace réservé ne sont pas comptés.
        </p>
      </div>
      <Section title="Par session">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <Stats />
        </Suspense>
      </Section>
    </div>
  );
}

export default function MeasurePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Guarded />
    </Suspense>
  );
}
