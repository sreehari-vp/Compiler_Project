import type { ASTNode, Diagnostic } from '../types/compiler';
import { traverseAST } from './ast';
import { isValidCellReference, parseCellAddress } from '../utils/cellUtils';
import type { SheetGrid } from '../types/spreadsheet';

export interface FunctionSignature {
  name: string;
  minArgs: number;
  maxArgs: number;
  description: string;
  example: string;
}

export const SUPPORTED_FUNCTIONS: Record<string, FunctionSignature> = {
  SUM: {
    name: 'SUM',
    minArgs: 1,
    maxArgs: 255,
    description: 'Calculates the sum of all numeric values or cell ranges.',
    example: 'SUM(A1:A10, B1)',
  },
  AVG: {
    name: 'AVG',
    minArgs: 1,
    maxArgs: 255,
    description: 'Calculates the average (arithmetic mean) of numeric values.',
    example: 'AVG(B2:B20)',
  },
  AVERAGE: {
    name: 'AVERAGE',
    minArgs: 1,
    maxArgs: 255,
    description: 'Calculates the average (arithmetic mean) of numeric values.',
    example: 'AVERAGE(B2:B20)',
  },
  MIN: {
    name: 'MIN',
    minArgs: 1,
    maxArgs: 255,
    description: 'Finds the minimum value among arguments or ranges.',
    example: 'MIN(A1:C10)',
  },
  MAX: {
    name: 'MAX',
    minArgs: 1,
    maxArgs: 255,
    description: 'Finds the maximum value among arguments or ranges.',
    example: 'MAX(A1:C10)',
  },
  COUNT: {
    name: 'COUNT',
    minArgs: 1,
    maxArgs: 255,
    description: 'Counts the number of cells containing numbers or non-empty items.',
    example: 'COUNT(A1:A10)',
  },
  IF: {
    name: 'IF',
    minArgs: 2,
    maxArgs: 3,
    description: 'Returns one value if condition is TRUE and another if FALSE.',
    example: 'IF(B2>50, B2*2, C2)',
  },
  AND: {
    name: 'AND',
    minArgs: 1,
    maxArgs: 255,
    description: 'Returns TRUE if all logical conditions evaluate to TRUE.',
    example: 'AND(B2>50, C2>10)',
  },
  OR: {
    name: 'OR',
    minArgs: 1,
    maxArgs: 255,
    description: 'Returns TRUE if any logical condition evaluates to TRUE.',
    example: 'OR(B2>90, C2>90)',
  },
  NOT: {
    name: 'NOT',
    minArgs: 1,
    maxArgs: 1,
    description: 'Reverses the boolean value of its argument.',
    example: 'NOT(A1=0)',
  },
};

export class SemanticAnalyzer {
  private targetCell: string;
  private grid?: SheetGrid;
  public diagnostics: Diagnostic[] = [];

  constructor(targetCell: string, grid?: SheetGrid) {
    this.targetCell = targetCell.toUpperCase();
    this.grid = grid;
  }

  public analyze(ast: ASTNode): Diagnostic[] {
    this.diagnostics = [];

    traverseAST(ast, (node) => {
      this.checkNode(node);
    });

    return this.diagnostics;
  }

  private checkNode(node: ASTNode): void {
    switch (node.type) {
      case 'FunctionCall':
        this.checkFunctionCall(node);
        break;

      case 'CellReference':
        this.checkCellReference(node);
        break;

      case 'RangeReference':
        this.checkRangeReference(node);
        break;

      case 'BinaryExpression':
        this.checkBinaryExpression(node);
        break;

      case 'UnaryExpression':
        this.checkUnaryExpression(node);
        break;
    }
  }

  private checkFunctionCall(node: Extract<ASTNode, { type: 'FunctionCall' }>): void {
    const fnName = node.name.toUpperCase();
    const sig = SUPPORTED_FUNCTIONS[fnName];

    if (!sig) {
      const knownNames = Object.keys(SUPPORTED_FUNCTIONS).join(', ');
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Unknown function '${node.name}'`,
        position: node.position,
        cell: this.targetCell,
        suggestion: `Supported functions are: ${knownNames}`,
      });
      return;
    }

    const argCount = node.args.length;
    if (argCount < sig.minArgs) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Function '${sig.name}' expects at least ${sig.minArgs} argument(s), but received ${argCount}`,
        position: node.position,
        cell: this.targetCell,
        suggestion: `Usage: =${sig.example}`,
      });
    } else if (argCount > sig.maxArgs) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Function '${sig.name}' expects at most ${sig.maxArgs} argument(s), but received ${argCount}`,
        position: node.position,
        cell: this.targetCell,
        suggestion: `Usage: =${sig.example}`,
      });
    }

    if (fnName === 'IF') {
      const condition = node.args[0];
      if (condition.type === 'StringLiteral') {
        this.diagnostics.push({
          phase: 'semantic',
          severity: 'warning',
          message: `IF condition is a literal text "${condition.value}", which evaluates to truthy`,
          position: condition.position,
          cell: this.targetCell,
          suggestion: 'Expected a comparison expression such as B2>50',
        });
      }
    }
  }

  private checkCellReference(node: Extract<ASTNode, { type: 'CellReference' }>): void {
    const cellRef = node.cell.toUpperCase();

    if (this.targetCell && cellRef === this.targetCell) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Direct self-reference: Cell ${cellRef} cannot reference itself in its own formula`,
        position: node.position,
        cell: this.targetCell,
        suggestion: `Remove the self-reference to avoid circular dependency loop`,
      });
    }

    if (!isValidCellReference(cellRef)) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Invalid cell coordinate '${node.cell}'`,
        position: node.position,
        cell: this.targetCell,
        suggestion: 'Specify column letters followed by row number (e.g. A1, B2)',
      });
    }

    if (this.grid) {
      const cellData = this.grid[cellRef];
      if (!cellData || cellData.valueType === 'empty') {
        this.diagnostics.push({
          phase: 'semantic',
          severity: 'info',
          message: `Referenced cell ${cellRef} is currently empty (treated as 0 in numeric operations)`,
          position: node.position,
          cell: this.targetCell,
          suggestion: `Ensure ${cellRef} has an intended value`,
        });
      }
    }
  }

  private checkRangeReference(node: Extract<ASTNode, { type: 'RangeReference' }>): void {
    const startAddr = parseCellAddress(node.startCell);
    const endAddr = parseCellAddress(node.endCell);

    if (!startAddr || !endAddr) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Invalid range specification '${node.range}'`,
        position: node.position,
        cell: this.targetCell,
        suggestion: 'Specify two valid cell coordinates separated by colon, e.g. A1:B10',
      });
      return;
    }

    if (this.targetCell && node.cells.includes(this.targetCell)) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Self-reference in range: Range ${node.range} includes target cell ${this.targetCell}`,
        position: node.position,
        cell: this.targetCell,
        suggestion: `Adjust range boundaries to exclude ${this.targetCell}`,
      });
    }
  }

  private checkBinaryExpression(node: Extract<ASTNode, { type: 'BinaryExpression' }>): void {
    const { operator, left, right } = node;

    if ((operator === '/' || operator === '%') && right.type === 'NumberLiteral' && right.value === 0) {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Division by zero literal in expression`,
        position: right.position,
        cell: this.targetCell,
        suggestion: 'Denominator cannot be zero',
      });
    }

    const arithmeticOps = ['+', '-', '*', '/', '%'];
    if (arithmeticOps.includes(operator)) {
      if (left.type === 'StringLiteral') {
        this.diagnostics.push({
          phase: 'semantic',
          severity: 'error',
          message: `Type Error: Incompatible operation. Cannot apply '${operator}' to text string "${left.value}"`,
          position: left.position,
          cell: this.targetCell,
          suggestion: 'Ensure operands in arithmetic expressions are numbers or numeric cell references',
        });
      }
      if (right.type === 'StringLiteral') {
        this.diagnostics.push({
          phase: 'semantic',
          severity: 'error',
          message: `Type Error: Incompatible operation. Cannot apply '${operator}' to text string "${right.value}"`,
          position: right.position,
          cell: this.targetCell,
          suggestion: 'Ensure operands in arithmetic expressions are numbers or numeric cell references',
        });
      }
    }
  }

  private checkUnaryExpression(node: Extract<ASTNode, { type: 'UnaryExpression' }>): void {
    if (node.operand.type === 'StringLiteral') {
      this.diagnostics.push({
        phase: 'semantic',
        severity: 'error',
        message: `Type Error: Cannot apply unary '${node.operator}' to string "${node.operand.value}"`,
        position: node.position,
        cell: this.targetCell,
      });
    }
  }
}
