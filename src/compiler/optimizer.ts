import type {
  ASTNode,
  OptimizationStep,
  NumberLiteralNode,
  BooleanLiteralNode,
} from '../types/compiler';
import { createNodeId, printASTExpression } from './ast';

export class Optimizer {
  private steps: OptimizationStep[] = [];

  public optimize(ast: ASTNode): { optimizedAst: ASTNode; steps: OptimizationStep[] } {
    this.steps = [];

    let currentAst = this.deepClone(ast);
    let passCount = 0;
    const maxPasses = 10;
    let changed = true;

    while (changed && passCount < maxPasses) {
      passCount++;
      const beforeStr = printASTExpression(currentAst);
      currentAst = this.optimizeNode(currentAst);
      const afterStr = printASTExpression(currentAst);
      changed = beforeStr !== afterStr;
    }

    return {
      optimizedAst: currentAst,
      steps: this.steps,
    };
  }

  private optimizeNode(node: ASTNode): ASTNode {
    switch (node.type) {
      case 'BinaryExpression': {
        const left = this.optimizeNode(node.left);
        const right = this.optimizeNode(node.right);
        const op = node.operator;

        if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
          const lVal = left.value;
          const rVal = right.value;
          let foldedValue: number | boolean | null = null;

          if (op === '+') foldedValue = lVal + rVal;
          else if (op === '-') foldedValue = lVal - rVal;
          else if (op === '*') foldedValue = lVal * rVal;
          else if (op === '/' && rVal !== 0) foldedValue = lVal / rVal;
          else if (op === '%' && rVal !== 0) foldedValue = lVal % rVal;
          else if (op === '=') foldedValue = lVal === rVal;
          else if (op === '!=') foldedValue = lVal !== rVal;
          else if (op === '<') foldedValue = lVal < rVal;
          else if (op === '<=') foldedValue = lVal <= rVal;
          else if (op === '>') foldedValue = lVal > rVal;
          else if (op === '>=') foldedValue = lVal >= rVal;

          if (foldedValue !== null) {
            const beforeSnippet = `${left.raw} ${op} ${right.raw}`;
            if (typeof foldedValue === 'boolean') {
              const boolNode: BooleanLiteralNode = {
                id: createNodeId('opt_bool'),
                type: 'BooleanLiteral',
                value: foldedValue,
                raw: foldedValue ? 'TRUE' : 'FALSE',
                position: node.position,
              };
              this.steps.push({
                rule: 'Constant Folding',
                description: `Folded constant comparison ${beforeSnippet} → ${boolNode.raw}`,
                beforeSnippet,
                afterSnippet: boolNode.raw,
                location: node.position,
              });
              return boolNode;
            } else {
              const numNode: NumberLiteralNode = {
                id: createNodeId('opt_num'),
                type: 'NumberLiteral',
                value: foldedValue,
                raw: foldedValue.toString(),
                position: node.position,
              };
              this.steps.push({
                rule: 'Constant Folding',
                description: `Computed constant arithmetic expression ${beforeSnippet} → ${numNode.raw}`,
                beforeSnippet,
                afterSnippet: numNode.raw,
                location: node.position,
              });
              return numNode;
            }
          }
        }

        if (op === '+' && right.type === 'NumberLiteral' && right.value === 0) {
          this.recordSimplification(`${printASTExpression(left)} + 0`, printASTExpression(left), 'Additive identity: X + 0 = X');
          return left;
        }

        if (op === '+' && left.type === 'NumberLiteral' && left.value === 0) {
          this.recordSimplification(`0 + ${printASTExpression(right)}`, printASTExpression(right), 'Additive identity: 0 + X = X');
          return right;
        }

        if (op === '-' && right.type === 'NumberLiteral' && right.value === 0) {
          this.recordSimplification(`${printASTExpression(left)} - 0`, printASTExpression(left), 'Additive identity: X - 0 = X');
          return left;
        }

        if (op === '-' && left.type === 'CellReference' && right.type === 'CellReference' && left.cell === right.cell) {
          const zeroNode: NumberLiteralNode = {
            id: createNodeId('opt_zero'),
            type: 'NumberLiteral',
            value: 0,
            raw: '0',
            position: node.position,
          };
          this.recordSimplification(`${left.cell} - ${right.cell}`, '0', 'Self-subtraction: X - X = 0');
          return zeroNode;
        }

        if (op === '*' && right.type === 'NumberLiteral' && right.value === 1) {
          this.recordSimplification(`${printASTExpression(left)} * 1`, printASTExpression(left), 'Multiplicative identity: X * 1 = X');
          return left;
        }

        if (op === '*' && left.type === 'NumberLiteral' && left.value === 1) {
          this.recordSimplification(`1 * ${printASTExpression(right)}`, printASTExpression(right), 'Multiplicative identity: 1 * X = X');
          return right;
        }

        if (op === '*' && right.type === 'NumberLiteral' && right.value === 0) {
          const zeroNode: NumberLiteralNode = {
            id: createNodeId('opt_zero'),
            type: 'NumberLiteral',
            value: 0,
            raw: '0',
            position: node.position,
          };
          this.recordSimplification(`${printASTExpression(left)} * 0`, '0', 'Zero multiplication property: X * 0 = 0');
          return zeroNode;
        }

        if (op === '*' && left.type === 'NumberLiteral' && left.value === 0) {
          const zeroNode: NumberLiteralNode = {
            id: createNodeId('opt_zero'),
            type: 'NumberLiteral',
            value: 0,
            raw: '0',
            position: node.position,
          };
          this.recordSimplification(`0 * ${printASTExpression(right)}`, '0', 'Zero multiplication property: 0 * X = 0');
          return zeroNode;
        }

        if (op === '/' && right.type === 'NumberLiteral' && right.value === 1) {
          this.recordSimplification(`${printASTExpression(left)} / 1`, printASTExpression(left), 'Division identity: X / 1 = X');
          return left;
        }

        return {
          ...node,
          left,
          right,
        };
      }

      case 'UnaryExpression': {
        const operand = this.optimizeNode(node.operand);

        if (operand.type === 'NumberLiteral') {
          const foldedVal = node.operator === '-' ? -operand.value : operand.value;
          const numNode: NumberLiteralNode = {
            id: createNodeId('opt_unary_num'),
            type: 'NumberLiteral',
            value: foldedVal,
            raw: foldedVal.toString(),
            position: node.position,
          };
          this.steps.push({
            rule: 'Constant Folding',
            description: `Folded unary ${node.operator}${operand.raw} → ${numNode.raw}`,
            beforeSnippet: `${node.operator}${operand.raw}`,
            afterSnippet: numNode.raw,
            location: node.position,
          });
          return numNode;
        }

        if (node.operator === '-' && operand.type === 'UnaryExpression' && operand.operator === '-') {
          this.recordSimplification(`-(-${printASTExpression(operand.operand)})`, printASTExpression(operand.operand), 'Double negation elimination: -(-X) = X');
          return operand.operand;
        }

        return {
          ...node,
          operand,
        };
      }

      case 'FunctionCall': {
        const optimizedArgs = node.args.map((arg) => this.optimizeNode(arg));

        if (node.name.toUpperCase() === 'IF' && optimizedArgs.length >= 2) {
          const cond = optimizedArgs[0];
          if (cond.type === 'BooleanLiteral') {
            if (cond.value) {
              const trueBranch = optimizedArgs[1];
              this.recordSimplification(`IF(TRUE, ${printASTExpression(trueBranch)}, ...)`, printASTExpression(trueBranch), 'Dead branch elimination: IF condition is statically TRUE');
              return trueBranch;
            } else if (optimizedArgs.length >= 3) {
              const falseBranch = optimizedArgs[2];
              this.recordSimplification(`IF(FALSE, ..., ${printASTExpression(falseBranch)})`, printASTExpression(falseBranch), 'Dead branch elimination: IF condition is statically FALSE');
              return falseBranch;
            }
          }
        }

        if (node.name.toUpperCase() === 'NOT' && optimizedArgs.length === 1) {
          const inner = optimizedArgs[0];
          if (inner.type === 'FunctionCall' && inner.name.toUpperCase() === 'NOT' && inner.args.length === 1) {
            this.recordSimplification(`NOT(NOT(${printASTExpression(inner.args[0])}))`, printASTExpression(inner.args[0]), 'Double logical negation: NOT(NOT(X)) = X');
            return inner.args[0];
          }
          if (inner.type === 'BooleanLiteral') {
            const inverted: BooleanLiteralNode = {
              id: createNodeId('opt_not'),
              type: 'BooleanLiteral',
              value: !inner.value,
              raw: !inner.value ? 'TRUE' : 'FALSE',
              position: node.position,
            };
            this.recordSimplification(`NOT(${inner.raw})`, inverted.raw, 'Constant logical inversion');
            return inverted;
          }
        }

        return {
          ...node,
          args: optimizedArgs,
        };
      }

      default:
        return node;
    }
  }

  private recordSimplification(before: string, after: string, description: string): void {
    this.steps.push({
      rule: 'Algebraic Simplification',
      description,
      beforeSnippet: before,
      afterSnippet: after,
    });
  }

  private deepClone(node: ASTNode): ASTNode {
    return JSON.parse(JSON.stringify(node));
  }
}
