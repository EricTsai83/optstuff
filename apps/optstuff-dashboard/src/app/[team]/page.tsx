import { redirect, notFound } from "next/navigation";
import { auth, clerkClient } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Header } from "@/components/header";
import { TeamContent } from "@/modules/team";
import { Footer } from "@/components/footer";
import { checkTeamAccessBySlug, getUserTeams } from "@/server/lib/team-access";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check team access via Clerk membership
  const { hasAccess, team } = await checkTeamAccessBySlug(db, teamSlug, userId);

  // If team not found or no access, check if it's the first visit
  if (!hasAccess || !team) {
    // Get all teams user has access to via Clerk
    const userTeams = await getUserTeams(db, userId);

    // If no teams at all, create Clerk organization and personal team
    if (userTeams.length === 0) {
      const client = await clerkClient();

      // Get user info to create username-based slug
      const user = await client.users.getUser(userId);
      const username =
        user.username ?? user.emailAddresses[0]?.emailAddress?.split("@")[0];

      // Use username/email if available, otherwise use full ownerId (guaranteed unique)
      const personalSlug = username
        ? `${username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-personal-team`
        : `${userId.replace("user_", "")}-personal-team`;

      // Create Clerk organization with slug
      const org = await client.organizations.createOrganization({
        name: "Personal Team",
        slug: personalSlug,
        createdBy: userId,
      });

      // Create personal team with Clerk org ID and our own slug
      const [insertedTeam] = await db
        .insert(teams)
        .values({
          ownerId: userId,
          clerkOrgId: org.id,
          name: "Personal Team",
          slug: personalSlug,
          isPersonal: true,
        })
        .onConflictDoNothing()
        .returning();

      // If insert succeeded, redirect to new team
      if (insertedTeam) {
        redirect(`/${insertedTeam.slug}`);
      }

      // If insert was skipped (conflict), fetch the existing personal team
      const existingPersonalTeam = await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      });

      if (existingPersonalTeam) {
        redirect(`/${existingPersonalTeam.slug}`);
      }
    }

    // If user has teams but this slug doesn't exist or no access, redirect to first team
    if (userTeams.length > 0) {
      const personalTeam = userTeams.find((t) => t.isPersonal) ?? userTeams[0];
      if (personalTeam && teamSlug !== personalTeam.slug) {
        redirect(`/${personalTeam.slug}`);
      }
    }

    notFound();
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header teamSlug={teamSlug} />
      <TeamContent
        teamId={team.id}
        teamSlug={teamSlug}
        teamName={team.name}
        isPersonal={team.isPersonal}
      />
      <Footer />
    </div>
  );
}
