# 安全最佳實踐

本文件整理 OptStuff 使用時的安全建議與攻擊防護機制。

## 密鑰管理

| 建議 | 說明 |
|------|------|
| 使用強密鑰 | `API_KEY_ENCRYPTION_SECRET` 至少 32 字元，隨機產生 |
| HKDF 密鑰派生 | 使用 HKDF (RFC 5869) 從 master secret 派生加密密鑰，而非簡單 hash |
| 版本化 Salt | Salt 包含版本號 (`v1`)，便於未來 key rotation |
| 用途隔離 | 使用 `info` 參數區分不同用途的密鑰 |
| 定期輪換 | 定期輪換 API Keys，使用內建的輪換功能 |
| 最小權限 | 每個 API Key 只開放必要的 source domains |
| 設定過期時間 | 為 API Key 設定合理的過期時間 |

### 產生強密鑰

```bash
# 使用 openssl 產生 32 字元的隨機密鑰
openssl rand -base64 32
```

### 輪換建議

- 正式環境：每 90 天輪換一次
- 懷疑洩露：立即輪換
- 人員異動：相關密鑰應輪換

## 請求安全

| 建議 | 說明 |
|------|------|
| 使用 HTTPS | 所有請求必須通過 HTTPS |
| 簽名過期時間 | 設定合理的 `exp` 參數，避免簽名被重複使用 |
| 保護 secretKey | 永遠不要在前端程式碼中暴露 secretKey |
| 伺服器端簽名 | URL 簽名應在伺服器端產生 |

### 簽名過期時間建議

| 使用場景 | 建議過期時間 |
|---------|-------------|
| 靜態頁面圖片 | 24 小時 (`86400` 秒) |
| 動態內容圖片 | 1 小時 (`3600` 秒) |
| 臨時分享連結 | 15 分鐘 (`900` 秒) |
| 測試用途 | 5 分鐘 (`300` 秒) |

## 監控與審計

| 建議 | 說明 |
|------|------|
| 監控使用量 | 定期檢查 API Key 使用量，發現異常 |
| 檢查日誌 | 監控 403 錯誤，可能是攻擊嘗試 |
| 及時撤銷 | 發現洩漏時立即撤銷 API Key |

### 異常指標

- 單一 API Key 請求量突然暴增
- 大量 403 錯誤（可能是暴力破解）
- 來自異常地理位置的請求
- 非工作時間的異常活動

## 攻擊防護

| 攻擊類型 | 防護機制 | 說明 |
|---------|----------|------|
| 暴力破解簽名 | HMAC-SHA256 + 32 字元輸出 | 計算上不可行 |
| 重放攻擊 | `exp` 過期時間限制 | 簽名有時效性 |
| 時序攻擊 | `timingSafeEqual` 常數時間比較 | 無法通過時間差推測 |
| 資料竊取 | AES-256-GCM 加密存儲 | 即使資料庫洩露也無法讀取 |
| 中間人攻擊 | HTTPS + 簽名驗證 | 雙重保護 |

### 暴力破解分析

```
HMAC-SHA256 簽名強度:
- 輸出: 32 字元 (base64url 編碼)
- 可能組合: 64^32 ≈ 2^192
- 每秒嘗試 10 億次，需要 10^49 年

結論: 暴力破解在計算上不可行
```

### 時序攻擊防護

```typescript
// ✅ 安全: 使用 timingSafeEqual
import { timingSafeEqual } from 'crypto';

const isValid = timingSafeEqual(
  Buffer.from(providedSig),
  Buffer.from(expectedSig)
);

// ❌ 不安全: 直接比較
const isValid = providedSig === expectedSig;
```

## 環境變數安全

### 必須保密的變數

```bash
# ⚠️ 這些變數絕對不能有 NEXT_PUBLIC_ 前綴
API_KEY_ENCRYPTION_SECRET="..."  # 系統加密密鑰
IPX_SECRET_KEY="sk_..."          # API Key 的 secretKey
```

### 可以公開的變數

```bash
# ✅ 這些可以有 NEXT_PUBLIC_ 前綴
NEXT_PUBLIC_IPX_ENDPOINT="https://..."
NEXT_PUBLIC_IPX_PROJECT_SLUG="my-project"
NEXT_PUBLIC_IPX_KEY_PREFIX="pk_abc123..."  # 只是 prefix
```

### 檢查清單

- [ ] 確認 `.env` 在 `.gitignore` 中
- [ ] 確認敏感變數沒有 `NEXT_PUBLIC_` 前綴
- [ ] 確認前端程式碼中沒有出現 `secretKey`
- [ ] 確認簽名邏輯只在伺服器端執行

## 延伸閱讀

- [資料加密機制](./encryption.md) - 了解加密細節
- [請求驗證流程](./authentication.md) - 了解驗證機制
- [設計決策說明](./design-decisions.md) - 為什麼這樣設計
