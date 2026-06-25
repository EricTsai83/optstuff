import { Buffer } from "node:buffer";
import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { isIP } from "node:net";

import type { ValidatedSourceUrl } from "@/server/lib/validators";

const DEFAULT_HTTP_PORT = 80;
const DEFAULT_HTTPS_PORT = 443;
const REDIRECT_STATUS_MIN = 300;
const REDIRECT_STATUS_MAX = 399;
const ERROR_STATUS_MIN = 400;

export const VALIDATED_SOURCE_OPTION = "validatedSource";

export type PinnedUpstreamRequestOptions = {
  readonly [VALIDATED_SOURCE_OPTION]: ValidatedSourceUrl;
};

export type PinnedUpstreamMethod = "GET" | "HEAD";

export type PinnedUpstreamResponse = {
  readonly status: number;
  readonly headers: Headers;
  readonly body: ArrayBuffer;
};
type PinnedRequestOptions = http.RequestOptions & {
  servername?: string;
};

export class UpstreamFetchError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "UpstreamFetchError";
    this.statusCode = statusCode;
  }
}

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
}

function getRequestPort(url: URL): number {
  if (!url.port) {
    return url.protocol === "https:" ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT;
  }

  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new UpstreamFetchError("Invalid upstream port", 400);
  }
  return port;
}

function headersFromIncoming(rawHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(rawHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
      continue;
    }
    if (typeof value === "string") {
      headers.set(name, value);
    }
  }
  return headers;
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

function parseStorageId(id: string): URL | null {
  try {
    return new URL(id);
  } catch {
    try {
      return new URL(decodeURIComponent(id));
    } catch {
      return null;
    }
  }
}

function isValidatedSourceAddress(
  value: unknown,
): value is ValidatedSourceUrl["addresses"][number] {
  return (
    typeof value === "object" &&
    value !== null &&
    "address" in value &&
    "family" in value &&
    typeof value.address === "string" &&
    (value.family === 4 || value.family === 6)
  );
}

function isValidatedSourceUrl(value: unknown): value is ValidatedSourceUrl {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "addresses" in value &&
    value.url instanceof URL &&
    Array.isArray(value.addresses) &&
    value.addresses.every(isValidatedSourceAddress)
  );
}

export function getValidatedSourceFromOptions(
  options: Record<string, unknown> | undefined,
): ValidatedSourceUrl {
  const value = options?.[VALIDATED_SOURCE_OPTION];
  if (!isValidatedSourceUrl(value)) {
    throw new UpstreamFetchError("Missing pinned upstream validation", 500);
  }

  return value;
}

export function assertStorageIdMatchesValidatedSource(
  id: string,
  source: ValidatedSourceUrl,
): void {
  const parsed = parseStorageId(id);
  if (parsed?.href !== source.url.href) {
    throw new UpstreamFetchError("Pinned upstream URL mismatch", 403);
  }
}

export async function fetchPinnedUpstream(
  source: ValidatedSourceUrl,
  options: {
    readonly method: PinnedUpstreamMethod;
    readonly signal?: AbortSignal;
  },
): Promise<PinnedUpstreamResponse> {
  const address = source.addresses[0];
  if (!address) {
    throw new UpstreamFetchError("Missing pinned upstream address", 500);
  }

  const url = source.url;
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UpstreamFetchError("Unsupported upstream protocol", 400);
  }

  const sourceHostname = normalizeHostname(url.hostname);
  const requestOptions: PinnedRequestOptions = {
    protocol: url.protocol,
    hostname: address.address,
    port: getRequestPort(url),
    method: options.method,
    path: `${url.pathname}${url.search}`,
    agent: false,
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      "Accept-Encoding": "identity",
      Host: url.host,
    },
    signal: options.signal,
  };

  if (url.protocol === "https:" && isIP(sourceHostname) === 0) {
    requestOptions.servername = sourceHostname;
  }

  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(requestOptions, (response) => {
      const status = response.statusCode ?? 502;
      const headers = headersFromIncoming(response.headers);

      if (status >= REDIRECT_STATUS_MIN && status <= REDIRECT_STATUS_MAX) {
        response.resume();
        reject(new UpstreamFetchError("Upstream redirect is not allowed", 502));
        return;
      }

      if (options.method === "HEAD" || status >= ERROR_STATUS_MIN) {
        response.resume();
        response.on("end", () => {
          resolve({ status, headers, body: new ArrayBuffer(0) });
        });
        return;
      }

      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve({
          status,
          headers,
          body: toArrayBuffer(Buffer.concat(chunks)),
        });
      });
    });

    request.on("error", reject);
    request.end();
  });
}
