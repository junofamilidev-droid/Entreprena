import { FlaskConicalIcon } from "lucide-react";

export function TestBanner() {
  return (
    <div className="border-b bg-brand-soft text-accent-foreground">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-caption">
        <FlaskConicalIcon className="size-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Version de test.</strong> Contenus en
          cours de relecture par des professionnels.
        </span>
      </p>
    </div>
  );
}
