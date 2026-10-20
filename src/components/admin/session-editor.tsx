"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, EyeIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteSession, saveSession, setSessionStatus } from "@/lib/admin/session-actions";
import { BLOCK_FIELDS, parseSession, type Field } from "@/lib/sessions/validate";
import { AI_TOOLS, blockLabel, type BlockType, type Session, type SessionBlock } from "@/lib/sessions/types";
import type { PublicationStatus } from "@/lib/content/types";
import { Crumbs, SaveBar, Section, StatusBadge, TextField, useAction } from "./kit";
import { FormatErrors } from "./session-import";
import { SessionFiles } from "./session-files";

const FIELD_LABEL: Record<string, string> = {
  expediteur: "Expéditeur",
  objet: "Objet",
  message: "Message",
  echeance: "Échéance",
  livrable: "Livrable attendu",
  consigne: "Consigne",
  donnees: "Fichier de données (nom exact)",
  temps_cible_min: "Temps cible (minutes)",
  criteres: "Critères de réussite",
  reponses_attendues: "Réponses attendues (montrées seulement à l'écran du gain)",
  texte: "Texte du prompt",
  usage: "Usage (titre de l'écran)",
  resultat_attendu: "Résultat attendu",
  a_verifier: "Points à vérifier",
  items: "Cases à cocher",
  lignes: "Lignes de la sortie d'IA",
  ligne_fautive: "Numéro de la ligne fautive (à partir de 1)",
  explication: "Explication",
  fichier: "Fichier de l'outil (nom exact)",
  description: "Description",
  champs_a_adapter: "Champs à adapter",
  mode_emploi: "Mode d'emploi (une étape par ligne)",
  tache: "Tâche mesurée",
  reference: "Référence",
  titre: "Titre",
  etapes: "Étapes",
  pieges: "Pièges",
  contenu: "Contenu (3 lignes maximum)",
};
const LONG = new Set(["message", "texte", "explication", "mode_emploi", "resultat_attendu", "contenu", "consigne"]);
const TOOL_LABEL: Record<(typeof AI_TOOLS)[number], string> = { claude: "Claude", chatgpt: "ChatGPT", copilot: "Microsoft Copilot", lechat: "Le Chat" };

function emptyBlock(type: BlockType): SessionBlock {
  const fields = BLOCK_FIELDS[type];
  const values: Record<string, unknown> = { type };
  for (const [name, kind] of Object.entries(fields) as [string, Field][]) {
    values[name] = kind === "nombre" ? (name === "ligne_fautive" ? 1 : 5) : kind === "texte" ? (name === "reference" ? "defi" : "") : [];
  }
  return values as unknown as SessionBlock;
}

/** Un champ d'un bloc, selon sa nature : texte, nombre, ou liste (un élément par ligne). */
function BlockField({ name, kind, value, onChange }: { name: string; kind: Field; value: unknown; onChange: (v: unknown) => void }) {
  const id = React.useId();
  const label = FIELD_LABEL[name] ?? name;
  if (name === "reference") return null;
  if (kind === "nombre")
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} type="number" min={1} value={String(value ?? "")} onChange={(e) => onChange(Number(e.target.value))} className="w-32 bg-card" />
      </div>
    );
  if (kind === "texte")
    return <TextField label={label} value={String(value ?? "")} onChange={onChange} multiline={LONG.has(name)} mono={name === "texte"} />;
  const lines = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={lines.join("\n")}
        rows={Math.max(3, lines.length + 1)}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        onBlur={() => onChange(lines.map((l) => l.trim()).filter(Boolean))}
        className="bg-card"
      />
      <p className="text-caption text-muted-foreground">Un élément par ligne.</p>
    </div>
  );
}

export function SessionEditor({
  id,
  status,
  content,
  moduleInfo,
}: {
  id: string;
  status: PublicationStatus;
  content: Session;
  moduleInfo: { id: string; title: string; position: number; formationId: string; formationTitle: string };
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [draft, setDraft] = React.useState<Session>(content);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [newType, setNewType] = React.useState<BlockType>("texte");
  const [saving, start] = React.useTransition();
  // Clés stables : un bloc déplacé garde son éditeur.
  const [keys, setKeys] = React.useState(() => content.blocs.map((_, i) => `b${i}`));
  const seq = React.useRef(content.blocs.length);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);
  const published = status === "published";

  const set = <K extends keyof Session>(k: K, v: Session[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setBlock = (i: number, next: SessionBlock) => set("blocs", draft.blocs.map((b, j) => (j === i ? next : b)));
  const swap = (i: number, j: number) => {
    const blocs = [...draft.blocs];
    [blocs[i], blocs[j]] = [blocs[j], blocs[i]];
    const k = [...keys];
    [k[i], k[j]] = [k[j], k[i]];
    setKeys(k);
    set("blocs", blocs);
  };
  const remove = (i: number) => {
    setKeys(keys.filter((_, j) => j !== i));
    set("blocs", draft.blocs.filter((_, j) => j !== i));
  };
  const add = () => {
    setKeys([...keys, `b${seq.current++}`]);
    set("blocs", [...draft.blocs, emptyBlock(newType)]);
  };

  function save() {
    const r = parseSession(draft);
    if (!r.ok) {
      setErrors(r.errors);
      return toast.error("La session n'est pas enregistrée : corrigez les erreurs indiquées.");
    }
    setErrors([]);
    start(async () => {
      const res = await saveSession(id, draft);
      if (!res.ok) return setErrors(res.error.split("\n"));
      toast.success("Session enregistrée.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Crumbs
        items={[
          { label: "Espace réservé", href: "/admin" },
          { label: moduleInfo.formationTitle, href: `/admin/formations/${moduleInfo.formationId}` },
          { label: `Module ${moduleInfo.position}`, href: `/admin/modules/${moduleInfo.id}` },
          { label: `Session ${content.session}` },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {moduleInfo.title} · session {content.session} · {content.duree_min} min
          </p>
          <h1 className="text-title">{content.titre}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/apercu-session/${id}`} target="_blank">
              <EyeIcon /> Aperçu
            </Link>
          </Button>
          <Button
            variant={published ? "outline" : "default"}
            disabled={pending || dirty}
            title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
            onClick={() => run(() => setSessionStatus(id, published ? "draft" : "published"), published ? "Session retirée du site." : "Session publiée.")}
          >
            {published ? "Repasser en brouillon" : "Publier"}
          </Button>
        </div>
      </div>

      <Section title="La session">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem_10rem]">
          <TextField label="Titre" value={draft.titre} onChange={(v) => set("titre", v)} />
          <div className="space-y-1.5">
            <Label htmlFor="num">Numéro</Label>
            <Input id="num" type="number" min={1} value={draft.session} onChange={(e) => set("session", Number(e.target.value))} className="bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duree">Durée (min)</Label>
            <Input id="duree" type="number" min={1} max={15} value={draft.duree_min} onChange={(e) => set("duree_min", Number(e.target.value))} className="bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maj">Mise à jour</Label>
            <Input id="maj" type="date" value={draft.maj} onChange={(e) => set("maj", e.target.value)} className="bg-card" />
          </div>
        </div>
        <p className="text-caption text-muted-foreground">
          Formation <span className="font-mono">{draft.formation}</span> · module <span className="font-mono">{draft.module}</span>
        </p>
      </Section>

      <Section title="Fichiers">
        <SessionFiles session={content} />
      </Section>

      <Section title={`Blocs (${draft.blocs.length})`} aside={<span className="text-caption text-muted-foreground">Un écran par bloc, dans cet ordre</span>}>
        <ol className="space-y-3">
          {draft.blocs.map((b, i) => (
            <li key={keys[i]} className="rounded-md border bg-background/60">
              <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
                <span className="text-sm font-medium">
                  {i + 1}. {blockLabel[b.type]} <span className="font-mono text-caption text-muted-foreground">({b.type})</span>
                </span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => swap(i, i - 1)} aria-label={`Monter le bloc ${i + 1}`}>
                    <ArrowUpIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={i === draft.blocs.length - 1} onClick={() => swap(i, i + 1)} aria-label={`Descendre le bloc ${i + 1}`}>
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => window.confirm(`Supprimer le bloc ${i + 1} (${blockLabel[b.type]}) ?`) && remove(i)}
                    aria-label={`Supprimer le bloc ${i + 1}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 p-3">
                {(Object.entries(BLOCK_FIELDS[b.type]) as [string, Field][]).map(([name, kind]) => (
                  <BlockField
                    key={name}
                    name={name}
                    kind={kind}
                    value={(b as unknown as Record<string, unknown>)[name]}
                    onChange={(v) => setBlock(i, { ...b, [name]: v } as SessionBlock)}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as BlockType)}
            aria-label="Type du bloc à ajouter"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs"
          >
            {(Object.keys(BLOCK_FIELDS) as BlockType[]).map((t) => (
              <option key={t} value={t}>
                {blockLabel[t]} ({t})
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={add}>
            <PlusIcon /> Ajouter un bloc à la fin
          </Button>
        </div>
      </Section>

      <Section title="Consignes par outil d'IA">
        <p className="text-sm text-muted-foreground">
          Affichées sous le prompt selon l&apos;outil choisi par l&apos;apprenant. Les mentions « (À vérifier) » restent visibles ici et
          sont masquées sur le site.
        </p>
        {AI_TOOLS.map((t) => (
          <TextField
            key={t}
            label={TOOL_LABEL[t]}
            value={draft.consignes_outils_ia[t] ?? ""}
            onChange={(v) => set("consignes_outils_ia", { ...draft.consignes_outils_ia, [t]: v })}
            multiline
          />
        ))}
      </Section>

      <Section title="Format JSON">
        <p className="text-sm text-muted-foreground">La session complète, pour la transmettre ou la réimporter ailleurs.</p>
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
            toast.success("JSON copié.");
          }}
        >
          <CopyIcon /> Copier le JSON
        </Button>
      </Section>

      <Section title="Supprimer la session" className="border-destructive/30">
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() =>
            window.confirm(`Supprimer définitivement la session ${content.session} « ${content.titre} » ?`) &&
            run(() => deleteSession(id), "Session supprimée.", () => router.push(`/admin/modules/${moduleInfo.id}`))
          }
        >
          <Trash2Icon /> Supprimer
        </Button>
      </Section>

      {errors.length > 0 && <FormatErrors errors={errors} />}
      <SaveBar dirty={dirty} pending={saving} onSave={save} />
    </div>
  );
}
