import type { SheetGrid } from '../types/spreadsheet';

export interface SampleSheetPreset {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  colCount: number;
  initialSelectedCell: string;
  cells: SheetGrid;
}

export const SAMPLE_SHEETS: SampleSheetPreset[] = [
  {
    id: 'students_grades',
    name: 'Student Grade & Performance',
    description: 'Academic performance model featuring arithmetic additions, IF logic, and summary aggregations.',
    rowCount: 12,
    colCount: 7,
    initialSelectedCell: 'D2',
    cells: {
      A1: { id: 'A1', raw: 'Student', computedValue: 'Student', valueType: 'string', isFormula: false },
      B1: { id: 'B1', raw: 'Marks', computedValue: 'Marks', valueType: 'string', isFormula: false },
      C1: { id: 'C1', raw: 'Bonus', computedValue: 'Bonus', valueType: 'string', isFormula: false },
      D1: { id: 'D1', raw: 'Final', computedValue: 'Final', valueType: 'string', isFormula: false },
      E1: { id: 'E1', raw: 'Status', computedValue: 'Status', valueType: 'string', isFormula: false },

      A2: { id: 'A2', raw: 'Hari', computedValue: 'Hari', valueType: 'string', isFormula: false },
      B2: { id: 'B2', raw: '80', computedValue: 80, valueType: 'number', isFormula: false },
      C2: { id: 'C2', raw: '10', computedValue: 10, valueType: 'number', isFormula: false },
      D2: { id: 'D2', raw: '=B2+C2', formula: '=B2+C2', computedValue: 90, valueType: 'number', isFormula: true },
      E2: { id: 'E2', raw: '=IF(D2>=75,"Distinction","Pass")', formula: '=IF(D2>=75,"Distinction","Pass")', computedValue: 'Distinction', valueType: 'string', isFormula: true },

      A3: { id: 'A3', raw: 'Arun', computedValue: 'Arun', valueType: 'string', isFormula: false },
      B3: { id: 'B3', raw: '45', computedValue: 45, valueType: 'number', isFormula: false },
      C3: { id: 'C3', raw: '5', computedValue: 5, valueType: 'number', isFormula: false },
      D3: { id: 'D3', raw: '=B3+C3', formula: '=B3+C3', computedValue: 50, valueType: 'number', isFormula: true },
      E3: { id: 'E3', raw: '=IF(D3>=75,"Distinction","Pass")', formula: '=IF(D3>=75,"Distinction","Pass")', computedValue: 'Pass', valueType: 'string', isFormula: true },

      A4: { id: 'A4', raw: 'Priya', computedValue: 'Priya', valueType: 'string', isFormula: false },
      B4: { id: 'B4', raw: '92', computedValue: 92, valueType: 'number', isFormula: false },
      C4: { id: 'C4', raw: '8', computedValue: 8, valueType: 'number', isFormula: false },
      D4: { id: 'D4', raw: '=B4+C4', formula: '=B4+C4', computedValue: 100, valueType: 'number', isFormula: true },
      E4: { id: 'E4', raw: '=IF(D4>=75,"Distinction","Pass")', formula: '=IF(D4>=75,"Distinction","Pass")', computedValue: 'Distinction', valueType: 'string', isFormula: true },

      A5: { id: 'A5', raw: 'Karthik', computedValue: 'Karthik', valueType: 'string', isFormula: false },
      B5: { id: 'B5', raw: '67', computedValue: 67, valueType: 'number', isFormula: false },
      C5: { id: 'C5', raw: '7', computedValue: 7, valueType: 'number', isFormula: false },
      D5: { id: 'D5', raw: '=B5+C5', formula: '=B5+C5', computedValue: 74, valueType: 'number', isFormula: true },
      E5: { id: 'E5', raw: '=IF(D5>=75,"Distinction","Pass")', formula: '=IF(D5>=75,"Distinction","Pass")', computedValue: 'Pass', valueType: 'string', isFormula: true },

      A7: { id: 'A7', raw: 'Class Average', computedValue: 'Class Average', valueType: 'string', isFormula: false },
      B7: { id: 'B7', raw: '=AVG(D2:D5)', formula: '=AVG(D2:D5)', computedValue: 78.5, valueType: 'number', isFormula: true },

      A8: { id: 'A8', raw: 'Class Max', computedValue: 'Class Max', valueType: 'string', isFormula: false },
      B8: { id: 'B8', raw: '=MAX(D2:D5)', formula: '=MAX(D2:D5)', computedValue: 100, valueType: 'number', isFormula: true },

      A9: { id: 'A9', raw: 'Total Count', computedValue: 'Total Count', valueType: 'string', isFormula: false },
      B9: { id: 'B9', raw: '=COUNT(B2:B5)', formula: '=COUNT(B2:B5)', computedValue: 4, valueType: 'number', isFormula: true },
    },
  },
  {
    id: 'sales_pipeline',
    name: 'Sales Commission & Multi-tier Pipeline',
    description: 'Demonstrating chained dependencies, compound boolean logic AND/OR, and tiered incentives.',
    rowCount: 12,
    colCount: 8,
    initialSelectedCell: 'E2',
    cells: {
      A1: { id: 'A1', raw: 'Representative', computedValue: 'Representative', valueType: 'string', isFormula: false },
      B1: { id: 'B1', raw: 'Target ($)', computedValue: 'Target ($)', valueType: 'string', isFormula: false },
      C1: { id: 'C1', raw: 'Actual ($)', computedValue: 'Actual ($)', valueType: 'string', isFormula: false },
      D1: { id: 'D1', raw: 'Rate (%)', computedValue: 'Rate (%)', valueType: 'string', isFormula: false },
      E1: { id: 'E1', raw: 'Commission ($)', computedValue: 'Commission ($)', valueType: 'string', isFormula: false },
      F1: { id: 'F1', raw: 'Incentive ($)', computedValue: 'Incentive ($)', valueType: 'string', isFormula: false },
      G1: { id: 'G1', raw: 'Total Payout', computedValue: 'Total Payout', valueType: 'string', isFormula: false },

      A2: { id: 'A2', raw: 'Sarah Chen', computedValue: 'Sarah Chen', valueType: 'string', isFormula: false },
      B2: { id: 'B2', raw: '10000', computedValue: 10000, valueType: 'number', isFormula: false },
      C2: { id: 'C2', raw: '14500', computedValue: 14500, valueType: 'number', isFormula: false },
      D2: { id: 'D2', raw: '=IF(C2>12000, 0.15, 0.10)', formula: '=IF(C2>12000, 0.15, 0.10)', computedValue: 0.15, valueType: 'number', isFormula: true },
      E2: { id: 'E2', raw: '=C2*D2', formula: '=C2*D2', computedValue: 2175, valueType: 'number', isFormula: true },
      F2: { id: 'F2', raw: '=IF(AND(C2>=B2, C2>12000), 500, 100)', formula: '=IF(AND(C2>=B2, C2>12000), 500, 100)', computedValue: 500, valueType: 'number', isFormula: true },
      G2: { id: 'G2', raw: '=E2+F2', formula: '=E2+F2', computedValue: 2675, valueType: 'number', isFormula: true },

      A3: { id: 'A3', raw: 'Michael Scott', computedValue: 'Michael Scott', valueType: 'string', isFormula: false },
      B3: { id: 'B3', raw: '10000', computedValue: 10000, valueType: 'number', isFormula: false },
      C3: { id: 'C3', raw: '8200', computedValue: 8200, valueType: 'number', isFormula: false },
      D3: { id: 'D3', raw: '=IF(C3>12000, 0.15, 0.10)', formula: '=IF(C3>12000, 0.15, 0.10)', computedValue: 0.10, valueType: 'number', isFormula: true },
      E3: { id: 'E3', raw: '=C3*D3', formula: '=C3*D3', computedValue: 820, valueType: 'number', isFormula: true },
      F3: { id: 'F3', raw: '=IF(AND(C3>=B3, C3>12000), 500, 100)', formula: '=IF(AND(C3>=B3, C3>12000), 500, 100)', computedValue: 100, valueType: 'number', isFormula: true },
      G3: { id: 'G3', raw: '=E3+F3', formula: '=E3+F3', computedValue: 920, valueType: 'number', isFormula: true },

      A5: { id: 'A5', raw: 'Gross Volume', computedValue: 'Gross Volume', valueType: 'string', isFormula: false },
      C5: { id: 'C5', raw: '=SUM(C2:C3)', formula: '=SUM(C2:C3)', computedValue: 22700, valueType: 'number', isFormula: true },
      G5: { id: 'G5', raw: '=SUM(G2:G3)', formula: '=SUM(G2:G3)', computedValue: 3595, valueType: 'number', isFormula: true },
    },
  },
  {
    id: 'compiler_benchmark',
    name: 'Compiler Laboratory & Optimizations',
    description: 'Designed specifically to demonstrate constant folding, algebraic simplification, and multi-tier dependency chains.',
    rowCount: 12,
    colCount: 7,
    initialSelectedCell: 'C2',
    cells: {
      A1: { id: 'A1', raw: 'Base Value', computedValue: 'Base Value', valueType: 'string', isFormula: false },
      B1: { id: 'B1', raw: 'Input Factor', computedValue: 'Input Factor', valueType: 'string', isFormula: false },
      C1: { id: 'C1', raw: 'Constant Folded', computedValue: 'Constant Folded', valueType: 'string', isFormula: false },
      D1: { id: 'D1', raw: 'Algebraic Simp', computedValue: 'Algebraic Simp', valueType: 'string', isFormula: false },
      E1: { id: 'E1', raw: 'Chained Result', computedValue: 'Chained Result', valueType: 'string', isFormula: false },

      A2: { id: 'A2', raw: '25', computedValue: 25, valueType: 'number', isFormula: false },
      B2: { id: 'B2', raw: '4', computedValue: 4, valueType: 'number', isFormula: false },
      C2: { id: 'C2', raw: '=10*5+A2', formula: '=10*5+A2', computedValue: 75, valueType: 'number', isFormula: true },
      D2: { id: 'D2', raw: '=B2*1+0', formula: '=B2*1+0', computedValue: 4, valueType: 'number', isFormula: true },
      E2: { id: 'E2', raw: '=C2*D2', formula: '=C2*D2', computedValue: 300, valueType: 'number', isFormula: true },

      A3: { id: 'A3', raw: '100', computedValue: 100, valueType: 'number', isFormula: false },
      B3: { id: 'B3', raw: '0', computedValue: 0, valueType: 'number', isFormula: false },
      C3: { id: 'C3', raw: '=A3*0', formula: '=A3*0', computedValue: 0, valueType: 'number', isFormula: true },
      D3: { id: 'D3', raw: '=IF(TRUE, A3*2, B3)', formula: '=IF(TRUE, A3*2, B3)', computedValue: 200, valueType: 'number', isFormula: true },
      E3: { id: 'E3', raw: '=D3+C3', formula: '=D3+C3', computedValue: 200, valueType: 'number', isFormula: true },
    },
  },
];
