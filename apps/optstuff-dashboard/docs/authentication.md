# 請求驗證流程

本文件說明每個圖片請求的完整驗證流程。

## 完整驗證流程

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

## 錯誤回應表

| 錯誤碼 | 錯誤訊息 | 原因 | 解決方法 |
|--------|---------|------|---------|
| 400 | Invalid path format | URL 路徑格式錯誤 | 檢查 URL 格式是否正確 |
| 400 | Invalid image URL | 圖片 URL 無效 | 檢查圖片 URL 是否正確 |
| 401 | Missing signature parameters | 缺少 key 或 sig 參數 | 確保 URL 包含 key 和 sig 參數 |
| 401 | Invalid API key | API Key 不存在或已撤銷 | 檢查 API Key 是否正確或建立新的 |
| 401 | API key has expired | API Key 已過期 | 更新 API Key 過期時間或建立新的 |
| 401 | API key does not belong to this project | API Key 不屬於此 Project | 使用正確的 Project 或 API Key |
| 403 | Invalid or expired signature | 簽名無效或已過期 | 見下方「簽名問題排查」 |
| 403 | Forbidden: Invalid referer | Referer 不在允許列表 | 在 Project 設定中添加域名 |
| 403 | Forbidden: Source domain not allowed | 圖片來源域名不在允許列表 | 在 API Key 設定中添加域名 |
| 404 | Project not found | Project 不存在 | 檢查 projectSlug 是否正確 |
| 500 | Image processing failed | 圖片處理失敗 | 檢查圖片 URL 是否可存取 |

## 簽名問題排查

當遇到 `403 Invalid or expired signature` 錯誤時，請檢查：

### 1. secretKey 是否正確

```bash
# 確認環境變數已設定
echo $IPX_SECRET_KEY
```

### 2. 簽名計算方式

```typescript
// 正確的簽名計算
const path = "w_800,f_webp/images.example.com/photo.jpg";
const payload = exp ? `${path}?exp=${exp}` : path;
const sig = crypto
  .createHmac("sha256", secretKey)
  .update(payload)
  .digest("base64url")
  .substring(0, 32);
```

### 3. exp 時間戳格式

```typescript
// ✅ 正確：Unix 秒
const exp = Math.floor(Date.now() / 1000) + 3600;

// ❌ 錯誤：Unix 毫秒
const exp = Date.now() + 3600000;
```

### 4. path 組合順序

```
正確: {operations}/{imageUrl}
範例: w_800,f_webp/images.example.com/photo.jpg

錯誤: {imageUrl}/{operations}
```

## 延伸閱讀

- [API Key 生命週期](./api-key-lifecycle.md) - 了解 API Key 的使用方式
- [多層權限控管](./permissions.md) - 了解 Domain 白名單設定
- [整合教學](./integration-guide.md) - 常見問題排查
