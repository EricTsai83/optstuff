# OptStuff API 安全架構文件

本文件庫說明 OptStuff 圖片優化服務的完整安全架構，包含密鑰管理、請求驗證、權限控管等機制。

## 文件索引

| 文件 | 說明 | 適合對象 |
|------|------|---------|
| [系統架構](./architecture.md) | 系統整體架構、密鑰層級與關係 | 想了解系統設計的開發者 |
| [API Key 生命週期](./api-key-lifecycle.md) | API Key 的建立、使用、撤銷、輪換 | 需要管理 API Key 的開發者 |
| [請求驗證流程](./authentication.md) | 完整的請求驗證步驟與錯誤處理 | 需要排查問題的開發者 |
| [資料加密機制](./encryption.md) | AES-256-GCM 加密、HKDF 密鑰派生 | 想了解加密實作的開發者 |
| [多層權限控管](./permissions.md) | 用戶、Team、Project、API Key 權限架構 | 需要設定權限的管理者 |
| [安全最佳實踐](./security-best-practices.md) | 密鑰管理、請求安全、攻擊防護建議 | 所有使用者 |
| [設計決策說明](./design-decisions.md) | 各項設計背後的「為什麼」 | 想深入理解設計的開發者 |
| [整合教學](./integration-guide.md) | 如何在專案中整合 OptStuff 服務 | **快速上手必讀** |

## 快速導覽

### 我想要...

- **快速整合到我的專案** → [整合教學](./integration-guide.md)
- **了解簽名為什麼失敗** → [請求驗證流程](./authentication.md#42-錯誤回應表)
- **設定 Domain 白名單** → [多層權限控管](./permissions.md#63-domain-白名單控制)
- **了解資料如何加密** → [資料加密機制](./encryption.md)
- **理解設計決策** → [設計決策說明](./design-decisions.md)

## 相關程式碼

| 檔案 | 功能 |
|------|------|
| `src/server/lib/api-key.ts` | 密鑰產生、加密、解密、簽名函數 |
| `src/server/lib/project-cache.ts` | API Key 快取機制 |
| `src/server/lib/validators.ts` | 請求驗證函數 |
| `src/server/api/routers/apiKey.ts` | API Key CRUD 操作 |
| `src/app/api/v1/[projectSlug]/[...path]/route.ts` | 圖片請求處理 |

## 核心函數速查

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
