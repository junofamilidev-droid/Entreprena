import type { Metadata } from "next";
import { ArrowRightIcon, ClockIcon, LayersIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TestBanner } from "@/components/test-banner";
import { LessonDemo } from "./lesson-demo";
import course from "../../../content/auditeur-augmente/cours-module-1.json";

// Page de démonstration du style, à valider avant la construction des pages.
// Le contenu de la leçon vient ici du fichier JSON ; dans la plateforme, il viendra de la base.
export const metadata: Metadata = { title: "Charte graphique", robots: { index: false } };

const swatches = [
  { name: "Marque", token: "bg-brand", note: "Boutons principaux, progression, liens" },
  { name: "Marque douce", token: "bg-brand-soft", note: "Surlignage, fonds d'accent" },
  { name: "Texte", token: "bg-foreground", note: "Titres et corps" },
  { name: "Texte secondaire", token: "bg-muted-foreground", note: "Légendes, métadonnées" },
  { name: "Bordure", token: "bg-border", note: "Séparations, cartes" },
  { name: "Fond", token: "bg-background border", note: "Fond de page" },
];

const typeScale = [
  { cls: "text-display", label: "Display · Source Serif", sample: "Devenez l'auditeur que l'IA rend meilleur" },
  { cls: "text-title", label: "Titre · Source Serif", sample: "Revue analytique assistée par l'IA" },
  { cls: "text-heading", label: "Intertitre · Source Serif", sample: "Trois questions, dans cet ordre" },
  { cls: "text-lead", label: "Chapeau · Inter", sample: "Une revue analytique complète, sur une balance de 81 comptes, en moins d'une heure." },
  { cls: "text-body", label: "Corps · Inter", sample: "Coller la balance d'un client dans un assistant grand public, c'est envoyer ces informations sur les serveurs d'un tiers." },
  { cls: "text-caption text-muted-foreground", label: "Légende · Inter", sample: "6 min de lecture · Leçon 1 sur 4" },
  { cls: "text-kicker text-brand", label: "Surtitre · Inter", sample: "Module 1" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-8">
      <div className="space-y-2">
        <h2 id={id} className="text-heading">{title}</h2>
        <Separator />
      </div>
      {children}
    </section>
  );
}

export default function StylePage() {
  const m1 = course.modules[0];
  const l1 = m1.lecons[0];
  const screens = [
    ...l1.cartes.slice(0, 3).map((c, i) => ({
      kind: "lesson" as const,
      kicker: `Leçon 1 · écran ${i + 1}`,
      title: c.titre,
      html: c.html,
    })),
    {
      kind: "quiz" as const,
      question: l1.quiz[0].q,
      options: l1.quiz[0].opts,
      answer: l1.quiz[0].ok,
      explanation: l1.quiz[0].exp,
    },
    { kind: "recap" as const, text: l1.retenir },
  ];

  return (
    <>
      <TestBanner />
      <main className="mx-auto w-full max-w-5xl space-y-24 px-4 py-16 sm:px-8 sm:py-24">
        <header className="max-w-2xl space-y-5">
          <p className="text-kicker text-brand">Charte graphique · à valider</p>
          <h1 className="text-display">Sobre, lisible, sérieux.</h1>
          <p className="text-lead text-muted-foreground">
            Une seule couleur de marque, trois typographies, beaucoup d&apos;espace. Cette page
            réunit tout ce qui servira à construire la plateforme.
          </p>
        </header>

        <Section id="couleurs" title="Couleurs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {swatches.map((s) => (
              <div key={s.name} className="space-y-3">
                <div className={`h-20 rounded-lg ${s.token}`} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-caption text-muted-foreground">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="typo" title="Typographie">
          <div className="space-y-10">
            {typeScale.map((t) => (
              <div key={t.label} className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
                <p className="pt-1 font-mono text-caption text-muted-foreground">{t.label}</p>
                <p className={t.cls}>{t.sample}</p>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
              <p className="pt-1 font-mono text-caption text-muted-foreground">Chiffres · JetBrains Mono</p>
              <p className="font-mono text-body tabular-nums">411000 · Clients · 2 660 000 · +34,0 %</p>
            </div>
          </div>
        </Section>

        <Section id="boutons" title="Boutons et étiquettes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">
              Commencer le module <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline">Faire mon diagnostic</Button>
            <Button size="lg" variant="secondary">Voir le plan</Button>
            <Button size="lg" variant="ghost">Plus tard</Button>
            <Button size="lg" disabled>
              <LockIcon /> Bientôt disponible
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Disponible</Badge>
            <Badge variant="secondary">Bientôt</Badge>
            <Badge variant="outline">Juniors et seniors</Badge>
            <Badge variant="outline" className="border-brand/30 bg-brand-soft text-accent-foreground">
              Estimation
            </Badge>
          </div>
        </Section>

        <Section id="cartes" title="Cartes">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="gap-5 transition-shadow hover:shadow-md">
              <CardHeader>
                <p className="text-kicker text-brand">Audit</p>
                <CardTitle className="text-heading">Auditeur augmenté par l&apos;IA</CardTitle>
                <CardDescription className="text-body">
                  Utiliser un assistant IA sur une mission d&apos;audit, sans exposer de
                  donnée client, et rendre un travail qu&apos;un relecteur accepte.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><LayersIcon className="size-3.5" /> 5 modules</span>
                <span className="inline-flex items-center gap-1.5"><ClockIcon className="size-3.5" /> environ 1 h 30 par module</span>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full sm:w-auto">
                  Découvrir la formation <ArrowRightIcon />
                </Button>
              </CardFooter>
            </Card>

            <Card className="gap-5 border-dashed bg-muted/30 shadow-none">
              <CardHeader>
                <p className="text-kicker text-muted-foreground">Prochainement</p>
                <CardTitle className="text-heading text-muted-foreground">D&apos;autres métiers</CardTitle>
                <CardDescription className="text-body">
                  Le catalogue s&apos;enrichira formation par formation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Bientôt</Badge>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="formulaires" title="Champs de saisie">
          <div className="grid max-w-xl gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="prenom.nom@cabinet.fr" />
              <p className="text-caption text-muted-foreground">
                Utilisée uniquement pour votre compte et le suivi de votre progression.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="retire">Ce que j&apos;ai retiré</Label>
              <Textarea id="retire" rows={4} placeholder="Listez chaque élément identifiant et où vous l'avez trouvé." />
            </div>
          </div>
        </Section>

        <Section id="lecon" title="Écran de leçon">
          <p className="max-w-2xl text-body text-muted-foreground">
            Vrai contenu du module 1. Essayez : Continuer, puis répondez à la question.
          </p>
          <LessonDemo moduleTitle={`Module 1 · ${m1.titre}`} lessonTitle={l1.titre} screens={screens} />
        </Section>
      </main>
    </>
  );
}
