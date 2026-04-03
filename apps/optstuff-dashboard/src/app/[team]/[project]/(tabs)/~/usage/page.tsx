import { getVerifiedProject } from "@/lib/get-project";
import { UsageTab } from "@/modules/project-detail";
import { getDateRangeFromDays } from "@/modules/project-detail/lib/date-range-utils";
import { api, HydrateClient } from "@/trpc/server";

const DEFAULT_DAYS = 7;
const TOP_IMAGES_LIMIT = 10;
const RECENT_LOGS_LIMIT = 20;

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function UsagePage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { project } = await getVerifiedProject(teamSlug, projectSlug);

  const range = getDateRangeFromDays(DEFAULT_DAYS);
  const dateRangeInput = {
    projectId: project.id,
    startDate: range.from.toISOString(),
    endDate: range.to.toISOString(),
  };

  void api.usage.getSummary.prefetch({ ...dateRangeInput, days: DEFAULT_DAYS });
  void api.usage.getMeteringStatus.prefetch({ projectId: project.id });
  void api.requestLog.getDailyVolume.prefetch(dateRangeInput);
  void api.requestLog.getBandwidthSavings.prefetch(dateRangeInput);
  void api.requestLog.getTopImages.prefetch({
    ...dateRangeInput,
    limit: TOP_IMAGES_LIMIT,
  });
  void api.requestLog.getRecentLogs.prefetch({
    ...dateRangeInput,
    limit: RECENT_LOGS_LIMIT,
  });

  return (
    <HydrateClient>
      <UsageTab projectId={project.id} />
    </HydrateClient>
  );
}
