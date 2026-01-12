import { currentUser, auth } from "@workspace/auth/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@workspace/auth/client";

export default async function Page() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  return (
    <div>
      Dashboard Home Page <SignOutButton />
    </div>
  );
}
