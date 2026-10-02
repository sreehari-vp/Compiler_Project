// Utility functions for spreadsheet cell coordinates and ranges

/**
 * Converts column 0-based index to letter label (0 -> "A", 25 -> "Z", 26 -> "AA")
 */
export function indexToColLetters(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Converts column letter label to 0-based index ("A" -> 0, "Z" -> 25, "AA" -> 26)
 */
export function colLettersToIndex(colStr: string): number {
  const upper = colStr.toUpperCase();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Parses a cell ID like "B2" or "AA100" into { col: "B", row: 2, colIndex: 1, rowIndex: 1 }
 */
export function parseCellAddress(cellId: string): { col: string; row: number; colIndex: number; rowIndex: number } | null {
  const match = cellId.toUpperCase().match(/^([A-Z]+)([1-9][0-9]*)$/);
  if (!match) return null;
  const col = match[1];
  const row = parseInt(match[2], 10);
  return {
    col,
    row,
    colIndex: colLettersToIndex(col),
    rowIndex: row - 1,
  };
}

/**
 * Validates if a string is a valid cell reference (e.g. "A1", "C25", "AB100")
 */
export function isValidCellReference(cellId: string): boolean {
  return /^[A-Za-z]+[1-9][0-9]*$/.test(cellId);
}

/**
 * Validates if a string is a valid range reference (e.g. "A1:B10")
 */
export function isValidRangeReference(rangeStr: string): boolean {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return false;
  return isValidCellReference(parts[0]) && isValidCellReference(parts[1]);
}

/**
 * Expands a range string like "A1:B3" to array of cell IDs: ["A1", "A2", "A3", "B1", "B2", "B3"]
 */
export function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.toUpperCase().split(':');
  if (parts.length !== 2) return [];

  const start = parseCellAddress(parts[0]);
  const end = parseCellAddress(parts[1]);
  if (!start || !end) return [];

  const minCol = Math.min(start.colIndex, end.colIndex);
  const maxCol = Math.max(start.colIndex, end.colIndex);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const result: string[] = [];
  for (let c = minCol; c <= maxCol; c++) {
    const colName = indexToColLetters(c);
    for (let r = minRow; r <= maxRow; r++) {
      result.push(`${colName}${r}`);
    }
  }
  return result;
}

/**
 * Formats a value for display in the grid
 */
export function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (isNaN(value)) return '#NUM!';
    if (!isFinite(value)) return '#DIV/0!';
    // Limit floating precision nicely if not integer
    return Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(4)).toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  return String(value);
}
