# [HIGH] Tenant-controlled source domains can target internal network hosts

**File:** [`apps/optstuff-dashboard/src/app/api/v1/[projectSlug]/[...path]/route.ts`](https://github.com/EricTsai83/optstuff/blob/main/apps/optstuff-dashboard/src/app/api/v1/[projectSlug]/[...path]/route.ts#L226-L640) (lines 226, 456, 472, 486, 538, 640)
**Project:** optstuff
**Severity:** HIGH  •  **Confidence:** high  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `eric492718@gmail.com` _(via last-committer)_

## Finding

The route builds an upstream imageUrl from the signed path, extracts only the URL hostname, and allows the fetch when validateSourceDomain matches that hostname against the project's allowedSourceDomains. The subsequent GET path processes that URL with IPX and the HEAD path probes it with fetch. The source-domain validation path does not reject localhost, loopback, RFC1918, link-local, cloud metadata IPs, or hostnames that resolve to those ranges. Because project owners can configure source domains, an authenticated tenant can allow http://localhost or 169.254.169.254, sign a matching image URL, and make the service issue server-side GET/HEAD requests to internal services. Redirects are disabled, but direct internal host access and DNS rebinding remain possible.

## Recommendation

Reject unsafe source targets both when saving settings and immediately before fetching. Block localhost, loopback, private, link-local, multicast, IPv6 local ranges, IPv4-mapped variants, and cloud metadata addresses; resolve hostnames and validate the resolved IPs; compare protocol/host/port explicitly; and consider enforcing this with an egress proxy or network firewall. Keep redirect following disabled.

## Revalidation

**Verdict:** true-positive

The direct localhost and private-IP variant described in the finding has been substantially patched: the route now calls validateSourceUrl instead of only extracting new URL(imageUrl).hostname, and validateSourceUrl requires http(s), matches protocol/host/port against configured rules, rejects unsafe literal hostnames, and does a DNS lookup with requireDnsResolution: true before allowing the request. Project creation and settings updates also call normalizeSourceDomainEntry/validateConfiguredSourceDomains, which reject localhost, private IP literals, wildcard source entries, paths, queries, and fragments. However, the route still performs DNS validation as a separate time-of-check step before probeUpstreamSource fetches the URL and before IPX fetches it through ipxHttpStorage. Neither the HEAD fetch nor the IPX http storage is bound to the resolved addresses that were checked, and there is no custom dispatcher, egress proxy, or network-layer enforcement visible in the code. A tenant controlling an allowed public hostname can answer the validation lookup with a public address and then answer the subsequent fetch lookup with a private or metadata address, which is the DNS rebinding case explicitly called out by the original finding. Redirects are still disabled, which helps, but it does not address this DNS TOCTOU path. Because the easy direct-IP attack is fixed and exploitation now requires DNS control/timing, I would lower the severity from CRITICAL to HIGH rather than call the issue fully fixed.

## Recent committers (`git log`)

- Eric Tsai <eric492718@gmail.com> (2026-04-03)
