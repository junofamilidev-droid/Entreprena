"use client";

import * as React from "react";
import { animate, useReducedMotion } from "motion/react";

/** Nombre qui défile de 0 jusqu'à sa valeur, puis suit ses changements. */
export function CountUp({ value, format = String, duration = 0.9 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const from = React.useRef(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = format(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        el.textContent = format(Math.round(n));
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, format, duration, reduce]);

  return <span ref={ref}>{format(reduce ? value : 0)}</span>;
}
