import {
  getDemoResetProtectedUsers,
  recordResetCycle,
} from "@/server/lib/user-reset";
import { auth } from "@workspace/auth/server";
import { DemoNoticeToast } from "./demo-notice-toast";

/** Only the hosted demo opts in; self-hosted installations stay unchanged. */
export async function DemoNotice() {
  if (!getDemoResetProtectedUsers()) return null;
  const { userId, sessionId } = await auth();
  if (!userId || !sessionId) return null;
  const cycle = await recordResetCycle(userId);
  return (
    <DemoNoticeToast
      userId={userId}
      sessionId={sessionId}
      nextResetAt={cycle?.nextResetAt?.toISOString() ?? null}
    />
  );
}
