# 一次看似大量攻擊的流量，最後發現是動態路由把 Bot 爬蟲放大了

前陣子我在 Vercel 上看專案 log，注意到一串很奇怪的請求：

- `/clerk_1773508795504/~/usage`
- `/clerk_1773528290612/~/settings`
- `/clerk_1773597972860/~/usage`

它們在短短幾秒內出現很多次，第一眼很像有人在對站點做掃描或大量請求。

但追下去之後，我發現真正的問題不是 bot 本身，而是我的 dashboard 動態路由設計，讓 crawler 只要碰到一個假的 team slug，就能被頁面繼續餵出更多假的路徑。

這篇文章想講三件事：

1. 我怎麼判斷這不是單純的「被打」
2. 這個問題真正的根因是什麼
3. 這類 route hardening 問題應該怎麼修

## 我一開始看到什麼？

從 Vercel 畫面上看，短時間內出現很多 `GET 200`，而且路徑都長得很像：

- `clerk_1773.../~/usage`
- `clerk_1773.../~/settings`

這種 log 很容易讓人先懷疑幾件事：

1. 是不是 Clerk 前端資產或 SDK 載入
2. 是不是有 crawler 在掃站
3. 是不是某些公開頁面把不該曝光的路徑暴露出去了

我一開始也先懷疑是不是 Clerk 造成的，因為 path 前綴長得很像 `clerk_*`。但把 log 匯出來分析後，很快就知道事情不是那麼單純。

## 關鍵線索：這批流量來自單一 bot

我把 log 匯出後做了幾個基本統計：

- 總共有 `100` 筆 log
- 但只有 `50` 個唯一的 `requestId`
- 每個 request 都會被記兩次：
  - `/_middleware`
  - 實際 route function

所以表面上看到的 `100` 筆，其實只有 `50` 次真實請求。

再看 `User-Agent`，答案幾乎直接出來了：

`ClaudeBot/1.0; +claudebot@anthropic.com`

也就是說，這不是很多不同來源同時在打，而是單一 crawler 在短時間批次抓取頁面。

## Bot 為何會拿到 fake slug？

這是最容易被問的一個問題，也是最需要誠實交代證據邊界的地方。

### 我能確定的事

- log 裡確實出現了很多像 `clerk_1773508795504` 這樣的 fake slug
- repo 裡找不到任何寫死的 `clerk_...` dashboard team 路徑
- 匯出的 log 幾乎都已經是第二階段路徑，例如 `/:team/~/usage`、`/:team/~/settings`

這代表：

**我能證明 fake slug 被放大了，但不能只靠這份 log 證明第一個 fake slug 的唯一來源。**

### 最合理的幾種來源

比較可能的來源有三種：

1. crawler 從外部 URL corpus、舊索引或先前 crawl 的內容拿到這些 path
2. 更早之前某次請求先打中了假的 slug，而頁面又把這個未驗證 slug 輸出成新的 link
3. crawler 自己根據站點 URL 結構做 path mutation

也就是說，bot 不一定需要看到你當下頁面裡真的有一條 `<a href="/clerk_1773...">` 才會拿到這個值。它只要曾經在任何地方見過這串字，或自己猜過一次，就可能把它拿來當 path candidate。

## 真正的根因不是 Clerk，而是 route param 被太早信任

我的 dashboard 是一個 Next.js App Router 專案，路由大致長這樣：

- `/:team`
- `/:team/~/usage`
- `/:team/~/settings`

問題在於，`[team]` tabs layout 會先把 URL 裡的 `team` 參數拿去 render UI，然後才在更後面做 team 驗證。

概念上像這樣：

```tsx
export default async function TeamTabsLayout({ children, params }) {
  const { team: teamSlug } = await params;

  return (
    <>
      <Header teamSlug={teamSlug} />
      <TeamNavigationTabs teamSlug={teamSlug} />
      {children}
    </>
  );
}
```

而 `TeamNavigationTabs` 又會根據 `teamSlug` 直接產生：

- `/${teamSlug}`
- `/${teamSlug}/~/usage`
- `/${teamSlug}/~/settings`

這就代表：只要有人請求任何 `/:team` 路徑，不管這個 slug 是真的還是假的，頁面都會先把它當成合法 team，繼續渲染出更多可爬連結。

## 整個 flow 是怎麼發生的？

把這次 incident 攤開來看，最合理的流程是這樣：

1. bot 先拿到一個 fake slug，例如 `clerk_1773508795504`
2. bot 對 `/:team` route tree 發出請求
3. request 先進入 Clerk middleware，但 Clerk 只負責 auth，不負責驗證 team slug
4. `[team]` layout 在驗證前先相信了 URL 參數
5. `TeamNavigationTabs` 根據 fake slug 生成：
   - `/${fakeTeam}`
   - `/${fakeTeam}/~/usage`
   - `/${fakeTeam}/~/settings`
6. bot 或 Next.js 預取機制繼續打這些新路徑
7. 每個 request 在 Vercel logs 裡又被記成 middleware + function 兩筆

所以 log 才會看起來像一波「很多、很怪、一直冒出來」的請求。

## 為什麼看起來像一直爬不完？

這裡要講得很精確。

**不是單一 fake slug 會自己遞迴生成無限多新 slug。**

單一 fake slug 比較像是只會被擴成一小簇固定路徑，例如：

- `/${fakeTeam}`
- `/${fakeTeam}/~/usage`
- `/${fakeTeam}/~/settings`

也就是說，對單一 slug 而言，fan-out 是有限的。

那為什麼整體又看起來像「一直爬不完」？

因為 **slug 空間本身是無界的**。只要 crawler 持續帶入新的候選值，你的 app 就會對每個新 slug 再產生一小簇新的可爬路徑。

所以整體模型不是 infinite recursion，而是：

- `unbounded input space`
- 加上 `per-slug fan-out`

## 這算資安問題嗎？

我會把它定義成：

**不是高危的資料外洩或權限繞過漏洞，但確實是應該修的 route hardening 問題。**

原因是：

- 它不是 auth bypass
- 沒有讓未授權使用者讀到別人的 team 資料
- 但它會造成可用性、觀測性和 crawler amplification 的問題

具體來說，它至少有三種風險：

1. **可用性風險**
   每個 fake slug 都會經過 middleware、auth、route handler，甚至可能觸發 DB 查詢或 redirect。

2. **觀測性污染**
   log、analytics、error dashboard 會充滿假的 team 路徑。

3. **爬蟲放大**
   問題不只是 bot 會亂爬，而是你的 app 會幫 bot 生成更多可爬連結。

## 真正的修法是什麼？

如果把根因重新講一次，其實修法也很清楚：

**未驗證的動態 route param，被太早拿去生成 navigation。**

所以真正的修法不是先從「擋 bot」開始，而是先修正應用程式自己的信任順序。

### 主修補：先驗證，再渲染

最核心的修法只有一句話：

**先驗證，再渲染。**

不要在 layout 裡直接信任 `[team]` 這個 route param。應該先確認：

- 使用者是否登入
- 這個 team slug 是否存在
- 這個 team 是否屬於目前使用者

只有在驗證通過之後，才把它傳進 `Header`、`TeamNavigationTabs` 等 UI 元件。

概念上會改成：

```tsx
export default async function TeamTabsLayout({ children, params }) {
  const { team: teamSlug } = await params;
  const team = await getVerifiedTeam(teamSlug);

  return (
    <>
      <Header teamSlug={team.slug} />
      <TeamNavigationTabs teamSlug={team.slug} />
      {children}
    </>
  );
}
```

這一刀直接切掉 amplification source。只要這個點修掉，bot 就算仍然能拿到某個 fake slug，也不會再從你的頁面裡拿到下一批 `~/usage`、`~/settings` 連結。

### 次要修補：把驗證做乾淨

如果把 team 驗證提前到 layout，實作上我還會順手做兩件事：

1. 把 team 驗證做成 request-scope cache，避免 layout 和 page 重複 hit DB
2. 在 proxy 或 edge 層對明顯不可能的 slug 做更早的拒絕或 `404`

第一個是效能整理，第二個是 defense in depth。

### 哪些做法只能算緩解，不算真正修復？

有幾種看起來合理、但其實不算根治的做法：

1. **只調整 `robots.txt`**
   有幫助，但 crawler 不一定完全遵守，而且這沒有改變 app 會把未驗證 slug 渲染成 navigation 的事實。

2. **只封掉某個特定 bot**
   可以降低眼前噪音，但修的是「這一次的來源」，不是「這一類問題的結構」。

3. **只調整 Clerk 權限流程**
   Clerk 是 auth gatekeeper，但這個 incident 的根因不是「Clerk 讓錯的人拿到資料」，而是「team 驗證完成前，app 已經先把 slug 拿去生成 UI」。

## 我從這次 incident 學到什麼？

這次最有意思的地方，是它一開始真的很像「有奇怪流量在打站」。

但最後發現，問題不完全在 bot，也不完全在第三方服務，而是在應用本身對動態路由參數的信任太早了。

我覺得有幾個教訓很值得記下來：

1. 不要只看 log 的表面數量，因為一個 request 可能同時出現在 middleware 和 function log 裡
2. User-Agent 常常是最有價值的第一個線索
3. 動態路由參數本質上就是不可信輸入
4. 「不是高危漏洞」不代表「不用修」

## 結語

這次 incident 最後沒有演變成真正的資安事故，但它提醒了我一件很實際的事：

**有時候問題不是 bot 太聰明，而是我們的路由結構太熱心，幫 bot 把下一步都準備好了。**

如果你的系統裡也有像 `/:org`、`/:team`、`/:workspace` 這種動態 slug，建議回頭檢查一下：

- 你是不是在驗證前就把它拿去 render UI？
- 你是不是在不存在的 slug 上仍然輸出了可追連結？
- 你的 app 是不是正在替 crawler 放大無效路徑？

很多時候，真正需要修的不是 bot，而是我們對輸入的信任順序。
