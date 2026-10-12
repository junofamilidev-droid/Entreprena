"use client";

import * as React from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { BoldIcon, HighlighterIcon, Heading3Icon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, Undo2Icon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

// Éditeur de texte simple : gras, italique, surligné (balise <mark> des leçons), intertitre,
// listes et liens. Produit le HTML stocké dans le contenu.
export function RichText({
  value,
  onChange,
  label,
  minHeight = "8rem",
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
  minHeight?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener" } },
      }),
      Highlight,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose-lesson min-h-[var(--rt-min)] px-3 py-2.5 outline-none",
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            mark: e.isActive("highlight"),
            h3: e.isActive("heading", { level: 3 }),
            ul: e.isActive("bulletList"),
            ol: e.isActive("orderedList"),
            link: e.isActive("link"),
          }
        : null,
  });

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresse du lien (laisser vide pour retirer le lien)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const tools: { key: keyof NonNullable<typeof state>; label: string; icon: React.ReactNode; run: () => void }[] = editor
    ? [
        { key: "bold", label: "Gras", icon: <BoldIcon />, run: () => editor.chain().focus().toggleBold().run() },
        { key: "italic", label: "Italique", icon: <ItalicIcon />, run: () => editor.chain().focus().toggleItalic().run() },
        { key: "mark", label: "Surligner", icon: <HighlighterIcon />, run: () => editor.chain().focus().toggleHighlight().run() },
        { key: "h3", label: "Intertitre", icon: <Heading3Icon />, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { key: "ul", label: "Liste à puces", icon: <ListIcon />, run: () => editor.chain().focus().toggleBulletList().run() },
        { key: "ol", label: "Liste numérotée", icon: <ListOrderedIcon />, run: () => editor.chain().focus().toggleOrderedList().run() },
        { key: "link", label: "Lien", icon: <LinkIcon />, run: setLink },
      ]
    : [];

  return (
    <div className="overflow-hidden rounded-md border bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1" role="toolbar" aria-label={`Mise en forme : ${label}`}>
        {tools.map((t) => (
          <Toggle
            key={t.key}
            size="sm"
            pressed={Boolean(state?.[t.key])}
            onPressedChange={t.run}
            aria-label={t.label}
            title={t.label}
          >
            {t.icon}
          </Toggle>
        ))}
        <Toggle size="sm" pressed={false} onPressedChange={() => editor?.chain().focus().undo().run()} aria-label="Annuler" title="Annuler">
          <Undo2Icon />
        </Toggle>
      </div>
      <div style={{ "--rt-min": minHeight } as React.CSSProperties} className={cn(!editor && "min-h-[var(--rt-min)]")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
