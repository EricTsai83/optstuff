import { keys as auth } from "@workspace/auth/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  extends: [auth()],
  server: {},
  client: {},
  runtimeEnv: {},
});
