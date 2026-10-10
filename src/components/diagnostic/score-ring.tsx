"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const config = { score: { label: "Score", color: "var(--brand)" } } satisfies ChartConfig;

// Un seul chiffre à lire : un anneau de progression, sans légende, avec la valeur au centre.
export function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <div className="relative size-44 shrink-0" role="img" aria-label={`${label} : ${score} sur 100, estimation`}>
      <ChartContainer config={config} className="aspect-square size-44">
        <RadialBarChart
          data={[{ name: "score", value: score, fill: "var(--color-score)" }]}
          startAngle={90}
          endAngle={-270}
          innerRadius="78%"
          outerRadius="100%"
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={8} isAnimationActive={false} />
        </RadialBarChart>
      </ChartContainer>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-serif text-5xl font-semibold tabular-nums leading-none">{score}</p>
          <p className="mt-1.5 text-caption leading-tight text-muted-foreground">sur 100<br />estimation</p>
        </div>
      </div>
    </div>
  );
}
