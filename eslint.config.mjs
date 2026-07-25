import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // These compiler-oriented rules require wider state-flow refactors. Keep
      // runtime behavior stable during the framework migration.
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "tools/TripoSR/.venv/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
