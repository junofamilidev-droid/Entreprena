import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Composants shadcn/ui copiés tels quels : on ne les réécrit pas pour satisfaire ces règles.
    files: ["src/components/ui/**", "src/hooks/**"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Extrait du prototype, gardé tel quel comme référence de test.
    "tests/fixtures/**",
  ]),
]);

export default eslintConfig;
