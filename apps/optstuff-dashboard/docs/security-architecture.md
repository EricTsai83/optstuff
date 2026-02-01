# OptStuff API 安全架構與權限控管

本文件說明 OptStuff 圖片優化服務的完整安全架構，包含密鑰管理、請求驗證、權限控管等機制。

---

## 目錄

1. [系統架構概述](#1-系統架構概述)
2. [密鑰層級與用途](#2-密鑰層級與用途)
3. [API Key 生命週期](#3-api-key-生命週期)
4. [請求驗證流程](#4-請求驗證流程)
5. [資料加密機制](#5-資料加密機制)
6. [多層權限控管](#6-多層權限控管)
7. [安全最佳實踐](#7-安全最佳實踐)

---

## 1. 系統架構概述

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用戶層                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   Team A    │    │   Team B    │    │   Team C    │                  │
│  │  (Owner)    │    │  (Owner)    │    │  (Owner)    │                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │
│         │                  │                  │                          │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐                  │
│  │  Project 1  │    │  Project 3  │    │  Project 5  │                  │
│  │  Project 2  │    │  Project 4  │    │             │                  │
│  └──────┬──────┘    └─────────────┘    └─────────────┘                  │
│         │                                                                │
│  ┌──────┴──────┐                                                        │
│  │  API Key 1  │                                                        │
│  │  API Key 2  │                                                        │
│  │  API Key 3  │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Gateway                                    │
│                                                                          │
│  /api/v1/{projectSlug}/{operations}/{imageUrl}?key=...&sig=...&exp=... │
│                                                                          │
│  驗證層:                                                                 │
│  1. Project 存在性驗證                                                   │
│  2. API Key 有效性驗證                                                   │
│  3. 簽名驗證 (HMAC-SHA256)                                              │
│  4. Referer 域名驗證 (Project 級)                                        │
│  5. Source 域名驗證 (API Key 級)                                         │
│  6. 過期時間驗證                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          圖片處理引擎 (IPX)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 密鑰層級與用途

系統使用三層密鑰架構：

### 2.1 系統級密鑰

| 密鑰 | 儲存位置 | 用途 |
|------|---------|------|
| `API_KEY_ENCRYPTION_SECRET` | 環境變數 | 加密/解密資料庫中的敏感資料 |

```
環境變數: API_KEY_ENCRYPTION_SECRET="your-32-char-secret-key"
                        │
                        ▼
              ┌─────────────────────┐
              │   SHA-256 雜湊      │
              │   產生 256-bit 密鑰  │
              └─────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   AES-256-GCM       │
              │   加密/解密資料      │
              └─────────────────────┘
```

### 2.2 API Key 級密鑰

每個 API Key 包含兩個密鑰：

| 密鑰 | 格式 | 用途 | 儲存方式 |
|------|------|------|---------|
| `keyFull` | `pk_<64 hex chars>` | API Key 識別 | 加密後存 DB |
| `secretKey` | `sk_<64 hex chars>` | URL 簽名 | 加密後存 DB |
| `keyPrefix` | `pk_<8 chars>` | 快速查詢、顯示識別 | 明文存 DB |

### 2.3 密鑰關係圖

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    密鑰層級結構                                          │
└─────────────────────────────────────────────────────────────────────────┘

Level 0: 系統密鑰 (環境變數)
┌─────────────────────────────────────────────────────────────────────────┐
│  API_KEY_ENCRYPTION_SECRET                                              │
│  用途: 保護所有存在資料庫中的敏感資料                                    │
│  範圍: 整個系統唯一                                                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ 加密保護
                                ▼
Level 1: API Key 密鑰 (每個 API Key 一組)
┌─────────────────────────────────────────────────────────────────────────┐
│  keyFull (pk_xxx)          │ secretKey (sk_xxx)                        │
│  用途: 識別 API Key         │ 用途: 產生/驗證 URL 簽名                  │
│  公開: 可被知道             │ 公開: 必須保密                            │
└─────────────────────────────┴───────────────────────────────────────────┘
                                │ 用於簽名
                                ▼
Level 2: 請求簽名 (每個請求一個)
┌─────────────────────────────────────────────────────────────────────────┐
│  signature (sig)                                                        │
│  用途: 證明請求者擁有 secretKey                                          │
│  特性: 單向雜湊，無法反推 secretKey                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. API Key 生命週期

### 3.1 建立 API Key

```
┌─────────────────┐
│ 用戶請求建立     │
│ API Key         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ generateApiKey()│
│                 │
│ 產生:           │
│ - key (明文)    │
│ - keyPrefix     │
│ - secretKey     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ encryptApiKey() │
│                 │
│ 加密:           │
│ - keyFull       │
│ - secretKey     │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│ 存入資料庫       │          │ 回傳給用戶       │
│                 │          │ (只顯示一次!)    │
│ - keyPrefix     │          │                 │
│   (明文)        │          │ - key (明文)    │
│ - keyFull       │          │ - secretKey     │
│   (加密)        │          │   (明文)        │
│ - secretKey     │          │                 │
│   (加密)        │          │ ⚠️ 用戶必須保存  │
└─────────────────┘          └─────────────────┘
```

### 3.2 使用 API Key

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用戶端                                         │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ 1. 準備請求參數
         │    path = "w_800,f_webp/images.example.com/photo.jpg"
         │
         │ 2. 用 secretKey 產生簽名
         │    sig = HMAC-SHA256(secretKey, path)
         │
         │ 3. 組合 URL
         │    /api/v1/{slug}/{path}?key={keyPrefix}&sig={sig}&exp={exp}
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           伺服器端                                       │
│                                                                          │
│  1. 解析 URL 參數                                                        │
│     keyPrefix = "pk_abc123"                                             │
│     signature = "xyz789..."                                             │
│                                                                          │
│  2. 用 keyPrefix 查詢 API Key                                            │
│     SELECT * FROM api_keys WHERE key_prefix = 'pk_abc123'               │
│                                                                          │
│  3. 解密 secretKey                                                       │
│     secretKey = decryptApiKey(encryptedSecretKey)                       │
│                                                                          │
│  4. 驗證簽名                                                             │
│     expectedSig = HMAC-SHA256(secretKey, path)                          │
│     valid = (signature === expectedSig)                                  │
│                                                                          │
│  5. 處理圖片請求 (如果驗證通過)                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 撤銷 API Key

```
撤銷操作:
  UPDATE api_keys SET revoked_at = NOW() WHERE id = '...'

效果:
  - API Key 立即失效
  - 快取立即清除 (invalidateApiKeyCache)
  - 後續請求返回 401 Unauthorized
```

### 3.4 輪換 API Key

```
輪換 = 撤銷舊 Key + 建立新 Key

1. 撤銷舊 Key (保留記錄)
2. 建立新 Key (繼承設定)
3. 回傳新的 key 和 secretKey
```

---

## 4. 請求驗證流程

### 4.1 完整驗證流程

```
請求: GET /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg
      ?key=pk_abc123&sig=xyz789&exp=1706500000

┌─────────────────────────────────────────────────────────────────────────┐
│ Step 1: Project 驗證                                                    │
│                                                                          │
│ 檢查: projectSlug = "my-blog" 是否存在                                  │
│ 失敗: 404 Project not found                                             │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 2: 參數解析                                                        │
│                                                                          │
│ 解析: key, sig, exp 參數                                                │
│ 失敗: 401 Missing signature parameters                                  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 3: API Key 驗證                                                    │
│                                                                          │
│ 查詢: 用 keyPrefix 查找 API Key                                         │
│ 檢查: API Key 是否存在、未撤銷、屬於此 Project、未過期                   │
│ 失敗: 401 Invalid API key / API key has expired                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 4: 簽名驗證                                                        │
│                                                                          │
│ 解密: secretKey = decryptApiKey(encryptedSecretKey)                     │
│ 計算: expectedSig = HMAC-SHA256(secretKey, path)                        │
│ 比對: signature === expectedSig (constant-time comparison)              │
│ 失敗: 403 Invalid or expired signature                                  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 5: Referer 驗證 (Project 級)                                       │
│                                                                          │
│ 檢查: 請求的 Referer header 是否在允許列表中                            │
│ 設定: project.allowedRefererDomains                                     │
│ 失敗: 403 Forbidden: Invalid referer                                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 6: Source Domain 驗證 (API Key 級)                                 │
│                                                                          │
│ 檢查: 圖片來源域名是否在允許列表中                                       │
│ 設定: apiKey.allowedSourceDomains                                       │
│ 失敗: 403 Forbidden: Source domain not allowed                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 7: 圖片處理                                                        │
│                                                                          │
│ 執行: IPX 圖片優化                                                      │
│ 回傳: 優化後的圖片                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 錯誤回應表

| 錯誤碼 | 錯誤訊息 | 原因 |
|--------|---------|------|
| 400 | Invalid path format | URL 路徑格式錯誤 |
| 400 | Invalid image URL | 圖片 URL 無效 |
| 401 | Missing signature parameters | 缺少 key 或 sig 參數 |
| 401 | Invalid API key | API Key 不存在或已撤銷 |
| 401 | API key has expired | API Key 已過期 |
| 401 | API key does not belong to this project | API Key 不屬於此 Project |
| 403 | Invalid or expired signature | 簽名無效或已過期 |
| 403 | Forbidden: Invalid referer | Referer 不在允許列表 |
| 403 | Forbidden: Source domain not allowed | 圖片來源域名不在允許列表 |
| 404 | Project not found | Project 不存在 |
| 500 | Image processing failed | 圖片處理失敗 |

---

## 5. 資料加密機制

### 5.1 加密演算法

```
演算法: AES-256-GCM (Authenticated Encryption)

特性:
- AES-256: 256-bit 對稱加密，目前最安全的標準
- GCM 模式: 提供加密 + 認證，可檢測資料篡改
- 隨機 IV: 每次加密產生不同密文
- AuthTag: 驗證資料完整性
```

### 5.2 加密格式

```
加密後格式: {iv}:{authTag}:{ciphertext}

各部分:
- iv: 12 bytes (96 bits), base64 編碼
- authTag: 16 bytes (128 bits), base64 編碼
- ciphertext: 加密後的資料, base64 編碼

範例:
明文:    "pk_a1b2c3d4e5f6..."
加密後:  "MTIzNDU2Nzg5MDEy:YWJjZGVmZ2hpamtsbW5v:eHl6MTIzNDU2..."
```

### 5.3 加密流程

```typescript
function encryptApiKey(plaintext: string): string {
  // 1. 產生隨機 IV
  const iv = randomBytes(12);
  
  // 2. 從環境變數取得加密密鑰
  const key = SHA256(API_KEY_ENCRYPTION_SECRET);
  
  // 3. AES-256-GCM 加密
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = cipher.update(plaintext) + cipher.final();
  const authTag = cipher.getAuthTag();
  
  // 4. 組合輸出
  return `${base64(iv)}:${base64(authTag)}:${base64(ciphertext)}`;
}
```

### 5.4 解密流程

```typescript
function decryptApiKey(encrypted: string): string {
  // 1. 分割並解碼
  const [iv, authTag, ciphertext] = encrypted.split(':').map(base64Decode);
  
  // 2. 取得加密密鑰
  const key = SHA256(API_KEY_ENCRYPTION_SECRET);
  
  // 3. AES-256-GCM 解密
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = decipher.update(ciphertext) + decipher.final();
  
  return plaintext;
}
```

---

## 6. 多層權限控管

### 6.1 權限層級架構

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 1: 用戶層 (Clerk Authentication)                                  │
│                                                                          │
│ 控制: 用戶登入、身份驗證                                                 │
│ 驗證: Clerk session token                                               │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 2: Team 層                                                        │
│                                                                          │
│ 控制: 誰可以管理 Team 下的資源                                           │
│ 驗證: team.ownerId === userId                                           │
│ 權限: 只有 Team Owner 可以:                                              │
│       - 建立/刪除 Project                                                │
│       - 管理 API Keys                                                   │
│       - 查看使用量統計                                                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 3: Project 層                                                     │
│                                                                          │
│ 控制: 哪些網站可以使用此 Project 的服務                                  │
│ 設定: allowedRefererDomains                                             │
│ 驗證: 檢查 HTTP Referer header                                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 4: API Key 層                                                     │
│                                                                          │
│ 控制:                                                                    │
│ - 哪些圖片來源可以被優化 (allowedSourceDomains)                          │
│ - 請求頻率限制 (rateLimitPerMinute, rateLimitPerDay)                    │
│ - 有效期限 (expiresAt)                                                  │
│                                                                          │
│ 驗證:                                                                    │
│ - HMAC-SHA256 簽名                                                      │
│ - Source domain 白名單                                                  │
│ - 過期時間檢查                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 權限矩陣

| 操作 | 未登入 | 登入用戶 | Team Owner |
|------|--------|---------|------------|
| 查看 Team | ❌ | ❌ | ✅ |
| 建立 Project | ❌ | ❌ | ✅ |
| 刪除 Project | ❌ | ❌ | ✅ |
| 建立 API Key | ❌ | ❌ | ✅ |
| 撤銷 API Key | ❌ | ❌ | ✅ |
| 查看使用量 | ❌ | ❌ | ✅ |
| 發送圖片請求 | ✅* | ✅* | ✅* |

\* 需要有效的 API Key 和簽名

### 6.3 Domain 白名單控制

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Domain 白名單架構                                     │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │           Project 設定              │
                    │                                     │
                    │  allowedRefererDomains:             │
                    │  - example.com                      │
                    │  - *.example.com                    │
                    │                                     │
                    │  用途: 控制哪些網站可以嵌入圖片     │
                    │  驗證: HTTP Referer header          │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
     ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │    API Key 1     │ │    API Key 2     │ │    API Key 3     │
     │                  │ │                  │ │                  │
     │ allowedSource:   │ │ allowedSource:   │ │ allowedSource:   │
     │ - cdn.site-a.com │ │ - images.site-b  │ │ - * (all)        │
     │ - s3.aws.com     │ │                  │ │                  │
     │                  │ │                  │ │                  │
     │ 用途: 限制此 Key │ │ 用途: 只能處理   │ │ 用途: 可處理     │
     │ 能處理的圖片來源 │ │ 特定來源的圖片   │ │ 任何來源的圖片   │
     └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 7. 安全最佳實踐

### 7.1 密鑰管理

| 建議 | 說明 |
|------|------|
| 使用強密鑰 | `API_KEY_ENCRYPTION_SECRET` 至少 32 字元，隨機產生 |
| 定期輪換 | 定期輪換 API Keys，使用內建的輪換功能 |
| 最小權限 | 每個 API Key 只開放必要的 source domains |
| 設定過期時間 | 為 API Key 設定合理的過期時間 |

### 7.2 請求安全

| 建議 | 說明 |
|------|------|
| 使用 HTTPS | 所有請求必須通過 HTTPS |
| 簽名過期時間 | 設定合理的 `exp` 參數，避免簽名被重複使用 |
| 保護 secretKey | 永遠不要在前端程式碼中暴露 secretKey |
| 伺服器端簽名 | URL 簽名應在伺服器端產生 |

### 7.3 監控與審計

| 建議 | 說明 |
|------|------|
| 監控使用量 | 定期檢查 API Key 使用量，發現異常 |
| 檢查日誌 | 監控 403 錯誤，可能是攻擊嘗試 |
| 及時撤銷 | 發現洩漏時立即撤銷 API Key |

### 7.4 攻擊防護

| 攻擊類型 | 防護機制 |
|---------|----------|
| 暴力破解簽名 | HMAC-SHA256 + 32 字元輸出，計算上不可行 |
| 重放攻擊 | `exp` 過期時間限制 |
| 時序攻擊 | `timingSafeEqual` 常數時間比較 |
| 資料竊取 | AES-256-GCM 加密存儲 |
| 中間人攻擊 | HTTPS + 簽名驗證 |

---

## 附錄: 程式碼參考

### 相關檔案

| 檔案 | 功能 |
|------|------|
| `src/server/lib/api-key.ts` | 密鑰產生、加密、解密、簽名函數 |
| `src/server/lib/project-cache.ts` | API Key 快取機制 |
| `src/server/lib/validators.ts` | 請求驗證函數 |
| `src/server/api/routers/apiKey.ts` | API Key CRUD 操作 |
| `src/app/api/v1/[projectSlug]/[...path]/route.ts` | 圖片請求處理 |

### 核心函數

```typescript
// 產生 API Key
generateApiKey(): { key, keyPrefix, secretKey }

// 加密 (存入 DB 前)
encryptApiKey(plaintext: string): string

// 解密 (從 DB 讀取後)
decryptApiKey(encrypted: string): string

// 產生 URL 簽名
createUrlSignature(secretKey, path, expiresAt?): string

// 驗證 URL 簽名
verifyUrlSignature(secretKey, path, signature, expiresAt?): boolean
```
