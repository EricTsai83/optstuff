import { createIPX, ipxFSStorage, type IPXStorage } from "ipx";
import path from "path";

import {
  assertStorageIdMatchesValidatedSource,
  fetchPinnedUpstream,
  getValidatedSourceFromOptions,
  UpstreamFetchError,
} from "@/server/lib/pinned-upstream";

/**
 * Create an IPX instance for image processing.
 *
 * Source URL validation is handled upstream by `validateSourceUrl`, which also
 * returns the DNS addresses that were verified as public. The HTTP storage below
 * refuses requests unless that validated source object is passed in as request
 * options, then connects to the pinned address instead of resolving DNS again.
 */
let _ipxInstance: ReturnType<typeof createIPX> | undefined;

const HTTP_STORAGE_MAX_AGE_SECONDS = 300;
const HTTP_STORAGE_TIMEOUT_MS = 10_000;
const HTTP_ERROR_STATUS_MIN = 400;

function parseHttpStorageMeta(response: { readonly headers: Headers }): {
  readonly mtime?: Date;
  readonly maxAge: number;
} {
  let maxAge = HTTP_STORAGE_MAX_AGE_SECONDS;
  const cacheControl = response.headers.get("cache-control");
  const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
  if (maxAgeMatch?.[1]) {
    maxAge = Number.parseInt(maxAgeMatch[1], 10);
  }

  const lastModified = response.headers.get("last-modified");
  const mtime = lastModified ? new Date(lastModified) : undefined;

  return { mtime, maxAge };
}

function createPinnedHttpStorage(): IPXStorage {
  return {
    name: "ipx:pinned-http",
    async getMeta(id, options) {
      const source = getValidatedSourceFromOptions(options);
      assertStorageIdMatchesValidatedSource(id, source);

      try {
        const response = await fetchPinnedUpstream(source, {
          method: "HEAD",
          signal: AbortSignal.timeout(HTTP_STORAGE_TIMEOUT_MS),
        });
        return parseHttpStorageMeta(response);
      } catch {
        return {};
      }
    },
    async getData(id, options) {
      const source = getValidatedSourceFromOptions(options);
      assertStorageIdMatchesValidatedSource(id, source);

      const response = await fetchPinnedUpstream(source, {
        method: "GET",
        signal: AbortSignal.timeout(HTTP_STORAGE_TIMEOUT_MS),
      });
      if (response.status >= HTTP_ERROR_STATUS_MIN) {
        throw new UpstreamFetchError(
          `Upstream image fetch failed with status ${response.status}`,
          response.status,
        );
      }

      return response.body;
    },
  };
}

export function getProjectIPX() {
  _ipxInstance ??= createIPX({
    storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
    httpStorage: createPinnedHttpStorage(),
  });
  return _ipxInstance;
}
