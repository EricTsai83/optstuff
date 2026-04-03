/**
 * Domain and signature validation utilities for IPX service
 *
 * Security Model:
 * - Signed URLs: All requests must have a valid signature created with the API key's secret
 * - Allowlist-only: Only domains explicitly listed in the API key's allowedSourceDomains are permitted
 * - Production: Empty allowlist = reject all requests (fail closed)
 * - Development: Empty allowlist = allow all (for local testing convenience)
 */

const isDevelopment = process.env.NODE_ENV === "development";

/** Strip an optional "http://" or "https://" prefix, returning the bare host. */
function stripProtocol(domain: string) {
  return domain.replace(/^https?:\/\//, "");
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
 * When the referer is absent (null), the request is allowed. A missing referer
 * typically indicates a server-to-server call, a privacy-stripping browser
 * policy, or a direct tool request — none of which are hotlinking. The signed
 * URL already authenticates the request; referer validation only guards against
 * browser-based hotlinking where the header IS reliably sent by the browser.
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
  if (!referer) return true;

  try {
    const refererUrl = new URL(referer);
    const refererProtocol = refererUrl.protocol; // "http:" or "https:"
    const refererHost = refererUrl.hostname;

    return allowedDomains.some((entry) => {
      const protoMatch = /^(https?):\/\//.exec(entry);

      if (protoMatch) {
        const allowedProtocol = `${protoMatch[1]}:`;
        if (refererProtocol !== allowedProtocol) return false;

        const hostPart = entry.slice(protoMatch[0].length);
        if (hostPart.startsWith("*.")) {
          const base = hostPart.slice(2);
          return refererHost === base || refererHost.endsWith(`.${base}`);
        }
        return refererHost === hostPart;
      }

      // Legacy: bare hostname without protocol — match any protocol
      if (entry.startsWith("*.")) {
        const base = entry.slice(2);
        return refererHost === base || refererHost.endsWith(`.${base}`);
      }
      return refererHost === entry;
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
 * - Development: Empty allowlist = allow all (including localhost) for testing convenience.
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

  // Strip protocol prefix so entries like "https://example.com" match hostname "example.com"
  return allowedDomains.some((raw) => {
    const domain = stripProtocol(raw);
    return sourceHost === domain || sourceHost.endsWith(`.${domain}`);
  });
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
