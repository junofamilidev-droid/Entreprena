import Image from "next/image";
import Link from "next/link";
import type { FormationWithModules } from "@/lib/content/types";
import { plain } from "@/lib/vitrine/text";

// Formation mise en avant sur l'accueil : sa promesse, ses modules et leur disponibilité, une capture.
export function FormationFeature({ formation }: { formation: FormationWithModules }) {
  return (
    <article className="grid overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_40px_80px_-50px_rgb(20_60_60/0.45)] lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col p-6 sm:p-10">
        <p className="inline-flex items-center gap-2.5 self-start text-[0.9375rem] font-medium text-foreground/70"><span aria-hidden className="inline-block size-2.5 rounded-full bg-[conic-gradient(from_200deg,#e9b872,#f6e7c8,#4f9e98,#e9b872)]" />Formation disponible · {formation.domain}</p>
        <h3 className="mt-3 font-display text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.035em]">{formation.title}</h3>
        <p className="mt-4 max-w-[34rem] type-lead text-foreground/80">{plain(formation.promise)}</p>
        <ol className="mt-8 divide-y divide-border border-y border-border">
          {formation.modules.map((m) => (
            <li key={m.id} className="flex items-baseline gap-4 py-3 type-small">
              <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{m.position}</span>
              <span className="min-w-0 flex-1">{m.title}</span>
              <span className={m.availability === "open" ? "text-[0.8125rem] font-semibold text-primary" : "text-[0.8125rem] text-muted-foreground"}>
                {m.availability === "open" ? "Disponible" : "Prochainement"}
              </span>
            </li>
          ))}
        </ol>
        <Link href={`/formations/${formation.slug}`} className="link-quiet mt-8 self-start">
          Découvrir la formation
        </Link>
      </div>
      <div className="relative hidden min-h-[22rem] overflow-hidden bg-[url(/paysages/nuit-2.webp)] bg-cover lg:block">
        <div className="absolute top-12 left-12 w-[115%]">
          <Image src="/captures/session-clair.webp" width={1800} height={1125} alt="Une session de la formation : le tuteur à gauche, l'étape en cours au centre." sizes="40vw" className="rounded-lg shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)] dark:hidden" />
          <Image src="/captures/session-sombre.webp" width={1800} height={1125} alt="Une session de la formation : le tuteur à gauche, l'étape en cours au centre." sizes="40vw" className="hidden rounded-lg dark:block" />
        </div>
      </div>
    </article>
  );
}
