import { ProgressSync } from "@/components/auth/progress-sync";

// Lecteur de leçon et de session : plein écran, sans menu. Branche la progression sur le compte.
export default function LecteurLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressSync />
    </>
  );
}
