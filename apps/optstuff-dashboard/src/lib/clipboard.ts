/**
 * Clipboard utilities
 */

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 * @throws Error if Clipboard API is not available
 */
export async function copyToClipboard(text: string) {
  if (!navigator?.clipboard) {
    throw new Error("Clipboard API not available");
  }
  await navigator.clipboard.writeText(text);
}
