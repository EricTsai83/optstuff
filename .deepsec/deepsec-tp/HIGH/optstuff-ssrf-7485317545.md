# [HIGH] Tenant-controlled image URLs can drive server-side fetches to internal hosts

**File:** [`apps/optstuff-dashboard/src/modules/project-detail/ui/components/url-tester.tsx`](https://github.com/EricTsai83/optstuff/blob/main/apps/optstuff-dashboard/src/modules/project-detail/ui/components/url-tester.tsx#L78-L105) (lines 78, 92, 95, 105)
**Project:** optstuff
**Severity:** HIGH  •  **Confidence:** high  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `eric492718@gmail.com` _(via last-committer)_

## Finding

The URL tester builds a signing path directly from user-controlled imageUrl, obtains a valid signature, and then requests the signed optimization URL. Tracing the flow shows the image API validates only that the source hostname matches the project's tenant-controlled allowedSourceDomains before performing server-side HEAD/IPX fetches, and the project domain schema accepts localhost and numeric IP hostnames with no private-IP or DNS rebinding protection. A malicious tenant can configure an allowed source such as http://169.254.169.254 or http://localhost, sign/test that path, and cause the platform to issue requests to internal services.

## Recommendation

Enforce SSRF protections server-side before signing and before fetching: reject localhost, loopback, link-local, RFC1918, multicast, and metadata-service IPs; resolve hostnames and block private resolved addresses; prevent DNS rebinding by binding fetches to validated resolved addresses or an egress proxy; and disallow tenant-configured internal hosts in production.

## Revalidation

**Verdict:** true-positive

UrlTester still builds a signing path from user-controlled imageUrl, asks api.apiKey.signUrl for a signature, and then issues a HEAD request to the signed optimization URL, which reaches the public image route. The direct version of the report has been mitigated: apiKey.signUrl now parses the path, applies validateSignedOperations, builds imageUrl with ensureProtocol, loads the project allowedSourceDomains, and calls validateSourceUrl before signing. The route itself repeats validateSourceUrl before both HEAD probing and GET/IPX processing, so localhost and private-IP literals are no longer accepted. The remaining exploitable path is the same DNS rebinding gap in the backend route: validation resolves and checks the hostname, but the later fetch/IPX request resolves it again without pinning the validated IPs or using an egress guard. A malicious tenant can use UrlTester with an allowed attacker-controlled public hostname that passes signing and route validation, then rebind the hostname to an internal address for the actual backend fetch. The component is not independently vulnerable without the backend SSRF gap, but it remains a concrete dashboard path for an authenticated tenant to drive that server-side request. Because the easy literal-host attack is fixed, I would reduce severity to HIGH.

## Recent committers (`git log`)

- Eric Tsai <eric492718@gmail.com> (2026-04-04)
