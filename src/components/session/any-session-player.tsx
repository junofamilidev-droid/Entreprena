"use client";

import { AtelierPlayer } from "@/components/atelier/atelier-player";
import { isAtelier } from "@/lib/sessions/atelier";
import type { AnySession } from "@/lib/sessions/types";
import type { NextSession } from "./session-complete";
import { SessionPlayer } from "./session-player";

// Choisit le lecteur selon le format : « atelier » (deux zones) ou classique (un écran par bloc).
export function AnySessionPlayer({
  session,
  moduleLabel,
  exitHref,
  fileBase,
  next,
  keyPrefix,
  measure,
  askAiTool,
}: {
  session: AnySession;
  moduleLabel: string;
  exitHref: string;
  fileBase: string;
  next?: NextSession | null;
  keyPrefix?: string;
  measure?: boolean;
  askAiTool?: boolean;
}) {
  if (isAtelier(session))
    return <AtelierPlayer session={session} moduleLabel={moduleLabel} exitHref={exitHref} fileBase={fileBase} keyPrefix={keyPrefix} measure={measure} />;
  return (
    <SessionPlayer
      session={session}
      moduleLabel={moduleLabel}
      exitHref={exitHref}
      fileBase={fileBase}
      next={next}
      keyPrefix={keyPrefix}
      measure={measure}
      askAiTool={askAiTool}
    />
  );
}
