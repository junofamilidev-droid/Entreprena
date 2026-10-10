import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
