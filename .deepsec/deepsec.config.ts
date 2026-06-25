import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "optstuff", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
