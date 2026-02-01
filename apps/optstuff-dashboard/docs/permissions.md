# 多層權限控管

本文件說明 OptStuff 的多層權限架構與設定方式。

## 權限層級架構

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

## 權限矩陣

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

## Domain 白名單控制

系統提供兩層 Domain 白名單，各有不同用途：

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

### Project 級: allowedRefererDomains

| 項目 | 說明 |
|------|------|
| **問題** | 誰可以「使用」這個服務？ |
| **驗證** | HTTP Referer header |
| **用途** | 防止其他網站嵌入你的圖片（盜連） |
| **範例** | 只允許 myblog.com 和 *.myblog.com 使用 |

### API Key 級: allowedSourceDomains

| 項目 | 說明 |
|------|------|
| **問題** | 可以處理「哪些來源」的圖片？ |
| **驗證** | 請求中的圖片 URL |
| **用途** | 限制可處理的圖片來源，防止被用來處理任意圖片 |
| **範例** | 只允許處理來自 cdn.myblog.com 的圖片 |

### 實際應用場景

```
場景: 你有多個網站，每個網站使用不同的圖片 CDN

┌─────────────────────────────────────────────────────────────────────────┐
│ Project: my-company                                                     │
│ allowedRefererDomains: [site-a.com, site-b.com, site-c.com]            │
│                                                                          │
│ API Key 1 (給 site-a.com):                                             │
│   allowedSourceDomains: [cdn.site-a.com]                               │
│                                                                          │
│ API Key 2 (給 site-b.com):                                             │
│   allowedSourceDomains: [images.site-b.com, s3.amazonaws.com]          │
│                                                                          │
│ API Key 3 (管理員測試用):                                              │
│   allowedSourceDomains: [*]  ← 允許所有來源                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## 設定 Domain 白名單

### 設定 Project 的 allowedRefererDomains

1. 進入 Dashboard → 選擇 Project
2. 點擊「Settings」
3. 在「Allowed Referer Domains」中添加域名
4. 支援 wildcard：`*.example.com` 會匹配所有子域名

### 設定 API Key 的 allowedSourceDomains

1. 進入 Dashboard → 選擇 Project → API Keys
2. 點擊要編輯的 API Key
3. 在「Allowed Source Domains」中添加域名
4. 使用 `*` 表示允許所有來源（不建議用於正式環境）

## 延伸閱讀

- [請求驗證流程](./authentication.md) - 了解驗證步驟
- [設計決策說明](./design-decisions.md#85-為什麼要有兩層-domain-白名單) - 為什麼需要兩層白名單
- [安全最佳實踐](./security-best-practices.md) - 權限設定建議
