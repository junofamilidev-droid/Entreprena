"use client";

import { MotionConfig } from "motion/react";

// Les animations de la plateforme respectent le réglage « réduire les animations » de l'appareil.
// Placé dans les mises en page de la plateforme seulement : la vitrine ne charge pas Motion.
export function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
