"use client";

import confetti from "canvas-confetti";

// Petite fête : deux salves de confettis depuis les bords, aux couleurs du site.
// Rien ne s'affiche si l'appareil demande de réduire les animations.
export function celebrate() {
  const colors = ["#0f6b78", "#38b6b0", "#f6cf63", "#f2b84b", "#ffffff"];
  const base = { particleCount: 70, spread: 70, startVelocity: 48, ticks: 220, scalar: 0.9, colors, disableForReducedMotion: true };
  void confetti({ ...base, angle: 60, origin: { x: 0, y: 0.75 } });
  void confetti({ ...base, angle: 120, origin: { x: 1, y: 0.75 } });
}
