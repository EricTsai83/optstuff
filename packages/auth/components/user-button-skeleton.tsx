/**
 * Skeleton for UserButton while Clerk is loading
 * 對應 UserButton 頭像大小 (h-8 w-8)
 */
export function UserButtonSkeleton() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
      <div className="h-6 w-6 animate-pulse rounded-full bg-muted-foreground/20" />
    </div>
  );
}
