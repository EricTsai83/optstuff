# [MEDIUM] Public playground can mint signed optimization URLs without abuse controls

**File:** [`examples/nextjs/src/components/optimizer-playground.tsx`](https://github.com/EricTsai83/optstuff/blob/main/examples/nextjs/src/components/optimizer-playground.tsx#L51-L270) (lines 51, 52, 62, 65, 134, 270)
**Project:** optstuff
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `eric492718@gmail.com` _(via last-committer)_

## Finding

The playground accepts a browser-supplied image URL and transformation parameters, uses them to build preview proxy URLs, and POSTs them to /api/optstuff to generate a signed URL. The supporting route validates scheme, host, and numeric bounds, so this is not SSRF, but there is no direct auth, captcha, quota, or rate limit before a one-hour signed OptStuff URL is generated. If this public example is deployed with real OptStuff credentials, an attacker can script the signing route for allowed hosts and consume optimization/API quota.

## Recommendation

Add route-level abuse protection around /api/optstuff before signing, such as IP or API-key rate limits and tight demo quotas. For public demos, use disposable credentials or disable arbitrary URL signing outside authenticated contexts.

## Revalidation

**Verdict:** true-positive

The playground is a client component that accepts a user-controlled imageUrl and transform parameters, builds preview GET URLs with buildOptStuffProxyPath, and POSTs the same values to /api/optstuff to receive a signed URL. The backend route validates http/https, an allowlisted hostname, integer dimensions, quality, format, and fit, so the SSRF and unbounded transform parts are mitigated. However, after validation it still calls generateOptStuffUrl with the deployment's server-side OptStuff secret and returns a one-hour signed URL for attacker-selected allowlisted images. The current route does include an in-memory 60-requests-per-minute limiter, but it keys on x-forwarded-for/x-real-ip/cf-connecting-ip headers taken directly from the request, making it bypassable in deployments where the edge does not sanitize those headers or appends to x-forwarded-for. It is also per-process memory, so it does not provide a durable or deployment-wide quota and resets across restarts/instances. There is no authentication, caller binding, referer check, captcha, or persistent demo quota, and there is no examples/nextjs middleware or proxy file gating /api/optstuff. A concrete attacker can script POST requests, or use the public GET redirect endpoint from image tags, for allowed Unsplash URLs and consume signing and optimization quota within or around the weak limiter. Therefore the core expensive public signing abuse remains exploitable, although the original statement that there is literally no rate limit is stale.

## Recent committers (`git log`)

- Eric Tsai <eric492718@gmail.com> (2026-04-03)
