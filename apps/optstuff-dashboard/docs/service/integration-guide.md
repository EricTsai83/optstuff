# 整合教學

本文件說明如何在你的專案中整合 OptStuff 圖片優化服務。

## 整合前須知

```
⚠️ 重要安全原則

1. secretKey 必須保密
   - 只能存在伺服器端（環境變數）
   - 絕對不能出現在前端 JavaScript 中
   - 絕對不能提交到 Git

2. URL 簽名必須在伺服器端產生
   - Server Component ✅
   - API Route ✅
   - 前端 JavaScript ❌
```

## 環境變數設定

在你的 `.env` 或 `.env.local` 中添加：

```bash
# 伺服器端專用 — 機密！絕對不能有 NEXT_PUBLIC_ 前綴
IPX_SECRET_KEY="sk_your_secret_key_here"  # 建立 API Key 時取得

# 伺服器端專用 — 非機密，但僅在伺服器端使用，不需要 NEXT_PUBLIC_ 前綴
# publicKey 會出現在產生的 URL 中（?key=pk_...），本身不是秘密
IPX_PUBLIC_KEY="pk_abc123..."             # 建立 API Key 時取得

# 公開設定（可以有 NEXT_PUBLIC_ 前綴）
NEXT_PUBLIC_IPX_PROJECT_SLUG="your-project-slug"
NEXT_PUBLIC_IPX_ENDPOINT="https://your-optstuff-deployment.com/api/v1"
```

## 建立簽名工具函數

建立 `lib/ipx-signer.ts`（僅伺服器端）：

```typescript
// lib/ipx-signer.ts
// ⚠️ 此檔案只能在伺服器端使用

import crypto from "crypto";

const SECRET_KEY = process.env.IPX_SECRET_KEY!;
const PUBLIC_KEY = process.env.IPX_PUBLIC_KEY!;
const IPX_ENDPOINT = process.env.NEXT_PUBLIC_IPX_ENDPOINT!;
const PROJECT_SLUG = process.env.NEXT_PUBLIC_IPX_PROJECT_SLUG!;

/**
 * 產生簽名過的圖片 URL
 * 
 * @param imagePath - 原始圖片路徑 (例: "images.example.com/photo.jpg")
 * @param operations - 圖片操作 (例: "w_800,f_webp")
 * @param expiresIn - 簽名有效秒數 (可選)
 * @returns 簽名過的完整 URL
 * 
 * @example
 * // 基本使用
 * signIpxUrl("cdn.example.com/photo.jpg", "w_800,f_webp")
 * // → https://optstuff.com/api/v1/my-blog/w_800,f_webp/cdn.example.com/photo.jpg?key=pk_xxx&sig=abc
 * 
 * @example
 * // 帶過期時間
 * signIpxUrl("cdn.example.com/photo.jpg", "w_800", 3600) // 1 小時後過期
 */
export function signIpxUrl(
  imagePath: string,
  operations: string = "_",
  expiresIn?: number
): string {
  // 1. 組合路徑
  const path = `${operations}/${imagePath}`;
  
  // 2. 計算過期時間（如果有）
  const exp = expiresIn 
    ? Math.floor(Date.now() / 1000) + expiresIn 
    : undefined;
  
  // 3. 產生簽名
  //    payload = exp ? "w_800/image.jpg?exp=1234567890" : "w_800/image.jpg"
  const payload = exp ? `${path}?exp=${exp}` : path;
  const sig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);
  
  // 4. 組合 URL
  let url = `${IPX_ENDPOINT}/${PROJECT_SLUG}/${path}?key=${PUBLIC_KEY}&sig=${sig}`;
  if (exp) url += `&exp=${exp}`;
  
  return url;
}
```

## 在 Next.js 中使用

### 方法 1: Server Component（推薦）

```tsx
// app/page.tsx (Server Component)
import { signIpxUrl } from "@/lib/ipx-signer";

export default function HomePage() {
  // ✅ 在伺服器端簽名
  const heroImage = signIpxUrl(
    "cdn.example.com/hero.jpg",
    "w_1200,f_webp",
    86400 // 24 小時
  );

  return (
    <main>
      <img 
        src={heroImage} 
        alt="Hero" 
        width={1200}
        height={600}
      />
    </main>
  );
}
```

### 方法 2: API Route + 前端呼叫

建立 API Route：

```typescript
// app/api/image-url/route.ts
import { signIpxUrl } from "@/lib/ipx-signer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const src = searchParams.get("src");
  const width = searchParams.get("w");
  const height = searchParams.get("h");
  const format = searchParams.get("f") || "webp";

  if (!src) {
    return NextResponse.json(
      { error: "Missing src parameter" },
      { status: 400 }
    );
  }

  // 組合操作
  const ops = [
    width && `w_${width}`,
    height && `h_${height}`,
    `f_${format}`,
  ].filter(Boolean).join(",");

  // 產生簽名 URL
  const signedUrl = signIpxUrl(src, ops, 3600);

  return NextResponse.json({ url: signedUrl });
}
```

前端呼叫：

```tsx
// components/OptimizedImage.tsx
"use client";

import { useState, useEffect } from "react";

type OptimizedImageProps = {
  readonly src: string;
  readonly width?: number;
  readonly alt: string;
};

export function OptimizedImage({ src, width, alt }: OptimizedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchUrl = async () => {
      const params = new URLSearchParams({ src });
      if (width) params.set("w", width.toString());
      
      const res = await fetch(`/api/image-url?${params}`);
      const { url } = await res.json();
      setImageUrl(url);
    };
    
    fetchUrl();
  }, [src, width]);

  if (!imageUrl) return <div>Loading...</div>;

  return <img src={imageUrl} alt={alt} width={width} />;
}
```

## 操作參數參考

| 參數 | 說明 | 範例 |
|-----|------|------|
| `w_{n}` | 寬度 | `w_800` → 800px 寬 |
| `h_{n}` | 高度 | `h_600` → 600px 高 |
| `s_{w}x{h}` | 尺寸 | `s_800x600` → 800x600 |
| `q_{n}` | 品質 (1-100) | `q_80` → 80% 品質 |
| `f_{format}` | 格式 | `f_webp`, `f_avif`, `f_png` |
| `_` | 無操作 | 僅轉發原圖 |

### 組合範例

```
w_800,f_webp           → 寬 800px，轉 WebP
w_400,h_300,q_85       → 400x300，品質 85%
s_1200x630,f_avif      → 1200x630，轉 AVIF（適合 OG Image）
```

## 常見問題排查

### 問題 1: 403 Invalid or expired signature

```
可能原因:
1. secretKey 不正確
2. 簽名計算方式有誤
3. exp 已過期

排查步驟:
1. 確認環境變數正確設定
2. 檢查 path 組合是否正確（operations/imageUrl）
3. 如果有 exp，確認時間戳格式（Unix 秒，不是毫秒）
```

**常見錯誤：**

```typescript
// ❌ 錯誤：使用毫秒
const exp = Date.now() + 3600000;

// ✅ 正確：使用秒
const exp = Math.floor(Date.now() / 1000) + 3600;
```

### 問題 2: 403 Forbidden: Source domain not allowed

```
可能原因:
圖片來源域名不在 API Key 的 allowedSourceDomains 中

解決方法:
1. 到 Dashboard 編輯 API Key
2. 在 "Allowed Source Domains" 中添加圖片來源域名
```

### 問題 3: 403 Forbidden: Invalid referer

```
可能原因:
請求的 Referer header 不在 Project 的 allowedRefererDomains 中

解決方法:
1. 到 Dashboard 編輯 Project
2. 在 "Allowed Referer Domains" 中添加你的網站域名
```

### 問題 4: secretKey 遺失

```
問題: secretKey 只會在建立或輪替時顯示一次

解決方法:
1. 到 Dashboard 使用「Rotate Key」輪替 API Key
2. 保存新的 secretKey
   （輪替會撤銷舊 key 並產生新 key，其他設定會保留）
```

### 問題 5: publicKey 遺失

```
問題: 忘記 publicKey（公鑰）

解決方法:
Dashboard API Key 列表頁會顯示遮罩的完整公鑰，
點擊旁邊的複製按鈕即可取得完整的 pk_... 公鑰。
```

## 安全檢查清單

在上線前，請確認：

- [ ] `secretKey`（`sk_...`）存在環境變數中，沒有 `NEXT_PUBLIC_` 前綴
- [ ] `publicKey`（`pk_...`）可以是公開的，但建議也放在環境變數中方便管理
- [ ] `.env` 檔案在 `.gitignore` 中
- [ ] 簽名邏輯只在 Server Component 或 API Route 中執行
- [ ] 前端程式碼中沒有出現 `secretKey`
- [ ] 已設定適當的 `exp` 過期時間
- [ ] 已設定適當的 Domain 白名單

## 延伸閱讀

- [請求驗證流程](./authentication.md) - 了解驗證細節
- [多層權限控管](./permissions.md) - 設定 Domain 白名單
- [安全最佳實踐](./security-best-practices.md) - 更多安全建議
