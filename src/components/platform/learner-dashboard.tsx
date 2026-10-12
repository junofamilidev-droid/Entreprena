"use client";

import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CheckIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FileCheck2Icon,
  FlagIcon,
  ListChecksIcon,
  LockIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import type { FormationWithModules, StepKind } from "@/lib/content/types";
import type { DemoStep } from "./types";

const kindIcon: Record<StepKind, typeof BookOpenTextIcon> = {
  lesson: BookOpenTextIcon,
  quiz: ListChecksIcon,
  exercise: ClipboardListIcon,
  self_review: FileCheck2Icon,
  module_end: FlagIcon,
};

const kindLabel: Record<StepKind, string> = {
  lesson: "Leçon",
  quiz: "Questions",
  exercise: "Exercice guidé",
  self_review: "Auto-correction",
  module_end: "Fin du module",
};

export function LearnerDashboard({
  formation,
  steps,
}: {
  formation: FormationWithModules;
  steps: DemoStep[];
}) {
  const mod = formation.modules.find((m) => m.availability === "open")!;
  const others = formation.modules.filter((m) => m.id !== mod.id);
  const done = steps.filter((s) => s.state === "done").length;
  const current = steps.find((s) => s.state === "current") ?? steps[0];
  const currentIndex = steps.indexOf(current);
  const pct = Math.round((done / steps.length) * 100);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">{formation.title}</BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
          Version de test
        </Badge>
      </header>

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 md:py-10">
        <div className="space-y-1">
          <h1 className="text-title">Bonjour</h1>
          <p className="text-body text-muted-foreground">Reprenez là où vous vous êtes arrêté.</p>
        </div>

        {/* Reprendre */}
        <Card className="gap-0 overflow-hidden p-0">
          <div className="grid md:grid-cols-[1fr_15rem]">
            <div className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">
                  Module {mod.position} · {mod.title}
                </p>
                <h2 className="text-heading">{current.title}</h2>
                <p className="text-caption text-muted-foreground">
                  {kindLabel[current.kind]} · {current.meta}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg">
                  Reprendre <ArrowRightIcon />
                </Button>
                <Button size="lg" variant="ghost">
                  Voir le sommaire
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3 border-t bg-muted/40 p-6 md:border-t-0 md:border-l">
              <div className="flex items-baseline justify-between">
                <span className="text-caption text-muted-foreground">Avancement du module</span>
                <span className="font-mono text-sm tabular-nums">{pct}&nbsp;%</span>
              </div>
              <Progress value={pct} className="h-2 bg-muted" />
              <p className="text-caption text-muted-foreground">
                Étape {currentIndex + 1} sur {steps.length}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          {/* Sommaire du module */}
          <Card className="gap-0 pb-2">
            <CardHeader className="border-b pb-4">
              <CardTitle>Sommaire du module {mod.position}</CardTitle>
              <CardDescription>{mod.durationLabel}</CardDescription>
            </CardHeader>
            <ol className="divide-y">
              {steps.map((s, i) => {
                const Icon = kindIcon[s.kind];
                return (
                  <li
                    key={s.title}
                    className={cn(
                      "flex items-center gap-4 px-6 py-3.5",
                      s.state === "current" && "bg-accent/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                        s.state === "done" && "border-primary bg-primary text-primary-foreground",
                        s.state === "current" && "border-primary text-primary",
                        s.state === "todo" && "text-muted-foreground",
                      )}
                    >
                      {s.state === "done" ? <CheckIcon className="size-3.5" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", s.state === "current" ? "font-medium" : s.state === "todo" && "text-muted-foreground")}>
                        {s.title}
                      </p>
                      <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden /> {kindLabel[s.kind]} · {s.meta}
                      </p>
                    </div>
                    {s.state === "current" && <Badge>En cours</Badge>}
                  </li>
                );
              })}
            </ol>
          </Card>

          <div className="space-y-6">
            <Card className="gap-3">
              <CardHeader>
                <CardDescription>Votre diagnostic</CardDescription>
                <CardTitle className="font-serif text-3xl tabular-nums">
                  84 <span className="text-base font-normal text-muted-foreground">/ 100</span>
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="font-normal">Estimation</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="text-caption text-muted-foreground">
                Exposition forte. Point d&apos;entrée conseillé : module 1, exercice.
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">Revoir mon résultat</Button>
              </CardFooter>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardDescription>Votre livrable</CardDescription>
                <CardTitle>Feuille de travail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={0} className="h-1.5 bg-muted" />
                <p className="text-caption text-muted-foreground">0 rubrique sur 6 remplie · se construit pendant l&apos;exercice</p>
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle>Tuteur IA</CardTitle>
                <CardDescription>Un assistant externe, pour un indice si vous bloquez. Il ne donne pas les réponses.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Ouvrir le tuteur <ExternalLinkIcon />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Suite de la formation */}
        <section className="space-y-4">
          <h2 className="text-heading">Suite de la formation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {others.map((m) => (
              <Card key={m.id} className="gap-2 py-5 shadow-none">
                <CardHeader className="px-5">
                  <CardDescription className="flex items-center gap-1.5">
                    <LockIcon className="size-3.5" /> Module {m.position} · à venir
                  </CardDescription>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 text-caption text-muted-foreground">{m.deliverable}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
