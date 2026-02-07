"use client";

import { RATE_LIMITS } from "@/lib/constants";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Gauge,
  Globe,
  Key,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { ApiKeyData, ExpirationStatus } from "./api-key-types";
import {
  getExpirationStatus,
  getStatusColorScheme,
  STATUS_COLORS,
} from "./api-key-types";

// ============================================================================
// Types
// ============================================================================

type ApiKeyItemProps = {
  readonly apiKey: ApiKeyData;
  readonly onRevoke: () => void;
  readonly onRotate: () => void;
  readonly onEdit: () => void;
  readonly isRevoking: boolean;
  readonly isRotating: boolean;
};

// ============================================================================
// Sub-components
// ============================================================================

type AlertItem = {
  readonly id: string;
  readonly severity: "danger" | "warning";
  readonly icon: React.ReactNode;
  readonly label: string;
};

function AlertBadge({ alert }: { readonly alert: AlertItem }) {
  const isDanger = alert.severity === "danger";

  return (
    <Badge
      variant={isDanger ? "destructive" : "secondary"}
      className={cn(
        "text-xs",
        !isDanger &&
        "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      {alert.icon}
      <span className="ml-1">{alert.label}</span>
    </Badge>
  );
}

function AlertsOverview({
  isExpired,
  isExpiringSoon,
  daysUntilExpiry,
  hasDomains,
}: ExpirationStatus & { readonly hasDomains: boolean }) {
  const alerts: AlertItem[] = [];

  // 过期相关提醒
  if (isExpired) {
    alerts.push({
      id: "expired",
      severity: "danger",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Expired",
    });
  } else if (isExpiringSoon && daysUntilExpiry !== null) {
    const expiryText =
      daysUntilExpiry === 0
        ? "Expires today"
        : `${daysUntilExpiry}d left`;
    alerts.push({
      id: "expiring-soon",
      severity: "warning",
      icon: <Clock className="h-3 w-3" />,
      label: expiryText,
    });
  }

  // 域名配置提醒
  if (!hasDomains) {
    alerts.push({
      id: "no-domains",
      severity: "warning",
      icon: <Globe className="h-3 w-3" />,
      label: "No domains",
    });
  }

  // 没有任何提醒时不显示
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {alerts.map((alert) => (
        <AlertBadge key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function ExpirationInfo({
  expiresAt,
}: {
  readonly expiresAt: Date | null;
}) {
  if (!expiresAt) {
    return <span>No expiration</span>;
  }

  const expiryDate = new Date(expiresAt);
  const formattedDate = format(expiryDate, "MMM d, yyyy");

  return <span>{formattedDate}</span>;
}

function DomainDisplay({
  domains,
}: {
  readonly domains: string[] | null;
}) {
  const domainCount = domains?.length ?? 0;

  if (domainCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {domains!.slice(0, 4).map((domain) => (
        <Badge key={domain} variant="outline" className="font-mono text-xs">
          {domain}
        </Badge>
      ))}
      {domainCount > 4 && (
        <span className="text-xs text-muted-foreground">
          +{domainCount - 4} more
        </span>
      )}
    </div>
  );
}

function StatusIcon({
  colorScheme,
  statusLabel,
}: {
  readonly colorScheme: "danger" | "warning" | "success";
  readonly statusLabel: string;
}) {
  const colors = STATUS_COLORS[colorScheme];

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
        colors.background,
        colors.text
      )}
    >
      <Key className="h-6 w-6" />

    </div>
  );
}

function ApiKeyActions({
  onEdit,
  onRotate,
  onRevoke,
  isRotating,
  isRevoking,
}: {
  readonly onEdit: () => void;
  readonly onRotate: () => void;
  readonly onRevoke: () => void;
  readonly isRotating: boolean;
  readonly isRevoking: boolean;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg">
          <MoreHorizontal className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRotate} disabled={isRotating}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Rotate Key
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onRevoke}
          disabled={isRevoking}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Revoke Key
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ApiKeyItem({
  apiKey,
  onRevoke,
  onRotate,
  onEdit,
  isRevoking,
  isRotating,
}: ApiKeyItemProps) {
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const { isExpired, isExpiringSoon, daysUntilExpiry } = getExpirationStatus(
    apiKey.expiresAt
  );
  const hasDomains = (apiKey.allowedSourceDomains?.length ?? 0) > 0;
  const colorScheme = getStatusColorScheme(isExpired, isExpiringSoon, hasDomains);

  const statusLabel = isExpired
    ? "Expired"
    : !hasDomains
      ? "No domains configured"
      : isExpiringSoon
        ? "Expiring soon"
        : "Active";

  // Masked version: pk_abc12345••••••••••••
  const maskedKey = `${apiKey.keyPrefix}${"•".repeat(20)}`;

  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30">
      {/* Header row: [Icon] [Content] [Actions] */}
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        {/* Left: Status Icon */}
        <StatusIcon colorScheme={colorScheme} statusLabel={statusLabel} />

        {/* Center: Name + Key and Badges */}
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {/* Left column: Name + Key */}
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{apiKey.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {/* Fixed width container to prevent layout shift when toggling visibility */}
              <code className="w-[200px] truncate rounded bg-muted px-2 py-0.5 font-mono text-xs">
                {isKeyVisible ? apiKey.keyFull : maskedKey}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                aria-label={isKeyVisible ? "Hide key" : "Show key"}
              >
                {isKeyVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <CopyButton text={apiKey.keyFull} className="h-7 w-7 shrink-0" />
            </div>
          </div>

          {/* Right column: Alerts/Badges */}
          <AlertsOverview
            isExpired={isExpired}
            isExpiringSoon={isExpiringSoon}
            daysUntilExpiry={daysUntilExpiry}
            hasDomains={hasDomains}
          />
        </div>

        {/* Right: Actions menu */}
        <ApiKeyActions
          onEdit={onEdit}
          onRotate={onRotate}
          onRevoke={onRevoke}
          isRotating={isRotating}
          isRevoking={isRevoking}
        />
      </div>

      {/* Details row - aligned with Icon (left edge) */}
      <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">
        {/* Column 1: Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created</span>
            <span>
              {formatDistanceToNow(new Date(apiKey.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expires</span>
            <ExpirationInfo expiresAt={apiKey.expiresAt} />
          </div>

          {apiKey.lastUsedAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last used</span>
              <span>
                {formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Column 2: Rate Limits */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <span>Rate Limits</span>
          </div>
          <div className="space-y-1 pl-6">
            <div>
              <span className="font-medium">{(apiKey.rateLimitPerMinute ?? RATE_LIMITS.perMinute).toLocaleString()}</span>
              <span className="text-muted-foreground"> req/min</span>
            </div>
            <div>
              <span className="font-medium">{(apiKey.rateLimitPerDay ?? RATE_LIMITS.perDay).toLocaleString()}</span>
              <span className="text-muted-foreground"> req/day</span>
            </div>
          </div>
        </div>

        {/* Column 3: Domains */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Allowed Domains</span>
          </div>
          <DomainDisplay domains={apiKey.allowedSourceDomains} />
        </div>
      </div>
    </div>
  );
}
