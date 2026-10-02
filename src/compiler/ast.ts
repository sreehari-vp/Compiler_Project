import type { ASTNode } from '../types/compiler';
import { expandRange } from '../utils/cellUtils';

let idCounter = 0;
export function createNodeId(prefix: string = 'node'): string {
  return `${prefix}_${++idCounter}`;
}

export function resetNodeIdCounter(): void {
  idCounter = 0;
}

export function traverseAST(node: ASTNode, visitor: (node: ASTNode, parent: ASTNode | null) => void, parent: ASTNode | null = null): void {
  visitor(node, parent);

  switch (node.type) {
    case 'BinaryExpression':
      traverseAST(node.left, visitor, node);
      traverseAST(node.right, visitor, node);
      break;
    case 'UnaryExpression':
      traverseAST(node.operand, visitor, node);
      break;
    case 'FunctionCall':
      for (const arg of node.args) {
        traverseAST(arg, visitor, node);
      }
      break;
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'CellReference':
    case 'RangeReference':
      break;
  }
}

export function extractDependenciesFromAST(root: ASTNode): { cells: string[]; ranges: string[] } {
  const cellSet = new Set<string>();
  const rangeSet = new Set<string>();

  traverseAST(root, (node) => {
    if (node.type === 'CellReference') {
      cellSet.add(node.cell.toUpperCase());
    } else if (node.type === 'RangeReference') {
      rangeSet.add(node.range.toUpperCase());
      const expanded = expandRange(node.range);
      for (const c of expanded) {
        cellSet.add(c.toUpperCase());
      }
    }
  });

  return {
    cells: Array.from(cellSet),
    ranges: Array.from(rangeSet),
  };
}

export function countASTNodes(root: ASTNode): number {
  let count = 0;
  traverseAST(root, () => {
    count++;
  });
  return count;
}

export function getASTDepth(root: ASTNode): number {
  switch (root.type) {
    case 'BinaryExpression':
      return 1 + Math.max(getASTDepth(root.left), getASTDepth(root.right));
    case 'UnaryExpression':
      return 1 + getASTDepth(root.operand);
    case 'FunctionCall':
      return 1 + (root.args.length > 0 ? Math.max(...root.args.map(getASTDepth)) : 0);
    default:
      return 1;
  }
}

export function printASTExpression(node: ASTNode): string {
  switch (node.type) {
    case 'NumberLiteral':
      return node.raw;
    case 'StringLiteral':
      return `"${node.value}"`;
    case 'BooleanLiteral':
      return node.value ? 'TRUE' : 'FALSE';
    case 'CellReference':
      return node.cell;
    case 'RangeReference':
      return node.range;
    case 'UnaryExpression':
      return `${node.operator}${printASTExpression(node.operand)}`;
    case 'BinaryExpression':
      return `(${printASTExpression(node.left)} ${node.operator} ${printASTExpression(node.right)})`;
    case 'FunctionCall':
      return `${node.name}(${node.args.map(printASTExpression).join(', ')})`;
  }
}
