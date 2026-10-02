import type { Token, TokenType, SourcePosition, Diagnostic } from '../types/compiler';

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  public diagnostics: Diagnostic[] = [];

  constructor(source: string) {
    this.source = source.trim();
  }

  public tokenize(): Token[] {
    this.tokens = [];
    this.diagnostics = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    if (this.source.startsWith('=')) {
      this.tokens.push({
        type: 'EQUALS',
        value: '=',
        position: this.createPosition(0, 1, 1),
      });
      this.advance();
    }

    while (this.pos < this.source.length) {
      const char = this.currentChar();

      if (this.isWhitespace(char)) {
        this.advance();
        continue;
      }

      const startPos = this.pos;
      const startCol = this.column;

      if (this.isDigit(char) || (char === '.' && this.isDigit(this.peekNextChar()))) {
        this.tokenizeNumber();
        continue;
      }

      if (char === '"') {
        this.tokenizeString();
        continue;
      }

      if (char === '>') {
        this.advance();
        if (this.currentChar() === '=') {
          this.advance();
          this.addToken('GTE', '>=', startPos, startCol);
        } else {
          this.addToken('GT', '>', startPos, startCol);
        }
        continue;
      }

      if (char === '<') {
        this.advance();
        if (this.currentChar() === '=') {
          this.advance();
          this.addToken('LTE', '<=', startPos, startCol);
        } else if (this.currentChar() === '>') {
          this.advance();
          this.addToken('NEQ', '<>', startPos, startCol);
        } else {
          this.addToken('LT', '<', startPos, startCol);
        }
        continue;
      }

      if (char === '!' && this.peekNextChar() === '=') {
        this.advance();
        this.advance();
        this.addToken('NEQ', '!=', startPos, startCol);
        continue;
      }

      if (char === '=') {
        this.advance();
        this.addToken('EQ', '=', startPos, startCol);
        continue;
      }

      if (char === '+') {
        this.advance();
        this.addToken('PLUS', '+', startPos, startCol);
        continue;
      }

      if (char === '-') {
        this.advance();
        this.addToken('MINUS', '-', startPos, startCol);
        continue;
      }

      if (char === '*') {
        this.advance();
        this.addToken('MULTIPLY', '*', startPos, startCol);
        continue;
      }

      if (char === '/') {
        this.advance();
        this.addToken('DIVIDE', '/', startPos, startCol);
        continue;
      }

      if (char === '%') {
        this.advance();
        this.addToken('MODULO', '%', startPos, startCol);
        continue;
      }

      if (char === '(') {
        this.advance();
        this.addToken('LPAREN', '(', startPos, startCol);
        continue;
      }

      if (char === ')') {
        this.advance();
        this.addToken('RPAREN', ')', startPos, startCol);
        continue;
      }

      if (char === ',') {
        this.advance();
        this.addToken('COMMA', ',', startPos, startCol);
        continue;
      }

      if (char === ':') {
        this.advance();
        this.addToken('COLON', ':', startPos, startCol);
        continue;
      }

      if (this.isAlpha(char) || char === '_') {
        this.tokenizeIdentifierOrCell();
        continue;
      }

      this.advance();
      this.diagnostics.push({
        phase: 'lexer',
        severity: 'error',
        message: `Unexpected character '${char}'`,
        position: this.createPosition(startPos, this.pos, startCol),
        suggestion: 'Remove or replace this unrecognized character',
      });
      this.addToken('ERROR', char, startPos, startCol);
    }

    this.tokens.push({
      type: 'EOF',
      value: '',
      position: this.createPosition(this.pos, this.pos, this.column),
    });

    return this.tokens;
  }

  private currentChar(): string {
    return this.source[this.pos] || '';
  }

  private peekNextChar(): string {
    return this.source[this.pos + 1] || '';
  }

  private advance(): void {
    if (this.currentChar() === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char) || char === '_';
  }

  private createPosition(start: number, end: number, startCol: number): SourcePosition {
    return {
      start,
      end,
      line: this.line,
      column: startCol,
    };
  }

  private addToken(type: TokenType, value: string, startPos: number, startCol: number): void {
    this.tokens.push({
      type,
      value,
      position: this.createPosition(startPos, this.pos, startCol),
    });
  }

  private tokenizeNumber(): void {
    const startPos = this.pos;
    const startCol = this.column;
    let numStr = '';
    let hasDot = false;

    while (this.pos < this.source.length) {
      const char = this.currentChar();
      if (this.isDigit(char)) {
        numStr += char;
        this.advance();
      } else if (char === '.' && !hasDot) {
        hasDot = true;
        numStr += char;
        this.advance();
      } else {
        break;
      }
    }

    this.addToken('NUMBER', numStr, startPos, startCol);
  }

  private tokenizeString(): void {
    const startPos = this.pos;
    const startCol = this.column;
    this.advance();
    let strVal = '';

    while (this.pos < this.source.length && this.currentChar() !== '"') {
      if (this.currentChar() === '\\' && this.peekNextChar() === '"') {
        strVal += '"';
        this.advance();
        this.advance();
      } else {
        strVal += this.currentChar();
        this.advance();
      }
    }

    if (this.currentChar() === '"') {
      this.advance();
      this.addToken('STRING', strVal, startPos, startCol);
    } else {
      this.diagnostics.push({
        phase: 'lexer',
        severity: 'error',
        message: 'Unterminated string literal',
        position: this.createPosition(startPos, this.pos, startCol),
        suggestion: 'Add closing double quotation mark (")',
      });
      this.addToken('ERROR', strVal, startPos, startCol);
    }
  }

  private tokenizeIdentifierOrCell(): void {
    const startPos = this.pos;
    const startCol = this.column;
    let text = '';

    while (this.pos < this.source.length && this.isAlphaNumeric(this.currentChar())) {
      text += this.currentChar();
      this.advance();
    }

    const upper = text.toUpperCase();

    if (upper === 'TRUE' || upper === 'FALSE') {
      this.addToken('BOOLEAN', upper, startPos, startCol);
      return;
    }

    if (this.currentChar() === ':') {
      const colonPos = this.pos;
      const remaining = this.source.slice(colonPos + 1);
      const secondPartMatch = remaining.match(/^([A-Za-z]+[1-9][0-9]*)/);
      if (/^[A-Za-z]+[1-9][0-9]*$/.test(text) && secondPartMatch) {
        this.advance();
        const secondCell = secondPartMatch[1];
        for (let i = 0; i < secondCell.length; i++) {
          this.advance();
        }
        const fullRange = `${upper}:${secondCell.toUpperCase()}`;
        this.addToken('RANGE', fullRange, startPos, startCol);
        return;
      }
    }

    if (/^[A-Za-z]+[1-9][0-9]*$/.test(text)) {
      this.addToken('CELL_REFERENCE', upper, startPos, startCol);
      return;
    }

    this.addToken('IDENTIFIER', upper, startPos, startCol);
  }
}
