import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import path from "path";

/**
 * Create an IPX instance for image processing.
 *
 * Domain validation is handled upstream by `validateSourceDomain` in the route
 * handler (which supports subdomain matching). IPX is configured with
 * `allowAllDomains` because its built-in check only does exact hostname
 * matching and would reject valid subdomains (e.g. images.unsplash.com when
 * unsplash.com is allowed).
 */
let _ipxInstance: ReturnType<typeof createIPX> | undefined;

export function getProjectIPX() {
  _ipxInstance ??= createIPX({
    storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
    httpStorage: ipxHttpStorage({
      allowAllDomains: true,
      fetchOptions: { redirect: "error" },
    }),
  });
  return _ipxInstance;
}