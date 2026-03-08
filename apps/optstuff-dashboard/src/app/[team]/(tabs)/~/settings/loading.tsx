import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export default function SettingsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      aria-busy="true"
      className="max-w-2xl space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="bg-muted h-4 w-36 animate-pulse rounded" />
          <div className="bg-muted h-5 w-64 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="bg-muted h-3.5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-52 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-3.5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-52 animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-5 w-52 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="bg-muted h-5 w-64 animate-pulse rounded" />
            <div className="bg-muted mt-1 h-4 w-80 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
