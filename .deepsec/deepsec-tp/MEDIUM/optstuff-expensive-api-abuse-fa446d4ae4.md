# [MEDIUM] Client-exposed signing flow can be abused to consume OptStuff quota

**File:** [`examples/nextjs/src/hooks/use-signed-image-url.ts`](https://github.com/EricTsai83/optstuff/blob/main/examples/nextjs/src/hooks/use-signed-image-url.ts#L77-L80) (lines 77, 80)
**Project:** optstuff
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `eric492718@gmail.com` _(via last-committer)_

## Finding

The hook posts caller-controlled image parameters, including `src`, to `/api/optstuff` to obtain a signed OptStuff URL. Tracing that endpoint shows it validates hostnames and transform bounds, but then signs and returns URLs without authentication or caller-scoped rate limiting. A third party can call the same endpoint directly to mint valid signed URLs for any allowlisted source and consume the site's OptStuff API key quota or rate limits. The source-host allowlist mitigates SSRF, but it does not bind signing capability to an authorized caller.

## Recommendation

Protect the signing endpoint with authentication when URLs are user-specific, and add per-IP/per-session rate limiting or only sign a server-controlled set of image URLs for public pages.

## Revalidation

**Verdict:** true-positive

The hook is a client-side helper that posts caller-controlled src, width, format, and quality to /api/optstuff and treats the returned JSON url as a signed OptStuff image URL. The route behind that endpoint validates URL syntax, allowed hostnames, numeric bounds, format, and fit before signing, so it limits the source set and transform shape. It does not require an authenticated user or any caller-specific authorization before calling generateOptStuffUrl with the server-side OptStuff secret. The only current abuse control is an in-memory 60-per-minute limiter keyed from x-forwarded-for/x-real-ip/cf-connecting-ip request headers. That limiter is not a robust quota because those headers can be attacker-influenced unless a trusted edge overwrites them, it is not shared across server instances, and it resets on process restart. CORS does not prevent server-side scripts from calling the endpoint directly, and the GET variant can also be triggered cross-site as an image redirect without reading the response. A third party can therefore mint valid one-hour URLs for allowlisted sources and consume the site's signing or downstream optimization quota, especially by rotating spoofed forwarded-for values or distributing requests. The finding is real, with the caveat that the current tree has a partial but insufficient rate-limit mitigation.

## Recent committers (`git log`)

- Eric Tsai <eric492718@gmail.com> (2026-04-03)
