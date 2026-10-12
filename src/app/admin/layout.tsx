import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Espace réservé", template: "%s · Espace réservé" }, robots: { index: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
