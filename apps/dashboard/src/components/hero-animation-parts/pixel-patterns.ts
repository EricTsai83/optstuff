/** Fixed pattern width for consistent centering */
const PATTERN_WIDTH = 32;

/** Fixed pattern height */
const PATTERN_HEIGHT = 11;

/**
 * Helper to pad pattern lines to exact width.
 */
function pad(value: string): string {
  return value.padEnd(PATTERN_WIDTH, " ");
}

/**
 * Pad a string to a fixed width (for letter blocks).
 */
function padToWidth(value: string, width: number): string {
  return value.padEnd(width, " ");
}

/**
 * Pixel font patterns for "JPEG" (11 rows × 32 cols)
 * Layout: 1sp + J(6) + 2sp + P(6) + 2sp + E(6) + 2sp + G(6) + 1sp = 32
 *
 * We keep the pattern box (32×11) symmetric so it's centered inside the grid.
 */
export const JPEG_PATTERN: readonly string[] = buildJpegPattern();

/**
 * Pixel font patterns for "WebP" (11 rows × 32 cols)
 * Layout: 1sp + W(7) + 2sp + e(5) + 2sp + b(6) + 2sp + P(6) + 1sp = 32
 *
 * Note: `e` and `b` are lowercase and their bottoms align with `W` and `P`.
 */
export const WEBP_PATTERN: readonly string[] = buildWebpPattern();

/**
 * Scrambled noise pattern (11 rows × 32 cols)
 *
 * Generated deterministically so it stays stable between renders.
 */
export const SCRAMBLE_PATTERN: readonly string[] = buildScramblePattern();

/**
 * Build a 32×11 pattern for "JPEG" with symmetric whitespace.
 */
function buildJpegPattern(): readonly string[] {
  const J_WIDTH = 6;
  const P_WIDTH = 6;
  const E_WIDTH = 6;
  const G_WIDTH = 6;

  // Note: The grid centering already adds 3 empty cols on each side (38 - 32 = 6).
  // Use 1-col padding here so the perceived outer margin is 3 + 1 = 4 cols.
  const LEFT_PAD = " ";
  const RIGHT_PAD = " ";
  const GAP = "  ";
  const GAP_BEFORE_G = "  ";

  const jRows = [
    "######",
    "    # ",
    "    # ",
    "    # ",
    "    # ",
    "    # ",
    "#   # ",
    "#   # ",
    " ###  ",
  ].map((row) => padToWidth(row, J_WIDTH));

  const pRows = [
    "#####",
    "#    #",
    "#    #",
    "#    #",
    "##### ",
    "#     ",
    "#     ",
    "#     ",
    "#     ",
  ].map((row) => padToWidth(row, P_WIDTH));

  const eRows = [
    "######",
    "#     ",
    "#     ",
    "#     ",
    "######",
    "#     ",
    "#     ",
    "#     ",
    "######",
  ].map((row) => padToWidth(row, E_WIDTH));

  const gRows = [
    " #####",
    "#     ",
    "#     ",
    "#     ",
    "# ### ",
    "#    #",
    "#    #",
    "#    #",
    "##### ",
  ].map((row) => padToWidth(row, G_WIDTH));

  const rows: string[] = [pad("")];
  for (let i = 0; i < 9; i++) {
    rows.push(
      pad(
        `${LEFT_PAD}${jRows[i]}${GAP}${pRows[i]}${GAP}${eRows[i]}${GAP_BEFORE_G}${gRows[i]}${RIGHT_PAD}`,
      ),
    );
  }
  rows.push(pad(""));

  return rows;
}

/**
 * Build a 32×11 pattern for "WebP" with symmetric whitespace and a shared baseline.
 */
function buildWebpPattern(): readonly string[] {
  const W_WIDTH = 7;
  const E_WIDTH = 5;
  const B_WIDTH = 6;
  const P_WIDTH = 6;

  const LEFT_PAD = " ";
  const RIGHT_PAD = " ";
  const GAP = "  ";

  // W (7 cols) with clearer inner diagonals.
  const wRows = [
    "#     #",
    "#     #",
    "#  #  #",
    "#  #  #",
    "#  #  #",
    "#  #  #",
    "# # # #",
    "##   ##",
    "#     #",
  ].map((row) => padToWidth(row, W_WIDTH));

  // Lowercase e: baseline-aligned with W/P (last row).
  const eRows = [
    "     ",
    "     ",
    "     ",
    " ### ",
    "#   #",
    "#####",
    "#    ",
    "#   #",
    " ####",
  ].map((row) => padToWidth(row, E_WIDTH));

  // Lowercase b: ascender, baseline-aligned.
  const bRows = [
    "      ",
    "#     ",
    "#     ",
    "#     ",
    "##### ",
    "#    #",
    "#    #",
    "#    #",
    "##### ",
  ].map((row) => padToWidth(row, B_WIDTH));

  const pRows = [
    "##### ",
    "#    #",
    "#    #",
    "#    #",
    "##### ",
    "#     ",
    "#     ",
    "#     ",
    "#     ",
  ].map((row) => padToWidth(row, P_WIDTH));

  const rows: string[] = [pad("")];
  for (let i = 0; i < 9; i++) {
    rows.push(
      pad(
        `${LEFT_PAD}${wRows[i]}${GAP}${eRows[i]}${GAP}${bRows[i]}${GAP}${pRows[i]}${RIGHT_PAD}`,
      ),
    );
  }
  rows.push(pad(""));

  return rows;
}

function buildScramblePattern(): readonly string[] {
  const rows: string[] = [];
  for (let row = 0; row < PATTERN_HEIGHT; row++) {
    let line = "";
    for (let col = 0; col < PATTERN_WIDTH; col++) {
      const seed = (row + 1) * 9999 + (col + 1) * 1234;
      const value = Math.sin(seed) * 10000;
      const rand = value - Math.floor(value);
      line += rand > 0.58 ? "#" : " ";
    }
    rows.push(pad(line));
  }
  return rows;
}

/**
 * Check if a position should be filled in the pattern.
 */
export function isPatternFilled(
  pattern: readonly string[],
  row: number,
  col: number,
  gridRowCount: number,
  gridColCount: number,
): boolean {
  // Use fixed dimensions for consistent centering
  const patternRows = PATTERN_HEIGHT;
  const patternCols = PATTERN_WIDTH;

  // Center the pattern in the grid using Math.round for better centering
  const startRow = Math.round((gridRowCount - patternRows) / 2);
  const startCol = Math.round((gridColCount - patternCols) / 2);

  const patternRow = row - startRow;
  const patternCol = col - startCol;

  if (
    patternRow < 0 ||
    patternRow >= patternRows ||
    patternCol < 0 ||
    patternCol >= patternCols
  ) {
    return false;
  }

  const char = pattern[patternRow]?.[patternCol];
  return char === "#";
}
