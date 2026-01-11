import { authMiddleware, createRouteMatcher } from "@workspace/auth/proxy";
import { NextResponse } from "next/server";

const APP_BASE_PATH = "/dashboard";

const isPublicRoute = createRouteMatcher([
  `${APP_BASE_PATH}/sign-in(.*)`,
  `${APP_BASE_PATH}/sign-up(.*)`,
]);

export default authMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  console.log("host", req.headers.get("host"));
  console.log("x-forwarded-host", req.headers.get("x-forwarded-host"));
  console.log("x-forwarded-proto", req.headers.get("x-forwarded-proto"));
  console.log("pathname", req.nextUrl.pathname);
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
