# Dashboard 優化參考文件（Vercel Serverless + Neon pooler）
本文件以系統設計最佳實踐為出發點，整理目前專案的待優化項目與建議方向。  

## 高優先級（仍建議近期處理）
- **Request ID 追蹤不足**（`src/app/api/v1/[projectSlug]/[...path]/route.ts`）  
  - **原因**：缺少跨請求追蹤資訊，排查問題困難  
  - **建議方向**：新增 `X-Request-ID`，並在 API 回應與 log 中串接  

## 中優先級
- **安全 headers**  
  - **原因**：缺少 CSP / HSTS 等安全強化  
  - **建議方向**：在 Next.js headers 加入標準安全 header  

## 低優先級
- **健康檢查端點**  
  - **原因**：缺少 `/health` / `/ready` 類型端點  
  - **建議方向**：新增基本健康檢查 route  
