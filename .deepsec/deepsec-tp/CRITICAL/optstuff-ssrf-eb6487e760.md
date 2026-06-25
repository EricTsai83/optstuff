# [CRITICAL] Source allowlist does not block internal network targets

**File:** [`apps/optstuff-dashboard/src/server/lib/validators.ts`](https://github.com/EricTsai83/optstuff/blob/main/apps/optstuff-dashboard/src/server/lib/validators.ts#L88-L100) (lines 88, 98, 100)
**Project:** optstuff
**Severity:** CRITICAL  •  **Confidence:** high  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `eric492718@gmail.com` _(via last-committer)_

## Finding

validateSourceDomain only compares the parsed hostname against configured strings and subdomain suffixes. It does not reject localhost, loopback/private/link-local IP literals, cloud metadata addresses, or allowed hostnames that resolve to internal IPs. The IPX fetch layer is configured with allowAllDomains and relies on this validator, so a malicious tenant with an API key can allowlist and sign a URL for internal targets such as 127.0.0.1 or 169.254.169.254, or use DNS to point an allowed hostname at internal infrastructure.

## Recommendation

Validate the full upstream URL against an SSRF-safe policy: reject localhost and private/link-local/metadata IP ranges, resolve DNS and block unsafe results, pin the resolved safe address for the fetch, keep redirects disabled or revalidate every redirect, and apply the same checks to both GET and HEAD paths.

## Revalidation

**Verdict:** true-positive

The current code has patched the simple hostname-only allowlist issue for direct literals: validateSourceUrl now rejects non-http(s), checks allowed domains, rejects localhost/metadata hostnames and unsafe IPv4/IPv6 ranges, and resolves DNS before allowing the request. The route also now calls validateSourceUrl before both GET processing and the HEAD fast path, and IPX is configured with redirect: "error", so direct 127.0.0.1, 169.254.169.254, localhost, and redirect-based SSRF paths are blocked. However, the validator only resolves the hostname during validation and returns the original URL string; it does not pin the resolved safe address for the subsequent fetch. IPX's http storage then performs a separate ofetch GET against the same hostname after validation, which causes a second DNS resolution outside the SSRF check. A malicious tenant can allowlist a domain they control, sign a URL for that hostname, return a public address during validatePublicHostname, and then return an internal address during the later IPX fetch. The HEAD path has the same TOCTOU shape because probeUpstreamSource performs a separate fetch after validateRequest succeeds. Therefore the original finding is narrowed by the current patch but remains exploitable through DNS rebinding because internal network targets are not blocked at the actual socket connection.

## Recent committers (`git log`)

- Eric Tsai <eric492718@gmail.com> (2026-04-03)
