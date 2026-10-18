import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/admin" className="font-semibold">
            Espace réservé
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" /> Voir le site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-8">{children}</main>
    </div>
  );
}
