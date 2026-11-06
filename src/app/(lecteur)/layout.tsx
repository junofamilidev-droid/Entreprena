import { ProgressSync } from "@/components/auth/progress-sync";
import { MotionPrefs } from "@/components/theme/motion-prefs";

// Lecteur de leçon et de session : plein écran, sans menu. Branche la progression sur le compte.
export default function LecteurLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionPrefs>
      {children}
      <ProgressSync />
    </MotionPrefs>
  );
}
