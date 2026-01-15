import path from "path";
import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";

/**
 * IPX 圖片處理實例
 *
 * 支援：
 * - 本地檔案系統存儲（public 目錄）
 * - HTTP 遠端圖片（可配置允許的域名）
 */
export const ipx = createIPX({
  alias: {
    optstuff: "https://optstuff.vercel.app",
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    // 允許所有域名，生產環境可限制為特定域名
    allowAllDomains: true,
    // 或者指定允許的域名列表：
    // domains: ["example.com", "cdn.example.com"],
  }),
});
