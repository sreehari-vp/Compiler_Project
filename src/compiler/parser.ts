import type {
  Token,
  TokenType,
  ASTNode,
  BinaryOperator,
  UnaryOperator,
  Diagnostic,
  SourcePosition,
  BinaryExpressionNode,
  UnaryExpressionNode,
  FunctionCallNode,
  CellReferenceNode,
  RangeReferenceNode,
} from '../types/compiler';
import { createNodeId } from './ast';
import { expandRange, parseCellAddress } from '../utils/cellUtils';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  public diagnostics: Diagnostic[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): ASTNode | null {
    this.current = 0;
    this.diagnostics = [];

    if (this.match('EQUALS')) {
      // consumed
    }

    if (this.isAtEnd()) {
      this.addError('Empty formula expression', this.peek().position, 'Enter a valid value or expression, e.g. =A1+B1');
      return null;
    }

    try {
      const expr = this.parseExpression();

      if (!this.isAtEnd() && this.peek().type !== 'EOF') {
        const unexpected = this.peek();
        this.addError(
          `Unexpected token '${unexpected.value}' after expression`,
          unexpected.position,
          'Check for misplaced operators, extra parentheses, or missing commas'
        );
      }

      return expr;
    } catch (err: any) {
      if (this.diagnostics.length === 0) {
        this.addError(
          err.message || 'Syntax error while parsing formula',
          this.peek().position,
          'Ensure the formula follows standard spreadsheet syntax'
        );
      }
      return null;
    }
  }

  private parseExpression(): ASTNode {
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    let expr = this.parseAdditive();

    while (
      this.check('EQ') ||
      this.check('NEQ') ||
      this.check('LT') ||
      this.check('LTE') ||
      this.check('GT') ||
      this.check('GTE')
    ) {
      const operatorToken = this.advance();
      let operator: BinaryOperator;

      switch (operatorToken.type) {
        case 'EQ':
          operator = '=';
          break;
        case 'NEQ':
          operator = '!=';
          break;
        case 'LT':
          operator = '<';
          break;
        case 'LTE':
          operator = '<=';
          break;
        case 'GT':
          operator = '>';
          break;
        case 'GTE':
          operator = '>=';
          break;
        default:
          operator = '=';
      }

      const right = this.parseAdditive();
      const node: BinaryExpressionNode = {
        id: createNodeId('bin_cmp'),
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        position: {
          start: expr.position.start,
          end: right.position.end,
          line: expr.position.line,
          column: expr.position.column,
        },
      };
      expr = node;
    }

    return expr;
  }

  private parseAdditive(): ASTNode {
    let expr = this.parseMultiplicative();

    while (this.check('PLUS') || this.check('MINUS')) {
      const operatorToken = this.advance();
      const operator: BinaryOperator = operatorToken.type === 'PLUS' ? '+' : '-';
      const right = this.parseMultiplicative();

      const node: BinaryExpressionNode = {
        id: createNodeId('bin_add'),
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        position: {
          start: expr.position.start,
          end: right.position.end,
          line: expr.position.line,
          column: expr.position.column,
        },
      };
      expr = node;
    }

    return expr;
  }

  private parseMultiplicative(): ASTNode {
    let expr = this.parseUnary();

    while (this.check('MULTIPLY') || this.check('DIVIDE') || this.check('MODULO')) {
      const operatorToken = this.advance();
      let operator: BinaryOperator;
      if (operatorToken.type === 'MULTIPLY') operator = '*';
      else if (operatorToken.type === 'DIVIDE') operator = '/';
      else operator = '%';

      const right = this.parseUnary();

      const node: BinaryExpressionNode = {
        id: createNodeId('bin_mul'),
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        position: {
          start: expr.position.start,
          end: right.position.end,
          line: expr.position.line,
          column: expr.position.column,
        },
      };
      expr = node;
    }

    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.check('PLUS') || this.check('MINUS')) {
      const operatorToken = this.advance();
      const operator: UnaryOperator = operatorToken.type === 'PLUS' ? '+' : '-';
      const operand = this.parseUnary();

      const node: UnaryExpressionNode = {
        id: createNodeId('unary'),
        type: 'UnaryExpression',
        operator,
        operand,
        position: {
          start: operatorToken.position.start,
          end: operand.position.end,
          line: operatorToken.position.line,
          column: operatorToken.position.column,
        },
      };
      return node;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (this.match('NUMBER')) {
      const val = parseFloat(token.value);
      return {
        id: createNodeId('num'),
        type: 'NumberLiteral',
        value: val,
        raw: token.value,
        position: token.position,
      };
    }

    if (this.match('STRING')) {
      return {
        id: createNodeId('str'),
        type: 'StringLiteral',
        value: token.value,
        raw: `"${token.value}"`,
        position: token.position,
      };
    }

    if (this.match('BOOLEAN')) {
      return {
        id: createNodeId('bool'),
        type: 'BooleanLiteral',
        value: token.value.toUpperCase() === 'TRUE',
        raw: token.value,
        position: token.position,
      };
    }

    if (this.match('RANGE')) {
      const parts = token.value.split(':');
      const startCell = parts[0];
      const endCell = parts[1];
      const expanded = expandRange(token.value);
      const node: RangeReferenceNode = {
        id: createNodeId('range'),
        type: 'RangeReference',
        range: token.value.toUpperCase(),
        startCell: startCell.toUpperCase(),
        endCell: endCell.toUpperCase(),
        cells: expanded,
        position: token.position,
      };
      return node;
    }

    if (this.match('CELL_REFERENCE')) {
      const cellToken = token;
      if (this.match('COLON')) {
        if (this.check('CELL_REFERENCE')) {
          const endToken = this.advance();
          const rangeStr = `${cellToken.value}:${endToken.value}`.toUpperCase();
          const expanded = expandRange(rangeStr);
          const rangeNode: RangeReferenceNode = {
            id: createNodeId('range'),
            type: 'RangeReference',
            range: rangeStr,
            startCell: cellToken.value.toUpperCase(),
            endCell: endToken.value.toUpperCase(),
            cells: expanded,
            position: {
              start: cellToken.position.start,
              end: endToken.position.end,
              line: cellToken.position.line,
              column: cellToken.position.column,
            },
          };
          return rangeNode;
        } else {
          this.addError(
            `Expected cell reference after ':' in range`,
            this.peek().position,
            'Complete the range reference, e.g. A1:B10'
          );
        }
      }

      const parsedAddr = parseCellAddress(cellToken.value);
      const cellNode: CellReferenceNode = {
        id: createNodeId('cell'),
        type: 'CellReference',
        cell: cellToken.value.toUpperCase(),
        col: parsedAddr ? parsedAddr.col : '',
        row: parsedAddr ? parsedAddr.row : 0,
        position: cellToken.position,
      };
      return cellNode;
    }

    if (this.check('IDENTIFIER')) {
      const fnToken = this.advance();
      if (this.match('LPAREN')) {
        const args: ASTNode[] = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
        }

        if (!this.match('RPAREN')) {
          this.addError(
            `Missing closing parenthesis ')' for function '${fnToken.value}'`,
            this.peek().position,
            `Add ')' to close the argument list for ${fnToken.value}`
          );
        }

        const endPos = this.previous() ? this.previous().position.end : fnToken.position.end;
        const fnNode: FunctionCallNode = {
          id: createNodeId('fn'),
          type: 'FunctionCall',
          name: fnToken.value.toUpperCase(),
          args,
          position: {
            start: fnToken.position.start,
            end: endPos,
            line: fnToken.position.line,
            column: fnToken.position.column,
          },
        };
        return fnNode;
      } else {
        this.addError(
          `Unexpected identifier '${fnToken.value}'. Did you mean to call function '${fnToken.value}()'?`,
          fnToken.position,
          `Add '(' and ')' if calling a function, or check cell reference spelling`
        );
        throw new Error(`Unexpected identifier ${fnToken.value}`);
      }
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      if (!this.match('RPAREN')) {
        this.addError(
          `Missing closing parenthesis ')'`,
          this.peek().position,
          `Check that every opening '(' has a matching closing ')'`
        );
      }
      return expr;
    }

    const unexpected = this.peek();
    this.addError(
      `Unexpected token '${unexpected.value || unexpected.type}'`,
      unexpected.position,
      `Expected a number, cell reference, function name, or '('`
    );
    throw new Error(`Unexpected token '${unexpected.value}'`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || {
      type: 'EOF',
      value: '',
      position: { start: 0, end: 0, line: 1, column: 1 },
    };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private addError(message: string, position: SourcePosition, suggestion?: string): void {
    this.diagnostics.push({
      phase: 'parser',
      severity: 'error',
      message,
      position,
      suggestion,
    });
  }
}
