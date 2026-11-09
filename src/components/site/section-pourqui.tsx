import { Eyebrow } from "./kit";

// Pour qui / ce que ce n'est pas : un tableau à deux colonnes, sobre, comme une fiche produit.
export function SectionPourQui({ yesTitle, yes, noTitle, no }: { yesTitle: string; yes: string[]; noTitle: string; no: string[] }) {
  return (
    <div>
      <Eyebrow>Pour qui</Eyebrow>
      <h2 className="mt-5 max-w-[22ch] font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
        Faite pour les professionnels en poste. Pas pour tout le monde.
      </h2>
      <div className="mt-12 grid border-t border-foreground/80 md:grid-cols-2">
        {[
          { head: yesTitle, items: yes, mark: "Oui" },
          { head: noTitle, items: no, mark: "Non" },
        ].map((col, c) => (
          <div key={col.head} className={c === 1 ? "md:border-l md:border-border md:pl-10" : "md:pr-10"}>
            <p className="flex items-center justify-between border-b border-border py-4 text-[0.9375rem] font-semibold">
              <span>{col.head}</span>
              <span className={c === 0 ? "rounded-full bg-primary/10 px-3 py-1 text-[0.8125rem] text-primary" : "rounded-full bg-foreground/[0.05] px-3 py-1 text-[0.8125rem] text-muted-foreground"}>{col.mark}</span>
            </p>
            <ul>
              {col.items.map((t) => (
                <li key={t} className={`border-b border-border py-5 type-body ${c === 1 ? "text-foreground/75" : ""}`}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
