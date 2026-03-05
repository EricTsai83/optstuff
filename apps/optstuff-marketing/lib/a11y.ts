export function getExternalLinkAriaLabel(label: string, external: boolean): string {
  return external ? `${label} (opens in new tab)` : label;
}
