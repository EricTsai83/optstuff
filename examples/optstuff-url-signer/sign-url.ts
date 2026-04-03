import { createHmac } from "node:crypto";

type Format = "webp" | "avif" | "png" | "jpg";
type Fit = "cover" | "contain" | "fill";

type CliOptions = {
  imageUrl: string;
  width: number;
  height?: number;
  quality?: number;
  format?: Format;
  fit?: Fit;
  expiresIn?: number;
};

const allowedFormats = new Set<Format>(["webp", "avif", "png", "jpg"]);
const allowedFits = new Set<Fit>(["cover", "contain", "fill"]);
const invalidEnvPlaceholders: Record<string, readonly string[]> = {
  OPTSTUFF_BASE_URL: ["https://your-site-url.com"],
  OPTSTUFF_PROJECT_SLUG: ["my-project"],
  OPTSTUFF_PUBLIC_KEY: ["pk_xxx"],
  OPTSTUFF_SECRET_KEY: ["sk_xxx"],
};

function printHelp(): void {
  console.log(`OptStuff URL signer (TypeScript)

Usage:
  bun run sign:url -- [options]

Options:
  --image-url <url>    Source image URL (default: Unsplash sample)
  --width <number>     Width in pixels (default: 400)
  --height <number>    Height in pixels
  --quality <1-100>    Output quality
  --format <value>     webp | avif | png | jpg (default: webp)
  --fit <value>        cover | contain | fill
  --expires-in <sec>   Signature lifetime in seconds
  --help               Show this help

Environment (.env):
  OPTSTUFF_BASE_URL
  OPTSTUFF_PROJECT_SLUG
  OPTSTUFF_PUBLIC_KEY
  OPTSTUFF_SECRET_KEY
`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  const placeholders = invalidEnvPlaceholders[name] ?? [];
  if (!value?.trim() || placeholders.includes(value)) {
    throw new Error(
      `Missing or invalid environment variable: ${name}. Set it in examples/optstuff-url-signer/.env`,
    );
  }
  return value;
}

function parsePositiveInt(
  raw: string | undefined,
  key: string,
  allowZero = false,
): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`Invalid ${key}: "${raw}". Expected an integer.`);
  }
  if (allowZero ? value < 0 : value <= 0) {
    throw new Error(
      `Invalid ${key}: "${raw}". Expected ${allowZero ? ">= 0" : "> 0"}.`,
    );
  }
  return value;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    width: 400,
    format: "webp",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--image-url") {
      if (!next) {
        throw new Error("Missing value for --image-url");
      }
      options.imageUrl = next;
      i += 1;
      continue;
    }

    if (arg === "--width") {
      options.width = parsePositiveInt(next, "--width", true);
      i += 1;
      continue;
    }

    if (arg === "--height") {
      options.height = parsePositiveInt(next, "--height", true);
      i += 1;
      continue;
    }

    if (arg === "--quality") {
      const quality = parsePositiveInt(next, "--quality");
      if (quality < 1 || quality > 100) {
        throw new Error(
          `Invalid --quality: "${next}". Expected a value between 1 and 100.`,
        );
      }
      options.quality = quality;
      i += 1;
      continue;
    }

    if (arg === "--format") {
      if (!next || !allowedFormats.has(next as Format)) {
        throw new Error(
          `Invalid --format: "${next}". Allowed values: ${[...allowedFormats].join(", ")}`,
        );
      }
      options.format = next as Format;
      i += 1;
      continue;
    }

    if (arg === "--fit") {
      if (!next || !allowedFits.has(next as Fit)) {
        throw new Error(
          `Invalid --fit: "${next}". Allowed values: ${[...allowedFits].join(", ")}`,
        );
      }
      options.fit = next as Fit;
      i += 1;
      continue;
    }

    if (arg === "--expires-in") {
      options.expiresIn = parsePositiveInt(next, "--expires-in");
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizeImageUrl(imageUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("Invalid --image-url: must be a valid absolute URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid --image-url: protocol must be http or https.");
  }

  const pathname = parsed.pathname;
  const query = parsed.search.startsWith("?")
    ? parsed.search.slice(1)
    : parsed.search;
  const encodedQuery = query ? `%3F${encodeURIComponent(query)}` : "";
  const hostWithPort = `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;

  // Strip protocol — the server's parseIpxPath reconstructs it via ensureProtocol.
  // Must match the Next.js example (examples/nextjs/src/lib/optstuff-core.ts).
  return `${hostWithPort}${pathname}${encodedQuery}`;
}

function buildOperations(options: CliOptions): string {
  const parts = [`w_${options.width}`];

  if (options.height !== undefined) {
    parts.push(`h_${options.height}`);
  }
  if (options.quality !== undefined) {
    parts.push(`q_${options.quality}`);
  }
  if (options.format) {
    parts.push(`f_${options.format}`);
  }
  if (options.fit) {
    parts.push(`fit_${options.fit}`);
  }

  return parts.length > 0 ? parts.join(",") : "_";
}

function createSignedUrl(options: CliOptions): string {
  const baseUrl = requireEnv("OPTSTUFF_BASE_URL").replace(/\/+$/, "");
  const projectSlug = requireEnv("OPTSTUFF_PROJECT_SLUG");
  const publicKey = requireEnv("OPTSTUFF_PUBLIC_KEY");
  const secretKey = requireEnv("OPTSTUFF_SECRET_KEY");

  const operations = buildOperations(options);
  const imagePath = normalizeImageUrl(options.imageUrl);
  const signingPath = `${operations}/${imagePath}`;
  const apiPath = `/api/v1/${projectSlug}/${signingPath}`;

  const params = new URLSearchParams();
  params.set("key", publicKey);

  let signPayload = signingPath;
  if (options.expiresIn) {
    const exp = Math.floor(Date.now() / 1000) + options.expiresIn;
    params.set("exp", exp.toString());
    signPayload = `${signingPath}?exp=${exp}`;
  }

  const signature = createHmac("sha256", secretKey)
    .update(signPayload)
    .digest("base64url")
    .slice(0, 32);

  params.set("sig", signature);
  return `${baseUrl}${apiPath}?${params.toString()}`;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const signedUrl = createSignedUrl(options);
  console.log(signedUrl);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Failed to generate signed URL: ${message}`);
  process.exit(1);
}
