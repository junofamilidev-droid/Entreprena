import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TestBanner } from "@/components/test-banner";
import { site } from "@/lib/site";

const nav = [
  { href: "/#formations", label: "Formations" },
  { href: "/#methode", label: "Méthode" },
];

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md outline-offset-4">
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-brand text-brand-foreground">
        <span className="font-serif text-[15px] font-semibold leading-none">E</span>
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight">{site.name}</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <TestBanner />
      <div className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Button key={n.href} asChild variant="ghost">
                <Link href={n.href}>{n.label}</Link>
              </Button>
            ))}
          </nav>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation mobile" className="grid gap-1 px-4">
                {nav.map((n) => (
                  <Button key={n.href} asChild variant="ghost" className="justify-start text-base">
                    <Link href={n.href}>{n.label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
