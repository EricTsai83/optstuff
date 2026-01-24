import { apiKeyRouter } from "@/server/api/routers/apiKey";
import { projectRouter } from "@/server/api/routers/project";
import { requestLogRouter } from "@/server/api/routers/requestLog";
import { teamRouter } from "@/server/api/routers/team";
import { usageRouter } from "@/server/api/routers/usage";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  team: teamRouter,
  project: projectRouter,
  apiKey: apiKeyRouter,
  usage: usageRouter,
  requestLog: requestLogRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.team.list();
 */
export const createCaller = createCallerFactory(appRouter);
