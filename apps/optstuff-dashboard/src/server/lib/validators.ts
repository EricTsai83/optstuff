import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Domain and signature validation utilities for IPX service
 *
 * Security Model:
 * - Signed URLs: All requests must have a valid signature created with the API key's secret
 * - Allowlist-only: Only domains explicitly listed in the API key's allowedSourceDomains are permitted
 * - Production: Empty allowlist = reject all requests (fail closed)
 * - Development: Empty allowlist skips tenant allowlist matching but still requires public upstream targets
 */

const isDevelopment = process.env.NODE_ENV === "development";

type DomainRule = {
  readonly protocol: "http:" | "https:" | undefined;
  readonly hostname: string;
  readonly wildcard: boolean;
  readonly port: string | undefined;
};

type DomainNormalizationResult =
  | { readonly ok: true; readonly value: string; readonly rule: DomainRule }
  | { readonly ok: false; readonly error: string };

export type ValidatedSourceAddress = {
  readonly address: string;
  readonly family: 4 | 6;
};

export type ValidatedSourceUrl = {
  readonly url: URL;
  readonly addresses: readonly ValidatedSourceAddress[];
};

type SourceUrlValidationResult =
  | { readonly ok: true; readonly source: ValidatedSourceUrl }
  | { readonly ok: false; readonly error: string };
type DnsLookupAddress = {
  readonly address: string;
  readonly family: number;
};

const UNSAFE_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);
const SOURCE_DOMAIN_ERROR =
  "Source domains must be public http(s) hostnames. Local, private, wildcard, path, query, and fragment entries are not allowed.";
const REFERER_DOMAIN_ERROR =
  "Referer domains must be http(s) origins without paths, queries, or fragments.";

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
}

function isValidDomainName(hostname: string): boolean {
  if (hostname.length < 1 || hostname.length > 253) return false;
  if (hostname === "localhost") return true;
  if (isIP(hostname)) return true;

  const labels = hostname.split(".");
  if (labels.length < 2) return false;

  return labels.every((label) => {
    return (
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    );
  });
}

function parseDomainRule(raw: string): DomainRule | null {
  const entry = raw.trim().toLowerCase();
  if (!entry || /\s/.test(entry)) return null;

  const protocolMatch = /^(https?):\/\//.exec(entry);
  const protocol = protocolMatch
    ? (`${protocolMatch[1]}:` as "http:" | "https:")
    : undefined;
  let hostAndPort = protocolMatch
    ? entry.slice(protocolMatch[0].length)
    : entry;

  if (
    !hostAndPort ||
    hostAndPort.includes("/") ||
    hostAndPort.includes("?") ||
    hostAndPort.includes("#")
  ) {
    return null;
  }

  const wildcard = hostAndPort.startsWith("*.");
  if (wildcard) {
    hostAndPort = hostAndPort.slice(2);
  }

  if (!hostAndPort) return null;

  let parsed: URL;
  try {
    parsed = new URL(`${protocol ?? "https:"}//${hostAndPort}`);
  } catch {
    return null;
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    return null;
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname || !isValidDomainName(hostname)) return null;

  if (wildcard && isIP(hostname)) return null;

  return {
    protocol,
    hostname,
    wildcard,
    port: parsed.port || undefined,
  };
}

function formatDomainRule(rule: DomainRule): string {
  const protocol = rule.protocol ? `${rule.protocol}//` : "";
  const wildcard = rule.wildcard ? "*." : "";
  const hostname =
    isIP(rule.hostname) === 6 ? `[${rule.hostname}]` : rule.hostname;
  const port = rule.port ? `:${rule.port}` : "";
  return `${protocol}${wildcard}${hostname}${port}`;
}

function ipv4ToNumber(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

function isIPv4InCidr(address: number, base: number, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (address & mask) === (base & mask);
}

function isUnsafeIPv4(address: string): boolean {
  const numeric = ipv4ToNumber(address);
  if (numeric === null) return true;

  const ranges: ReadonlyArray<readonly [string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];

  return ranges.some(([baseAddress, prefix]) => {
    const base = ipv4ToNumber(baseAddress);
    return base !== null && isIPv4InCidr(numeric, base, prefix);
  });
}

function parseIPv6(address: string): bigint | null {
  const normalized = normalizeHostname(address).split("%")[0] ?? "";
  if (!normalized || normalized.includes(":::")) return null;

  const ipv4Match = /(^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(normalized);
  let input = normalized;
  if (ipv4Match) {
    const ipv4 = ipv4ToNumber(ipv4Match[2]!);
    if (ipv4 === null) return null;
    const high = ((ipv4 >>> 16) & 0xffff).toString(16);
    const low = (ipv4 & 0xffff).toString(16);
    input = `${normalized.slice(0, ipv4Match.index + ipv4Match[1]!.length)}${high}:${low}`;
  }

  const pieces = input.split("::");
  if (pieces.length > 2) return null;

  const left = pieces[0] ? pieces[0].split(":") : [];
  const right = pieces[1] ? pieces[1].split(":") : [];
  if (left.some((part) => part === "") || right.some((part) => part === "")) {
    return null;
  }

  const missing = 8 - left.length - right.length;
  if (pieces.length === 1 && missing !== 0) return null;
  if (pieces.length === 2 && missing < 1) return null;

  const hextets = [
    ...left,
    ...Array.from({ length: Math.max(0, missing) }, () => "0"),
    ...right,
  ];
  if (hextets.length !== 8) return null;

  let value = 0n;
  for (const hextet of hextets) {
    if (!/^[0-9a-f]{1,4}$/i.test(hextet)) return null;
    value = (value << 16n) + BigInt(Number.parseInt(hextet, 16));
  }
  return value;
}

function isIPv6InCidr(address: bigint, base: bigint, prefix: number): boolean {
  const bits = 128n;
  const hostBits = bits - BigInt(prefix);
  const mask = ((1n << bits) - 1n) ^ ((1n << hostBits) - 1n);
  return (address & mask) === (base & mask);
}

function extractIPv4MappedIPv6(address: bigint): string | null {
  const mappedPrefix = parseIPv6("::ffff:0:0");
  if (!mappedPrefix || !isIPv6InCidr(address, mappedPrefix, 96)) return null;

  const ipv4 = Number(address & 0xffffffffn);
  return [
    (ipv4 >>> 24) & 255,
    (ipv4 >>> 16) & 255,
    (ipv4 >>> 8) & 255,
    ipv4 & 255,
  ].join(".");
}

function isUnsafeIPv6(address: string): boolean {
  const numeric = parseIPv6(address);
  if (numeric === null) return true;

  const mappedIPv4 = extractIPv4MappedIPv6(numeric);
  if (mappedIPv4) return isUnsafeIPv4(mappedIPv4);

  const ranges: ReadonlyArray<readonly [string, number]> = [
    ["::", 128],
    ["::1", 128],
    ["::ffff:0:0", 96],
    ["64:ff9b::", 96],
    ["100::", 64],
    ["2001:db8::", 32],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
  ];

  return ranges.some(([baseAddress, prefix]) => {
    const base = parseIPv6(baseAddress);
    return base !== null && isIPv6InCidr(numeric, base, prefix);
  });
}

function isUnsafeIpAddress(address: string): boolean {
  const normalized = normalizeHostname(address);
  const version = isIP(normalized);
  if (version === 4) return isUnsafeIPv4(normalized);
  if (version === 6) return isUnsafeIPv6(normalized);
  return true;
}

function isUnsafeHostnameLiteral(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return true;
  if (UNSAFE_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost")) {
    return true;
  }
  return isIP(normalized) ? isUnsafeIpAddress(normalized) : false;
}

function toValidatedSourceAddress(
  record: DnsLookupAddress,
): ValidatedSourceAddress | null {
  const normalized = normalizeHostname(record.address);
  const family = isIP(normalized);
  if (family !== 4 && family !== 6) return null;
  if (family !== record.family) return null;
  return { address: normalized, family };
}

async function validatePublicHostname(
  hostname: string,
  options: { readonly requireDnsResolution: boolean },
): Promise<
  | { readonly ok: true; readonly addresses: readonly ValidatedSourceAddress[] }
  | { readonly ok: false; readonly error: string }
> {
  const normalized = normalizeHostname(hostname);
  if (isUnsafeHostnameLiteral(normalized)) {
    return {
      ok: false,
      error: "Source hostname resolves to a private address",
    };
  }

  const literalFamily = isIP(normalized);
  if (literalFamily === 4 || literalFamily === 6) {
    return {
      ok: true,
      addresses: [{ address: normalized, family: literalFamily }],
    };
  }

  let addresses: DnsLookupAddress[];
  try {
    addresses = await lookup(normalized, { all: true, verbatim: true });
  } catch {
    return options.requireDnsResolution
      ? { ok: false, error: "Source hostname could not be resolved" }
      : { ok: true, addresses: [] };
  }

  if (addresses.length === 0) {
    return options.requireDnsResolution
      ? { ok: false, error: "Source hostname could not be resolved" }
      : { ok: true, addresses: [] };
  }

  const publicAddresses: ValidatedSourceAddress[] = [];
  for (const record of addresses) {
    const address = toValidatedSourceAddress(record);
    if (!address || isUnsafeIpAddress(address.address)) {
      return {
        ok: false,
        error: "Source hostname resolves to a private address",
      };
    }
    publicAddresses.push(address);
  }

  if (publicAddresses.length === 0) {
    return {
      ok: false,
      error: "Source hostname resolves to a private address",
    };
  }

  return { ok: true, addresses: publicAddresses };
}

function doesUrlMatchSourceRule(url: URL, rule: DomainRule): boolean {
  const sourceProtocol = url.protocol as "http:" | "https:";
  if (rule.protocol && sourceProtocol !== rule.protocol) return false;

  const sourcePort = url.port || undefined;
  if (rule.port !== sourcePort) return false;

  const sourceHost = normalizeHostname(url.hostname);
  return (
    sourceHost === rule.hostname || sourceHost.endsWith(`.${rule.hostname}`)
  );
}

function doesRefererMatchRule(referer: URL, rule: DomainRule): boolean {
  const refererProtocol = referer.protocol as "http:" | "https:";
  if (rule.protocol && refererProtocol !== rule.protocol) return false;
  if (rule.port && referer.port !== rule.port) return false;

  const refererHost = normalizeHostname(referer.hostname);
  if (rule.wildcard) {
    return (
      refererHost === rule.hostname || refererHost.endsWith(`.${rule.hostname}`)
    );
  }

  return refererHost === rule.hostname;
}

export function normalizeSourceDomainEntry(
  raw: string,
): DomainNormalizationResult {
  const parsed = parseDomainRule(raw);
  if (!parsed || parsed.wildcard || isUnsafeHostnameLiteral(parsed.hostname)) {
    return { ok: false, error: SOURCE_DOMAIN_ERROR };
  }

  return {
    ok: true,
    rule: parsed,
    value: formatDomainRule(parsed),
  };
}

export function normalizeRefererDomainEntry(
  raw: string,
): DomainNormalizationResult {
  const parsed = parseDomainRule(raw);
  if (!parsed) {
    return { ok: false, error: REFERER_DOMAIN_ERROR };
  }

  return {
    ok: true,
    rule: parsed,
    value: formatDomainRule(parsed),
  };
}

export async function validateConfiguredSourceDomains(
  entries: readonly string[],
): Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: string }
> {
  for (const entry of entries) {
    const normalized = normalizeSourceDomainEntry(entry);
    if (!normalized.ok) return normalized;

    const safety = await validatePublicHostname(normalized.rule.hostname, {
      requireDnsResolution: false,
    });
    if (!safety.ok) return safety;
  }

  return { ok: true };
}

/**
 * Validate if the referer is in the allowed origins list.
 *
 * Each allowed entry must include a protocol, e.g. "https://example.com" or
 * "http://localhost". The referer's protocol and hostname are both checked.
 * Wildcard prefixes ("https://*.example.com") match any subdomain.
 *
 * Legacy entries without a protocol are treated as hostname-only and matched
 * against any protocol for backwards compatibility.
 *
 * @param referer - The referer header value
 * @param allowedDomains - List of allowed origins (null or empty = allow all)
 * @returns true if the referer is allowed
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: readonly string[] | null,
) {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!referer) return false;

  try {
    const refererUrl = new URL(referer);
    return allowedDomains.some((entry) => {
      const rule = parseDomainRule(entry);
      return rule ? doesRefererMatchRule(refererUrl, rule) : false;
    });
  } catch {
    return false;
  }
}

/**
 * Validate if the source domain is in the allowed domains list.
 *
 * Security: Allowlist-only approach.
 * - Production: Only explicitly allowed domains are permitted. Empty allowlist = reject all.
 * - Development: Empty allowlist = allow all for this legacy hostname-only check.
 *   Full URL validation still requires public, resolvable upstream targets.
 *
 * @param sourceHost - The hostname of the image source
 * @param allowedDomains - List of allowed domains (empty = reject all in production)
 * @returns true if the source domain is allowed
 */
export function validateSourceDomain(
  sourceHost: string,
  allowedDomains: readonly string[] | null,
) {
  // Empty allowlist: reject all in production, allow all in development
  if (!allowedDomains || allowedDomains.length === 0) {
    return isDevelopment;
  }

  const normalizedSourceHost = normalizeHostname(sourceHost);
  if (isUnsafeHostnameLiteral(normalizedSourceHost)) return false;

  return allowedDomains.some((raw) => {
    const rule = parseDomainRule(raw);
    if (!rule) return false;
    return (
      normalizedSourceHost === rule.hostname ||
      normalizedSourceHost.endsWith(`.${rule.hostname}`)
    );
  });
}

export async function validateSourceUrl(
  imageUrl: string,
  allowedDomains: readonly string[] | null,
): Promise<SourceUrlValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return { ok: false, error: "Invalid source URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Source URL must use http or https" };
  }

  if (!allowedDomains || allowedDomains.length === 0) {
    if (!isDevelopment) {
      return { ok: false, error: "No source domains are configured" };
    }

    const safety = await validatePublicHostname(parsed.hostname, {
      requireDnsResolution: true,
    });
    if (!safety.ok) return safety;

    return {
      ok: true,
      source: { url: parsed, addresses: safety.addresses },
    };
  }

  const allowed = allowedDomains.some((entry) => {
    const rule = parseDomainRule(entry);
    return rule ? doesUrlMatchSourceRule(parsed, rule) : false;
  });

  if (!allowed) {
    return { ok: false, error: "Source domain not allowed" };
  }

  const safety = await validatePublicHostname(parsed.hostname, {
    requireDnsResolution: true,
  });
  if (!safety.ok) return safety;

  return {
    ok: true,
    source: { url: parsed, addresses: safety.addresses },
  };
}

/**
 * Safely parse a Unix timestamp, returning undefined for invalid values.
 * Only accepts finite positive integers.
 */
function safeParseTimestamp(value: string | null) {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Parse signature parameters from URL search params.
 *
 * @param searchParams - URL search params
 * @returns Parsed signature params or null if missing required params
 */
export function parseSignatureParams(searchParams: URLSearchParams) {
  const publicKey = searchParams.get("key");
  const signature = searchParams.get("sig");

  if (!publicKey || !signature) {
    return null;
  }

  return {
    publicKey,
    signature,
    expiresAt: safeParseTimestamp(searchParams.get("exp")),
  };
}

const MAX_DIMENSION = 8192;
const VALID_FORMATS = ["webp", "avif", "png", "jpg"] as const;
const VALID_FITS = ["cover", "contain", "fill"] as const;
const VALID_OPERATION_KEYS = ["w", "h", "q", "f", "fit", "s", "embed"] as const;
const VALID_FORMATS_SET = new Set<string>(VALID_FORMATS);
const VALID_FITS_SET = new Set<string>(VALID_FITS);
const VALID_OPERATION_KEYS_SET = new Set<string>(VALID_OPERATION_KEYS);

type ParsedOperations = Record<string, string | boolean>;
type OperationValidationResult = { ok: true } | { ok: false; error: string };

function parseBoundedInt(
  value: string | boolean,
  name: string,
  min: number,
  max: number,
): OperationValidationResult {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return {
      ok: false,
      error: `${name} must be an integer between ${min} and ${max}`,
    };
  }

  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return {
      ok: false,
      error: `${name} must be an integer between ${min} and ${max}`,
    };
  }

  return { ok: true };
}

/**
 * Validate signed IPX operations with strict bounds for potentially expensive transforms.
 *
 * This is defense-in-depth: clients should validate before signing, and the server validates
 * again before processing.
 */
export function validateSignedOperations(
  operations: ParsedOperations,
): OperationValidationResult {
  for (const key of Object.keys(operations)) {
    if (!VALID_OPERATION_KEYS_SET.has(key)) {
      return { ok: false, error: `Unsupported operation: ${key}` };
    }
  }

  if ("w" in operations) {
    const result = parseBoundedInt(operations.w, "w", 1, MAX_DIMENSION);
    if (!result.ok) return result;
  }

  if ("h" in operations) {
    const result = parseBoundedInt(operations.h, "h", 1, MAX_DIMENSION);
    if (!result.ok) return result;
  }

  if ("q" in operations) {
    const result = parseBoundedInt(operations.q, "q", 1, 100);
    if (!result.ok) return result;
  }

  if ("f" in operations) {
    const format = operations.f;
    if (typeof format !== "string" || !VALID_FORMATS_SET.has(format)) {
      return {
        ok: false,
        error: `f must be one of: ${VALID_FORMATS.join(",")}`,
      };
    }
  }

  if ("fit" in operations) {
    const fit = operations.fit;
    if (typeof fit !== "string" || !VALID_FITS_SET.has(fit)) {
      return {
        ok: false,
        error: `fit must be one of: ${VALID_FITS.join(",")}`,
      };
    }
  }

  if ("s" in operations) {
    const size = operations.s;
    if (typeof size !== "string") {
      return { ok: false, error: `s must be in format {w}x{h}` };
    }

    const match = /^(\d+)x(\d+)$/.exec(size);
    const width = match?.[1];
    const height = match?.[2];
    if (!width || !height) {
      return { ok: false, error: `s must be in format {w}x{h}` };
    }

    const widthValidation = parseBoundedInt(width, "s width", 1, MAX_DIMENSION);
    if (!widthValidation.ok) return widthValidation;
    const heightValidation = parseBoundedInt(
      height,
      "s height",
      1,
      MAX_DIMENSION,
    );
    if (!heightValidation.ok) return heightValidation;
  }

  if ("embed" in operations && operations.embed !== true) {
    return { ok: false, error: "embed must be a flag without value" };
  }

  return { ok: true };
}
