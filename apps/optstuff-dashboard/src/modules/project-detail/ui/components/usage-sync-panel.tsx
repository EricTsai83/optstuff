"use client";

import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";

type MeteringStatus = {
  lastFlushRunAt: Date | string | null;
  lastFlushSuccessAt: Date | string | null;
};

type UsageSyncPanelProps = {
  readonly projectId: string;
  readonly meteringStatus?: MeteringStatus;
  readonly isLoading?: boolean;
};

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toRelativeTimeLabel(value: Date | string | null | undefined): string {
  const parsed = toValidDate(value);
  if (!parsed) return "—";
  return formatDistanceToNowStrict(parsed, { addSuffix: true });
}

export function UsageSyncPanel({
  projectId,
  meteringStatus,
  isLoading,
}: UsageSyncPanelProps) {
  const utils = api.useUtils();

  const { mutateAsync: flushNow, isPending } = api.usage.flushNow.useMutation();

  const handleFlushNow = async () => {
    try {
      const result = await flushNow({ projectId });

      await Promise.all([
        utils.usage.getSummary.invalidate(),
        utils.usage.getMeteringStatus.invalidate(),
        utils.usage.getTeamSummary.invalidate(),
        utils.usage.getAllTeamsSummary.invalidate(),
        utils.usage.getByApiKey.invalidate(),
        utils.usage.getDailyUsage.invalidate(),
        utils.usage.getMonthlyUsage.invalidate(),
      ]);

      if (result.reason === "cooldown") {
        toast.info("Already up to date", {
          description: `Usage was synced recently. Try again in ${result.cooldownSeconds}s.`,
          duration: 5000,
        });
        return;
      }

      if (result.flushResult?.skippedByLock) {
        toast.info("Sync in progress", {
          description: "Data is being updated — check back in a moment.",
          duration: 5000,
        });
        return;
      }

      if (result.ok && result.flushResult) {
        const fr = result.flushResult;
        if (fr.totalRequests > 0) {
          toast.success("Usage data updated", {
            description: `Synced ${fr.totalRequests.toLocaleString()} new requests.`,
            duration: 5000,
          });
        } else {
          toast.success("Already up to date", {
            description: "No new usage data to sync.",
            duration: 4000,
          });
        }
        return;
      }

      toast.error("Sync failed", {
        description: "Could not update usage data. Please try again later.",
      });
    } catch {
      toast.error("Sync failed", {
        description: "Something went wrong. Please try again later.",
      });
    }
  };

  const lastSuccess = isLoading
    ? null
    : toRelativeTimeLabel(meteringStatus?.lastFlushSuccessAt);
  const lastAttempt = isLoading
    ? null
    : toRelativeTimeLabel(meteringStatus?.lastFlushRunAt);

  const ValueOrSpinner = ({ value }: { readonly value: string | null }) =>
    isLoading ? (
      <Loader2 className="text-muted-foreground/60 h-3 w-3 animate-spin" />
    ) : (
      <span
        className={cn(
          "font-medium",
          value === "—" ? "text-muted-foreground/60" : "text-foreground/80",
        )}
      >
        {value}
      </span>
    );

  return (
    <div className="flex items-center gap-x-3 gap-y-2">
      {/* Mobile: compact single label */}
      <span className="flex items-center gap-x-1.5 text-xs sm:hidden">
        <span className="text-muted-foreground">Synced</span>
        <ValueOrSpinner value={lastSuccess} />
      </span>

      {/* Desktop: full labels with separator */}
      <div className="hidden items-center gap-x-3 text-xs sm:flex">
        <span className="flex items-center gap-x-1.5">
          <span className="text-muted-foreground">Last sync</span>
          <ValueOrSpinner value={lastSuccess} />
        </span>
        <span className="text-border select-none" aria-hidden="true">
          ·
        </span>
        <span className="flex items-center gap-x-1.5">
          <span className="text-muted-foreground">Attempt</span>
          <ValueOrSpinner value={lastAttempt} />
        </span>
      </div>

      {/* Mobile: icon-only button / Desktop: text button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void handleFlushNow()}
        disabled={isPending}
        className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
      >
        <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
        <span className="hidden sm:inline">
          {isPending ? "Syncing…" : "Sync Now"}
        </span>
      </Button>
    </div>
  );
}
