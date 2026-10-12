import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ambiances } from "./ambiances";

export const metadata: Metadata = { title: "Choisir une ambiance", robots: { index: false } };

export default function AmbiancesIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16">
      <div className="space-y-2">
        <h1 className="text-title">Quatre ambiances, un même écran</h1>
        <p className="text-body text-muted-foreground">
          Le tableau de bord de l&apos;apprenant, avec un avancement fictif. Seuls les couleurs, les
          typographies et les arrondis changent.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ambiances.map((a, i) => (
          <Link key={a.id} href={`/ambiances/${a.id}`} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardDescription>Ambiance {i + 1}</CardDescription>
                <CardTitle className="flex items-center justify-between gap-2">
                  {a.name} <ArrowRightIcon className="size-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{a.text}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
