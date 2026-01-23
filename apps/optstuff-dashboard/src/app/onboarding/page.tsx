import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { generateSlug } from "@/lib/slug";
import { OnboardingForm } from "@/modules/onboarding/ui/components/onboarding-form";
import { LogoIcon } from "@workspace/ui/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user already has a personal team
  const existingPersonalTeam = await db.query.teams.findFirst({
    where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
  });

  if (existingPersonalTeam) {
    redirect(`/${existingPersonalTeam.slug}`);
  }

  // Get user info from Clerk
  const user = await currentUser();
  const baseSlug = user?.username ? generateSlug(user.username) : "";
  // Only use the slug if it's valid (at least 3 characters after conversion)
  const suggestedSlug =
    baseSlug.length >= 3 ? `${baseSlug}-personal-team` : "";

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center py-4 text-center">
          <div className="mb-4 flex w-full justify-center">
            <LogoIcon size={48} />
          </div>
          <CardTitle className="text-2xl">Welcome to OptStuff</CardTitle>
          <CardDescription>Let&apos;s set up your personal team</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <OnboardingForm suggestedSlug={suggestedSlug} />
        </CardContent>
      </Card>
    </div>
  );
}
