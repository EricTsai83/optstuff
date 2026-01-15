import path from "path";
import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";

/**
 * 允許的網域白名單
 *
 * 為了防止 SSRF 攻擊，僅允許從以下網域載入圖片：
 * - 生產環境：僅允許 optstuff.vercel.app
 * - 開發環境：允許 optstuff.vercel.app 和 localhost（僅用於開發測試）
 */
const getAllowedDomains = (): string[] => {
  const productionDomains = ["optstuff.vercel.app"];

  // 開發環境允許 localhost（僅用於本地開發）
  if (process.env.NODE_ENV !== "production") {
    return [...productionDomains, "localhost"];
  }

  return productionDomains;
};

/**
 * IPX 圖片處理實例
 *
 * 支援：
 * - 本地檔案系統存儲（public 目錄）
 * - HTTP 遠端圖片（僅允許白名單中的域名，防止 SSRF 攻擊）
 */
export const ipx = createIPX({
  alias: {
    optstuff: "https://optstuff.vercel.app",
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    domains: getAllowedDomains(),
  }),
});
