/**
 * Rounds zoom values to two decimals so CSS transform updates stay stable and
 * the derived percentage display does not drift due to floating-point noise.
 */
export function roundZoom(v: number) {
  return Number(v.toFixed(2));
}
