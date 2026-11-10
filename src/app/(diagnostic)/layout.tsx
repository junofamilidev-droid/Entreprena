import localFont from "next/font/local";

// Mise en page du diagnostic : plein écran, sans menu ni pied de page (aucune fuite).
// Reprend les jetons visuels de la vitrine (classe « site »).
const display = localFont({
  src: "../../fonts/inter-tight-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-display-loaded",
  adjustFontFallback: "Arial",
});

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return <div className={`site ${display.variable} min-h-dvh`}>{children}</div>;
}
