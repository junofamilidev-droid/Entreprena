import Link from "next/link";
import { ArrowRightIcon, LayersIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormationWithModules } from "@/lib/content/types";

export function FormationCard({ formation }: { formation: FormationWithModules }) {
  const open = formation.modules.filter((m) => m.availability === "open").length;
  return (
    <Card className="group relative gap-5 transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-kicker text-brand">{formation.domain}</p>
          {open > 0 && <Badge variant="outline" className="border-brand/25 bg-brand-soft text-accent-foreground">Ouverte en test</Badge>}
        </div>
        <CardTitle className="text-heading">
          <Link href={`/formations/${formation.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {formation.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-body">{formation.promise}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UsersIcon className="size-3.5" aria-hidden /> {formation.audience}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LayersIcon className="size-3.5" aria-hidden /> {formation.modules.length} modules
          {open > 0 && open < formation.modules.length ? `, dont ${open} ouvert${open > 1 ? "s" : ""}` : ""}
        </span>
      </CardContent>
      <CardFooter>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          Découvrir la formation
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </CardFooter>
    </Card>
  );
}
