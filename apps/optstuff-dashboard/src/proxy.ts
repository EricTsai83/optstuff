import { authMiddleware, createRouteMatcher } from "@workspace/auth/proxy";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const isServiceApiRoute = (req: { nextUrl: { pathname: string } }) =>
  req.nextUrl.pathname.startsWith("/api/") && // service API routes
  !req.nextUrl.pathname.startsWith("/api/trpc"); // private API routes

const clerkHandler = authMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (isServiceApiRoute(req)) {
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
