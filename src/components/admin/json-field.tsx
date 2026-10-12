"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Champ JSON (mode avancé) : signale tout de suite une erreur de syntaxe, avec la ligne.
export function JsonField({
  label,
  value,
  onChange,
  rows = 18,
}: {
  label: string;
  value: string;
  onChange: (value: string, valid: boolean) => void;
  rows?: number;
}) {
  const id = React.useId();
  const [error, setError] = React.useState<string | null>(null);
  function change(v: string) {
    try {
      if (v.trim()) JSON.parse(v);
      setError(null);
      onChange(v, true);
    } catch (e) {
      const m = /position (\d+)/.exec(String(e));
      const line = m ? v.slice(0, Number(m[1])).split("\n").length : null;
      setError(line ? `Format invalide vers la ligne ${line} : vérifiez les guillemets, virgules et accolades.` : "Format invalide : vérifiez les guillemets, virgules et accolades.");
      onChange(v, false);
    }
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => change(e.target.value)}
        rows={rows}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        className="field-sizing-fixed max-h-[70svh] bg-card font-mono text-[0.8125rem] leading-relaxed"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
