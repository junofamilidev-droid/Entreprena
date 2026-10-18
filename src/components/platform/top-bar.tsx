"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { hasSupabase } from "@/lib/supabase/env";
import { displayName, supabase, useAuth, useIsAdmin } from "@/lib/auth/session";
import { flushProgress } from "@/lib/progress/sync";
import { useSearchIndex } from "./search-index";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Recherche dans les formations, modules et étapes. Flèches haut et bas pour choisir, Entrée pour ouvrir.
function SearchBox() {
  const router = useRouter();
  const entries = useSearchIndex();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const q = normalize(query.trim());
  const results = q ? entries.filter((e) => normalize(`${e.label} ${e.context}`).includes(q)).slice(0, 8) : [];

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-label="Rechercher une formation, un module ou une étape"
        placeholder="Rechercher une formation, un module…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          }
          if (e.key === "Enter" && results[active]) go(results[active].href);
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-9 w-full rounded-md border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      {open && q && (
        <ul id={listId} role="listbox" className="absolute top-11 right-0 left-0 z-50 overflow-hidden rounded-md border bg-popover py-1 shadow-md">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat pour « {query.trim()} ».</li>
          ) : (
            results.map((r, i) => (
              <li key={r.href + r.label} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("block w-full px-3 py-2 text-left", i === active && "bg-accent")}
                >
                  <span className="block truncate text-sm font-medium">{r.label}</span>
                  <span className="block truncate text-caption text-muted-foreground">{r.context}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// Avatar de l'apprenant et son menu : compte, espace réservé, déconnexion.
function UserMenu() {
  const router = useRouter();
  const auth = useAuth();
  const admin = useIsAdmin();
  if (!hasSupabase) return null;
  if (auth.status === "loading") return <span className="size-9" />;
  if (auth.status === "anon") {
    return (
      <Link href="/connexion" className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent">
        Se connecter
      </Link>
    );
  }
  const name = displayName(auth.user);
  async function signOut() {
    await flushProgress();
    await supabase().auth.signOut();
    toast.success("Vous êtes déconnecté. Votre progression reste dans votre compte.");
    router.replace("/");
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label="Mon compte">
        <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">{initials(name)}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-caption text-muted-foreground">{auth.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/compte">Mon compte</Link>
        </DropdownMenuItem>
        {admin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Espace réservé</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  return (
    <div className="flex h-14 items-center gap-3 px-4">
      <SidebarTrigger className="-ml-1" />
      <SearchBox />
      <div className="ml-auto">
        <UserMenu />
      </div>
    </div>
  );
}
