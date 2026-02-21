/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwindcss",
  ],
};

export default config;
