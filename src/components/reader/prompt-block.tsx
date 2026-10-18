"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Prompt à copier dans l'assistant IA de son choix.
// `copyText` remplace le texte copié (par exemple, le prompt complété avec les saisies de l'apprenant).
export function PromptBlock({
  title,
  note,
  text,
  copyText,
  copyLabel = "Copier",
}: {
  title: string;
  note: string | null;
  text: string;
  copyText?: string;
  copyLabel?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText ?? text);
      setCopied(true);
      toast.success("Prompt copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
    }
  }

  return (
    <figure className="overflow-hidden rounded-lg border bg-muted/40">
      <figcaption className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
        <span className="text-sm font-medium">{title}</span>
        <Button variant="outline" size="sm" onClick={copy}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "ok" : "copy"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1.5"
            >
              {copied ? <CheckIcon className="text-success" /> : <CopyIcon />} {copied ? "Copié" : copyLabel}
            </motion.span>
          </AnimatePresence>
        </Button>
      </figcaption>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-[0.8125rem] leading-relaxed">{text}</pre>
      {note && (
        <div
          className="prose-lesson border-t px-4 py-3 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}
    </figure>
  );
}
