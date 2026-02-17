import pluginNext from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { config as baseConfig } from "./base.js";

const reactFlatRecommended = pluginReact.configs.flat.recommended;

/**
 * A custom ESLint configuration for libraries that use Next.js.
 */
export const nextJsConfig = defineConfig(
  ...baseConfig,
  {
    ...reactFlatRecommended,
    languageOptions: {
      ...reactFlatRecommended?.languageOptions,
      globals: {
        ...reactFlatRecommended?.languageOptions?.globals,
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: { "@next/next": pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
);
