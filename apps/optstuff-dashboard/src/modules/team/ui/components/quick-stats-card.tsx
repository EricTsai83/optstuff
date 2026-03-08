import { formatNumber } from "@/lib/format";
import { Card, CardContent } from "@workspace/ui/components/card";

type QuickStatsCardProps = {
  readonly projectCount: number;
  readonly totalRequests: number;
};

export function QuickStatsCard({
  projectCount,
  totalRequests,
}: QuickStatsCardProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Quick Stats</h3>
      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{projectCount}</div>
            <div className="text-muted-foreground text-xs">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatNumber(totalRequests)}
            </div>
            <div className="text-muted-foreground text-xs">Requests</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
