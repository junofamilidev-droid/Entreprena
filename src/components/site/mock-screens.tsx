"use client";

import { CheckIcon, MailIcon, PaperclipIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exemple } from "@/lib/vitrine/exemples";

// Écrans de la plateforme, dessinés en code (et non capturés) pour s'adapter au métier choisi.
// Même langage que la vraie session : cartes blanches, petites étiquettes, teinte bleu-vert.
// Le changement de métier se fait en fondu (clé = métier).

const card = "rounded-[14px] bg-[oklch(0.99_0.003_85)] p-4 text-left text-[oklch(0.22_0.02_200)] sm:p-5";
const tag = "text-[0.6875rem] font-medium text-[oklch(0.5_0.02_200)]";

export function MockMission({ ex, className }: { ex: Exemple; className?: string }) {
  return (
    <div key={ex.id} className={cn(card, "mock-in", className)}>
      <p className={tag}>La mission</p>
      <div className="mt-3 rounded-[10px] bg-[oklch(0.95_0.025_200)] p-3">
        <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-[oklch(0.38_0.07_200)]">
          <MailIcon className="size-3.5" aria-hidden /> {ex.mission.de}
        </p>
        <p className="mt-1 text-[0.8125rem] font-semibold">{ex.mission.objet}</p>
      </div>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-[oklch(0.3_0.02_200)]">« {ex.mission.message} »</p>
      <p className="mt-3 flex items-center gap-1.5 border-t border-[oklch(0.92_0.005_200)] pt-3 text-[0.75rem] text-[oklch(0.45_0.02_200)]">
        <PaperclipIcon className="size-3.5" aria-hidden /> Livrable : {ex.mission.livrable}
      </p>
    </div>
  );
}

export function MockOutil({ ex, className }: { ex: Exemple; className?: string }) {
  return (
    <div key={ex.id} className={cn(card, "mock-in", className)}>
      <div className="flex items-center justify-between">
        <p className={tag}>L&apos;outil · {ex.outil.nom}</p>
        <span className="flex items-center gap-1.5 text-[0.6875rem] text-[oklch(0.45_0.06_200)]">
          <span className="size-1.5 rounded-full bg-[oklch(0.55_0.09_200)]" aria-hidden /> Installé
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ex.outil.regles.map((r, i) => (
          <span
            key={r}
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.6875rem] font-medium",
              i === ex.outil.regleActive ? "bg-[oklch(0.3_0.05_200)] text-white" : "border border-[oklch(0.9_0.005_200)] text-[oklch(0.4_0.02_200)]",
            )}
          >
            {i === ex.outil.regleActive && "✓ "}
            {r}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[0.75rem] leading-snug">
        <div className="rounded-[10px] bg-[oklch(0.95_0.04_165)] p-2.5">
          <p className="font-semibold text-[oklch(0.4_0.08_165)]">Avec la règle</p>
          <p className="mt-1 text-[oklch(0.32_0.03_165)]">{ex.outil.avec}</p>
        </div>
        <div className="rounded-[10px] bg-[oklch(0.95_0.04_75)] p-2.5">
          <p className="font-semibold text-[oklch(0.45_0.09_60)]">Sans la règle</p>
          <p className="mt-1 text-[oklch(0.38_0.04_60)]">{ex.outil.sans}</p>
        </div>
      </div>
    </div>
  );
}

export function MockVerifs({ ex, className }: { ex: Exemple; className?: string }) {
  return (
    <div key={ex.id} className={cn(card, "mock-in", className)}>
      <p className={tag}>Vos vérifications</p>
      <ul className="mt-3 space-y-1.5">
        {ex.verifs.map((v) => (
          <li key={v} className="flex items-center justify-between gap-3 rounded-[8px] bg-[oklch(0.96_0.02_165)] px-2.5 py-2 text-[0.75rem]">
            <span className="flex items-center gap-2">
              <span className="grid size-4 place-items-center rounded-full bg-[oklch(0.55_0.11_165)] text-white">
                <CheckIcon className="size-2.5" aria-hidden />
              </span>
              {v}
            </span>
            <span className="text-[0.6875rem] text-[oklch(0.5_0.06_165)]">vérifié</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MockFiche({ ex, className }: { ex: Exemple; className?: string }) {
  return (
    <div key={ex.id} className={cn(card, "mock-in", className)}>
      <div className="flex items-center justify-between">
        <p className={tag}>Votre fiche</p>
        <span className="rounded-full bg-[oklch(0.95_0.025_200)] px-2 py-0.5 text-[0.6875rem] text-[oklch(0.4_0.07_200)]">Rangée dans votre boîte à outils</span>
      </div>
      <p className="mt-2 text-[0.875rem] font-semibold">{ex.fiche.titre}</p>
      <ol className="mt-2 space-y-1 text-[0.75rem] text-[oklch(0.35_0.02_200)]">
        {ex.fiche.etapes.map((s, i) => (
          <li key={s} className="flex gap-2">
            <span className="text-[oklch(0.5_0.06_200)]">{i + 1}.</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 rounded-[8px] bg-[oklch(0.96_0.04_80)] px-2.5 py-2 text-[0.6875rem] text-[oklch(0.42_0.08_60)]">
        <TriangleAlertIcon className="size-3.5" aria-hidden /> Piège : {ex.fiche.piege}
      </p>
    </div>
  );
}
