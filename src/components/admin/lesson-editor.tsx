"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CheckQuestion, LessonContent, LessonScreen } from "@/lib/content/types";
import { ListEditor, Section, SelectField, TextField } from "./kit";
import { RichText } from "./rich-text";

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

// Formulaire d'une leçon : écrans, prompt, questions de vérification, « À retenir », sources.
export function LessonEditor({ value, onChange }: { value: LessonContent; onChange: (v: LessonContent) => void }) {
  const set = <K extends keyof LessonContent>(k: K, v: LessonContent[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      <Section title="En-tête">
        <TextField label="Objectif" value={value.objective} onChange={(v) => set("objective", v)} multiline help="Affiché en haut du premier écran." />
        <TextField label="Durée" value={value.duration} onChange={(v) => set("duration", v)} placeholder="6 min de lecture" />
      </Section>

      <Section title="Écrans">
        <ListEditor<LessonScreen>
          label="Un écran court par idée"
          items={value.screens}
          onChange={(v) => set("screens", v)}
          make={() => ({ title: "", html: "" })}
          addLabel="Ajouter un écran"
          itemLabel={(i) => `Écran ${i + 1}${value.screens[i]?.title ? ` : ${value.screens[i].title}` : ""}`}
          render={(screen, update, i) => (
            <>
              <TextField label="Titre de l'écran" value={screen.title} onChange={(v) => update({ ...screen, title: v })} />
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Texte</p>
                <RichText label={`Texte de l'écran ${i + 1}`} value={screen.html} onChange={(html) => update({ ...screen, html })} />
              </div>
              {value.prompt && (
                <Toggle id={`show-prompt-${i}`} label="Afficher le prompt sous cet écran" checked={Boolean(screen.showPrompt)} onChange={(v) => update({ ...screen, showPrompt: v })} />
              )}
            </>
          )}
        />
      </Section>

      <Section title="Prompt à copier">
        <Toggle
          id="has-prompt"
          label="Cette leçon propose un prompt"
          checked={Boolean(value.prompt)}
          onChange={(v) => set("prompt", v ? { title: "Prompt", note: null, text: "" } : null)}
        />
        {value.prompt && (
          <>
            <TextField label="Titre" value={value.prompt.title} onChange={(v) => set("prompt", { ...value.prompt!, title: v })} />
            <TextField label="Texte du prompt" value={value.prompt.text} onChange={(v) => set("prompt", { ...value.prompt!, text: v })} multiline mono />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Note sous le prompt (facultative)</p>
              <RichText label="Note sous le prompt" value={value.prompt.note ?? ""} onChange={(html) => set("prompt", { ...value.prompt!, note: html || null })} minHeight="4rem" />
            </div>
          </>
        )}
      </Section>

      <Section title="Questions de vérification">
        <ListEditor<CheckQuestion>
          label="Posées à la fin de la leçon, une par écran"
          items={value.questions}
          onChange={(v) => set("questions", v)}
          make={() => ({ question: "", options: ["", "", ""], answer: 0, explanation: "" })}
          addLabel="Ajouter une question"
          itemLabel={(i) => `Question ${i + 1}`}
          render={(q, update) => (
            <>
              <TextField label="Question" value={q.question} onChange={(v) => update({ ...q, question: v })} multiline />
              <ListEditor<string>
                label="Réponses proposées"
                items={q.options}
                onChange={(options) => update({ ...q, options, answer: Math.min(q.answer, Math.max(options.length - 1, 0)) })}
                make={() => ""}
                addLabel="Ajouter une réponse"
                itemLabel={(j) => `Réponse ${String.fromCharCode(65 + j)}`}
                render={(o, set) => <TextField label="Texte" value={o} onChange={set} />}
              />
              <SelectField
                label="Bonne réponse"
                value={String(q.answer)}
                onChange={(v) => update({ ...q, answer: Number(v) })}
                options={q.options.map((o, j) => ({ value: String(j), label: `${String.fromCharCode(65 + j)}. ${o || "(vide)"}` }))}
              />
              <TextField label="Explication (affichée après la réponse)" value={q.explanation} onChange={(v) => update({ ...q, explanation: v })} multiline />
            </>
          )}
        />
      </Section>

      <Section title="Fin de la leçon">
        <TextField label="À retenir" value={value.recap} onChange={(v) => set("recap", v)} multiline />
        <TextField label="Transition vers l'étape suivante (facultative)" value={value.next ?? ""} onChange={(v) => set("next", v || null)} multiline />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Sources et points à relire</p>
          <RichText label="Sources" value={value.sourcesHtml ?? ""} onChange={(html) => set("sourcesHtml", html || null)} minHeight="5rem" />
        </div>
      </Section>
    </div>
  );
}
