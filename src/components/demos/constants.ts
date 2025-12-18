/**
 * Demo 元件共用的圖片規格常數
 */

/** 原始圖片寬度 (px) */
export const ORIGINAL_WIDTH = 800;

/** 原始圖片高度 (px) */
export const ORIGINAL_HEIGHT = 600;

/** 原始圖片大小 (KB) - 假設為 PNG 格式 */
export const ORIGINAL_SIZE_KB = 512;

/** 預覽區域最大寬度 (px) */
export const PREVIEW_MAX_WIDTH = 320;

/** 預覽區域最大高度 (px) */
export const PREVIEW_MAX_HEIGHT = 240;

/** 格式轉換的大小估算 */
export const FORMAT_SIZES = {
  png: { size: "512 KB", savings: "0%" },
  jpeg: { size: "320 KB", savings: "37%" },
  webp: { size: "142 KB", savings: "72%" },
  avif: { size: "98 KB", savings: "81%" },
} as const;

/** Demo 使用的圖片路徑 */
export const DEMO_IMAGE = "/demo-image.png";

export const QUALITY_DEMO_IMAGE = "/demo-image.webp";
