# Dashboard 優化參考文件（Vercel Serverless + Neon pooler）

本文件以系統設計最佳實踐為出發點，整理目前專案的待優化項目與建議方向。  


## 高優先級（仍建議近期處理）
- **API Key 解密結果回傳**（`src/server/api/routers/apiKey.ts`）  
  - **原因**：`list` / `listAll` 回傳 `keyFull` / `secretKey` 會擴大敏感資料暴露面  
  - **建議方向**：僅建立時回傳一次；查詢僅回 `keyPrefix` 與 metadata  

- **Error Boundary 缺失**（`src/app/`）  
  - **原因**：App Router 若無 `error.tsx` / `global-error.tsx`，錯誤會白屏  
  - **建議方向**：補錯誤邊界、加入 reset UI 與安全的錯誤提示  

- **Request ID 追蹤不足**（`src/app/api/v1/[projectSlug]/[...path]/route.ts`）  
  - **原因**：缺少跨請求追蹤資訊，排查問題困難  
  - **建議方向**：新增 `X-Request-ID`，並在 API 回應與 log 中串接  


## 中優先級
- **Redis fail-open 策略需明確化**（`src/server/lib/rate-limiter.ts`, `config-cache.ts`）  
  - **原因**：Redis 故障時限流失效或退回 DB，容易放大風險  
  - **建議方向**：明確 fail-open / fail-closed，並加上告警門檻  

- **安全 headers**  
  - **原因**：缺少 CSP / HSTS 等安全強化  
  - **建議方向**：在 Next.js headers 加入標準安全 header  

## 低優先級
- **API 版本策略**（`src/app/api/v1/`）  
  - **原因**：後續版本演進與相容性風險  
  - **建議方向**：定義版本策略與遷移規範  

- **健康檢查端點**  
  - **原因**：缺少 `/health` / `/ready` 類型端點  
  - **建議方向**：新增基本健康檢查 route  
