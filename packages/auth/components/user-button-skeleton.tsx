/**
 * Skeleton for UserButton while Clerk is loading
 * 對應 UserButton 頭像大小 (h-8 w-8)
 */
export function UserButtonSkeleton() {
  return (
    <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-full border">
      <div className="bg-muted-foreground/20 h-6 w-6 animate-pulse rounded-full" />
    </div>
  );
}
