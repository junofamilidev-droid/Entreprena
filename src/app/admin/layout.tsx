import type { Metadata } from "next";
import { MotionPrefs } from "@/components/theme/motion-prefs";

export const metadata: Metadata = { title: { default: "Espace réservé", template: "%s · Espace réservé" }, robots: { index: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <MotionPrefs>{children}</MotionPrefs>;
}
