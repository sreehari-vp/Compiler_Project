import type { ASTNode } from '../types/compiler';
import type { SheetGrid } from '../types/spreadsheet';

export type CellValueLookup = (cellId: string) => any;

export class Evaluator {
  private lookup: CellValueLookup;

  constructor(lookupOrGrid: CellValueLookup | SheetGrid) {
    if (typeof lookupOrGrid === 'function') {
      this.lookup = lookupOrGrid;
    } else {
      this.lookup = (cellId: string) => {
        const cell = lookupOrGrid[cellId.toUpperCase()];
        if (!cell) return 0;
        return cell.computedValue;
      };
    }
  }

  public evaluate(ast: ASTNode): any {
    return this.evalNode(ast);
  }

  private evalNode(node: ASTNode): any {
    switch (node.type) {
      case 'NumberLiteral':
        return node.value;

      case 'StringLiteral':
        return node.value;

      case 'BooleanLiteral':
        return node.value;

      case 'CellReference': {
        const val = this.lookup(node.cell.toUpperCase());
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val;
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      }

      case 'RangeReference': {
        const values: any[] = [];
        for (const cellId of node.cells) {
          const val = this.lookup(cellId.toUpperCase());
          values.push(val);
        }
        return values;
      }

      case 'UnaryExpression': {
        const operandVal = this.evalNode(node.operand);
        const num = this.toNumber(operandVal);
        if (node.operator === '-') return -num;
        return num;
      }

      case 'BinaryExpression': {
        const leftVal = this.evalNode(node.left);
        const rightVal = this.evalNode(node.right);

        switch (node.operator) {
          case '+':
            if (typeof leftVal === 'string' || typeof rightVal === 'string') {
              return String(leftVal) + String(rightVal);
            }
            return this.toNumber(leftVal) + this.toNumber(rightVal);

          case '-':
            return this.toNumber(leftVal) - this.toNumber(rightVal);

          case '*':
            return this.toNumber(leftVal) * this.toNumber(rightVal);

          case '/': {
            const denom = this.toNumber(rightVal);
            if (denom === 0) {
              throw new Error('#DIV/0!');
            }
            return this.toNumber(leftVal) / denom;
          }

          case '%': {
            const denom = this.toNumber(rightVal);
            if (denom === 0) {
              throw new Error('#DIV/0!');
            }
            return this.toNumber(leftVal) % denom;
          }

          case '=':
            return leftVal == rightVal;

          case '!=':
            return leftVal != rightVal;

          case '<':
            return leftVal < rightVal;

          case '<=':
            return leftVal <= rightVal;

          case '>':
            return leftVal > rightVal;

          case '>=':
            return leftVal >= rightVal;

          default: {
            const opStr: string = (node as any).operator;
            throw new Error(`Unsupported operator: ${opStr}`);
          }
        }
      }

      case 'FunctionCall': {
        return this.evalFunction(node);
      }
    }
  }

  private evalFunction(node: Extract<ASTNode, { type: 'FunctionCall' }>): any {
    const fnName = node.name.toUpperCase();

    if (fnName === 'IF') {
      if (node.args.length < 2) throw new Error('#VALUE! (IF requires at least 2 arguments)');
      const condition = this.toBoolean(this.evalNode(node.args[0]));
      if (condition) {
        return this.evalNode(node.args[1]);
      } else {
        return node.args.length > 2 ? this.evalNode(node.args[2]) : false;
      }
    }

    const evaledArgs = node.args.map((arg) => this.evalNode(arg));

    switch (fnName) {
      case 'SUM': {
        const nums = this.flattenNumericArgs(evaledArgs);
        return nums.reduce((acc, curr) => acc + curr, 0);
      }

      case 'AVG':
      case 'AVERAGE': {
        const nums = this.flattenNumericArgs(evaledArgs);
        if (nums.length === 0) throw new Error('#DIV/0!');
        const sum = nums.reduce((acc, curr) => acc + curr, 0);
        return sum / nums.length;
      }

      case 'MIN': {
        const nums = this.flattenNumericArgs(evaledArgs);
        if (nums.length === 0) return 0;
        return Math.min(...nums);
      }

      case 'MAX': {
        const nums = this.flattenNumericArgs(evaledArgs);
        if (nums.length === 0) return 0;
        return Math.max(...nums);
      }

      case 'COUNT': {
        const items = this.flattenArgs(evaledArgs);
        return items.filter((item) => {
          if (item === null || item === undefined || item === '') return false;
          return !isNaN(Number(item));
        }).length;
      }

      case 'AND': {
        const bools = this.flattenArgs(evaledArgs).map((item) => this.toBoolean(item));
        if (bools.length === 0) return true;
        return bools.every(Boolean);
      }

      case 'OR': {
        const bools = this.flattenArgs(evaledArgs).map((item) => this.toBoolean(item));
        if (bools.length === 0) return false;
        return bools.some(Boolean);
      }

      case 'NOT': {
        if (evaledArgs.length !== 1) throw new Error('#VALUE! (NOT requires exactly 1 argument)');
        return !this.toBoolean(evaledArgs[0]);
      }

      default:
        throw new Error(`#NAME? Unknown function ${fnName}`);
    }
  }

  private flattenArgs(args: any[]): any[] {
    const result: any[] = [];
    for (const arg of args) {
      if (Array.isArray(arg)) {
        result.push(...this.flattenArgs(arg));
      } else {
        result.push(arg);
      }
    }
    return result;
  }

  private flattenNumericArgs(args: any[]): number[] {
    const flat = this.flattenArgs(args);
    const nums: number[] = [];
    for (const item of flat) {
      if (item === '' || item === null || item === undefined) continue;
      const num = Number(item);
      if (!isNaN(num)) {
        nums.push(num);
      }
    }
    return nums;
  }

  private toNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val === null || val === undefined || val === '') return 0;
    const num = Number(val);
    if (isNaN(num)) {
      throw new Error('#VALUE!');
    }
    return num;
  }

  private toBoolean(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      const upper = val.toUpperCase().trim();
      if (upper === 'TRUE') return true;
      if (upper === 'FALSE') return false;
      return val.length > 0;
    }
    return Boolean(val);
  }
}
