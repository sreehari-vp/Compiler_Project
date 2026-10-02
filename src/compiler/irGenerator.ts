import type { ASTNode, IRInstruction, IROp } from '../types/compiler';

export class IRGenerator {
  private instructions: IRInstruction[] = [];
  private tempCounter: number = 0;

  public generate(ast: ASTNode): IRInstruction[] {
    this.instructions = [];
    this.tempCounter = 0;

    const resultRegister = this.generateNode(ast);
    this.addInstruction('RETURN', undefined, [resultRegister], `RETURN ${resultRegister}`, 'Return final formula value');

    return this.instructions;
  }

  private nextTemp(): string {
    return `t${++this.tempCounter}`;
  }

  private addInstruction(op: IROp, dest: string | undefined, args: (string | number | boolean)[], text: string, comment?: string): string {
    const inst: IRInstruction = {
      index: this.instructions.length + 1,
      op,
      dest,
      args,
      text,
      comment,
    };
    this.instructions.push(inst);
    return dest || '';
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'NumberLiteral': {
        const dest = this.nextTemp();
        this.addInstruction('CONST', dest, [node.value], `${dest} = CONST ${node.value}`, `Load numeric literal ${node.value}`);
        return dest;
      }

      case 'StringLiteral': {
        const dest = this.nextTemp();
        this.addInstruction('CONST', dest, [`"${node.value}"`], `${dest} = CONST "${node.value}"`, `Load text string "${node.value}"`);
        return dest;
      }

      case 'BooleanLiteral': {
        const dest = this.nextTemp();
        const boolStr = node.value ? 'TRUE' : 'FALSE';
        this.addInstruction('CONST', dest, [boolStr], `${dest} = CONST ${boolStr}`, `Load boolean literal ${boolStr}`);
        return dest;
      }

      case 'CellReference': {
        const dest = this.nextTemp();
        this.addInstruction('LOAD', dest, [node.cell], `${dest} = LOAD ${node.cell}`, `Read value from cell ${node.cell}`);
        return dest;
      }

      case 'RangeReference': {
        const dest = this.nextTemp();
        this.addInstruction(
          'LOAD_RANGE',
          dest,
          [node.range],
          `${dest} = LOAD_RANGE ${node.range}`,
          `Collect values from range ${node.range} (${node.cells.length} cells)`
        );
        return dest;
      }

      case 'UnaryExpression': {
        const operandReg = this.generateNode(node.operand);
        const dest = this.nextTemp();
        if (node.operator === '-') {
          this.addInstruction('NEG', dest, [operandReg], `${dest} = NEG ${operandReg}`, `Negate ${operandReg}`);
        } else {
          return operandReg;
        }
        return dest;
      }

      case 'BinaryExpression': {
        const leftReg = this.generateNode(node.left);
        const rightReg = this.generateNode(node.right);
        const dest = this.nextTemp();

        let op: IROp;
        let opName: string;
        switch (node.operator) {
          case '+':
            op = 'ADD';
            opName = 'ADD';
            break;
          case '-':
            op = 'SUB';
            opName = 'SUB';
            break;
          case '*':
            op = 'MUL';
            opName = 'MUL';
            break;
          case '/':
            op = 'DIV';
            opName = 'DIV';
            break;
          case '%':
            op = 'MOD';
            opName = 'MOD';
            break;
          case '=':
            op = 'EQ';
            opName = 'EQ';
            break;
          case '!=':
            op = 'NEQ';
            opName = 'NEQ';
            break;
          case '<':
            op = 'LT';
            opName = 'LT';
            break;
          case '<=':
            op = 'LTE';
            opName = 'LTE';
            break;
          case '>':
            op = 'GT';
            opName = 'GT';
            break;
          case '>=':
            op = 'GTE';
            opName = 'GTE';
            break;
          default:
            op = 'ADD';
            opName = 'ADD';
        }

        this.addInstruction(
          op,
          dest,
          [leftReg, rightReg],
          `${dest} = ${opName} ${leftReg}, ${rightReg}`,
          `Binary operation ${node.operator} on ${leftReg} and ${rightReg}`
        );
        return dest;
      }

      case 'FunctionCall': {
        const fnName = node.name.toUpperCase();

        if (fnName === 'IF' && node.args.length >= 2) {
          const condReg = this.generateNode(node.args[0]);
          const trueReg = this.generateNode(node.args[1]);
          const falseReg = node.args.length > 2 ? this.generateNode(node.args[2]) : 'FALSE';
          const dest = this.nextTemp();

          this.addInstruction(
            'IF_THEN_ELSE',
            dest,
            [condReg, trueReg, falseReg],
            `${dest} = IF ${condReg}, ${trueReg}, ${falseReg}`,
            `Conditional branch: if ${condReg} then ${trueReg} else ${falseReg}`
          );
          return dest;
        }

        const argRegs = node.args.map((arg) => this.generateNode(arg));
        const dest = this.nextTemp();
        this.addInstruction(
          'CALL',
          dest,
          [fnName, ...argRegs],
          `${dest} = CALL ${fnName}(${argRegs.join(', ')})`,
          `Call built-in function ${fnName} with ${argRegs.length} argument(s)`
        );
        return dest;
      }
    }
  }
}
