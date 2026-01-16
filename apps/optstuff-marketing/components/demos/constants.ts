/**
 * Shared image specification constants for demo components
 */

/** Original image width (px) */
export const ORIGINAL_WIDTH = 800;

/** Original image height (px) */
export const ORIGINAL_HEIGHT = 600;

/** Original image size (KB) - assumed PNG format */
export const ORIGINAL_SIZE_KB = 512;

/** Maximum preview area width (px) */
export const PREVIEW_MAX_WIDTH = 320;

/** Maximum preview area height (px) */
export const PREVIEW_MAX_HEIGHT = 240;

/** Size estimates for format conversion */
export const FORMAT_SIZES = {
  png: { size: "512 KB", savings: "0%" },
  jpeg: { size: "320 KB", savings: "37%" },
  webp: { size: "142 KB", savings: "72%" },
  avif: { size: "98 KB", savings: "81%" },
} as const;

/**
 * Get the base URL for image assets based on environment
 *
 * @param includeProtocol - Whether to include the protocol (http:// or https://)
 * @returns The domain with or without protocol
 */
function getDomain(includeProtocol = false): string {
  const domain =
    process.env.NODE_ENV === "production"
      ? "optstuff.vercel.app"
      : "localhost:3024";

  if (!includeProtocol) {
    return domain;
  }

  // localhost uses http://, other domains use https://
  if (domain.startsWith("localhost")) {
    return `http://${domain}`;
  }

  return `https://${domain}`;
}

/** Image path used in demos */
export const DEMO_IMAGE = `${getDomain()}/demo-image.png`;

export const DEMO_IMAGE_URL = `${getDomain(true)}/demo-image.png`;

export const QUALITY_DEMO_IMAGE = `${getDomain()}/demo-image.webp`;
