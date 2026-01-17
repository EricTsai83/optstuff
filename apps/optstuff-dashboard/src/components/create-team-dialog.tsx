"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CreateOrganization,
  useOrganizationList,
} from "@workspace/auth/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { api } from "@/trpc/react";

type CreateTeamDialogProps = {
  readonly trigger: React.ReactNode;
  readonly onSuccess?: () => void;
};

export function CreateTeamDialog({
  trigger,
  onSuccess,
}: CreateTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const utils = api.useUtils();

  // Track org count to detect new organizations
  const prevOrgCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  const { mutateAsync: syncFromClerk } = api.team.syncFromClerk.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
    },
  });

  // Detect when a new organization is created
  useEffect(() => {
    if (!isLoaded || !userMemberships?.data) return;

    const currentCount = userMemberships.data.length;

    // Skip the first load
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevOrgCountRef.current = currentCount;
      return;
    }

    // If count increased and dialog is open, a new org was likely created
    if (
      prevOrgCountRef.current !== null &&
      currentCount > prevOrgCountRef.current &&
      open
    ) {
      // Find the newest org (first in the list, as Clerk returns newest first)
      const newestMembership = userMemberships.data[0];
      if (newestMembership?.organization) {
        const org = newestMembership.organization;
        syncFromClerk({
          clerkOrgId: org.id,
          name: org.name,
          slug: org.slug ?? org.name.toLowerCase().replace(/\s+/g, "-"),
        })
          .then((team) => {
            setOpen(false);
            onSuccess?.();
            if (team?.slug) {
              router.push(`/${team.slug}`);
            }
          })
          .catch((error) => {
            console.error("Failed to sync team from Clerk:", error);
            // Keep dialog open so user can retry or close manually
          });
      }
    }

    prevOrgCountRef.current = currentCount;
  }, [isLoaded, userMemberships?.data, open, syncFromClerk, onSuccess, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md overflow-hidden p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Create Team</DialogTitle>
        <CreateOrganization
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "shadow-none w-full",
              card: "shadow-none w-full border-0",
              headerTitle: "text-lg font-semibold",
              headerSubtitle: "text-muted-foreground text-sm",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              formFieldInput:
                "border-input bg-background ring-offset-background",
              footer: "hidden",
            },
          }}
          skipInvitationScreen
        />
      </DialogContent>
    </Dialog>
  );
}
