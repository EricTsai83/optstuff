import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export function SettingsTabSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Project Information card */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          <div className="bg-muted h-4 w-56 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          {/* Project Slug */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          {/* Created */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            <div className="bg-muted h-5 w-36 animate-pulse rounded" />
          </div>
          <div className="flex justify-end">
            <div className="bg-muted h-9 w-16 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Domain Security card */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-36 animate-pulse rounded" />
          <div className="bg-muted h-4 w-80 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Sources */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-72 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          <div className="border-border border-t pt-6" />
          {/* Authorized Websites */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-36 animate-pulse rounded" />
            <div className="bg-muted h-4 w-64 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          <div className="flex justify-end">
            <div className="bg-muted h-9 w-28 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone card */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="bg-muted h-5 w-28 animate-pulse rounded" />
          <div className="bg-muted h-4 w-52 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="bg-muted h-4 w-28 animate-pulse rounded" />
              <div className="bg-muted h-4 w-64 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-9 w-28 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
