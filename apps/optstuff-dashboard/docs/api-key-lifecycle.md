# API Key 生命週期

本文件說明 API Key 從建立到撤銷的完整生命週期。

## 建立 API Key

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

> ⚠️ **重要**: `secretKey` 只會在建立時顯示一次，之後無法再次取得。用戶必須妥善保存。

## 使用 API Key

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

## 撤銷 API Key

```
撤銷操作:
  UPDATE api_keys SET revoked_at = NOW() WHERE id = '...'

效果:
  - API Key 立即失效
  - 快取立即清除 (invalidateApiKeyCache)
  - 後續請求返回 401 Unauthorized
```

撤銷後的 API Key：
- 無法再用於產生有效的簽名
- 記錄會保留在資料庫中（用於審計）
- 不可恢復，需要建立新的 API Key

## 輪換 API Key

輪換是一個原子操作，包含撤銷舊 Key 並建立新 Key：

```
輪換 = 撤銷舊 Key + 建立新 Key

1. 撤銷舊 Key (保留記錄)
2. 建立新 Key (繼承設定)
3. 回傳新的 key 和 secretKey
```

### 輪換時機

- 定期輪換（建議每 90 天）
- 懷疑 secretKey 已洩露
- 人員異動時
- 安全審計要求

### 輪換最佳實踐

1. **準備好新 Key 後再更新應用程式**
2. **使用環境變數管理 Key**，方便切換
3. **監控舊 Key 的使用狀況**，確保已完全停用

## 延伸閱讀

- [請求驗證流程](./authentication.md) - 詳細的驗證步驟
- [資料加密機制](./encryption.md) - API Key 如何加密存儲
- [安全最佳實踐](./security-best-practices.md) - 密鑰管理建議
