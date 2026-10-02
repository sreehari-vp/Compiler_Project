import type { CompilerPipelineResult } from './compiler';

export type CellValueType = 'number' | 'string' | 'boolean' | 'empty' | 'error';

export interface CellData {
  id: string;              // "B2"
  raw: string;             // User entered input: "=B2*2" or "80" or "Hari"
  formula?: string;        // "=B2*2" if it is a formula
  computedValue: any;      // 160 or "Hari" or "#ERROR!"
  valueType: CellValueType;
  error?: string;
  isFormula: boolean;
  format?: 'standard' | 'currency' | 'percent';
  compilerResult?: CompilerPipelineResult;
}

export type SheetGrid = Record<string, CellData>;

export interface SpreadsheetState {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  cells: SheetGrid;
  selectedCell: string;    // "B2"
  editingCell: string | null;
  editValue: string;
  isCompiled: boolean;
  isDirty: boolean;
}

export interface SheetHistory {
  past: SheetGrid[];
  future: SheetGrid[];
}
