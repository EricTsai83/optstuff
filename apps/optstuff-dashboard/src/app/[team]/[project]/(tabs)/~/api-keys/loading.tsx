import { ApiKeyListSkeleton } from "@/modules/project-detail/ui/components/api-key-list.skeleton";

export default function ApiKeysTabLoading() {
  return (
    <div role="status" aria-label="Loading API keys" aria-busy="true">
      <ApiKeyListSkeleton />
    </div>
  );
}
