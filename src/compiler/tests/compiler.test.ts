import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { SemanticAnalyzer } from '../semanticAnalyzer';
import { DependencyAnalyzer } from '../dependencyAnalyzer';
import { Optimizer } from '../optimizer';
import { Evaluator } from '../evaluator';
import { CompilerEngine } from '../engine';
import type { SheetGrid } from '../../types/spreadsheet';
import { SAMPLE_SHEETS } from '../../data/sampleSheets';

describe('Lexer', () => {
  it('tokenizes simple binary expression =A1+B1', () => {
    const lexer = new Lexer('=A1+B1');
    const tokens = lexer.tokenize();
    expect(tokens.map((t) => t.type)).toEqual(['EQUALS', 'CELL_REFERENCE', 'PLUS', 'CELL_REFERENCE', 'EOF']);
    expect(tokens[1].value).toBe('A1');
    expect(tokens[3].value).toBe('B1');
  });

  it('tokenizes function with range =SUM(A1:A5)', () => {
    const lexer = new Lexer('=SUM(A1:A5)');
    const tokens = lexer.tokenize();
    expect(tokens.map((t) => t.type)).toEqual(['EQUALS', 'IDENTIFIER', 'LPAREN', 'RANGE', 'RPAREN', 'EOF']);
    expect(tokens[1].value).toBe('SUM');
    expect(tokens[3].value).toBe('A1:A5');
  });

  it('tokenizes nested IF formula =IF(B2>50,B2*2,C2)', () => {
    const lexer = new Lexer('=IF(B2>50,B2*2,C2)');
    const tokens = lexer.tokenize();
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      'EQUALS',
      'IDENTIFIER',
      'LPAREN',
      'CELL_REFERENCE',
      'GT',
      'NUMBER',
      'COMMA',
      'CELL_REFERENCE',
      'MULTIPLY',
      'NUMBER',
      'COMMA',
      'CELL_REFERENCE',
      'RPAREN',
      'EOF',
    ]);
  });
});

describe('Parser & Precedence', () => {
  it('respects multiplication over addition precedence: A1 + B1 * C1', () => {
    const lexer = new Lexer('=A1+B1*C1');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    expect(ast).not.toBeNull();
    expect(ast?.type).toBe('BinaryExpression');
    if (ast?.type === 'BinaryExpression') {
      expect(ast.operator).toBe('+');
      expect(ast.left.type).toBe('CellReference');
      expect(ast.right.type).toBe('BinaryExpression');
      if (ast.right.type === 'BinaryExpression') {
        expect(ast.right.operator).toBe('*');
      }
    }
  });

  it('respects parentheses overriding precedence: (A1 + B1) * C1', () => {
    const lexer = new Lexer('=(A1+B1)*C1');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    expect(ast).not.toBeNull();
    if (ast?.type === 'BinaryExpression') {
      expect(ast.operator).toBe('*');
      expect(ast.left.type).toBe('BinaryExpression');
      if (ast.left.type === 'BinaryExpression') {
        expect(ast.left.operator).toBe('+');
      }
    }
  });

  it('parses function calls with multiple arguments and ranges', () => {
    const lexer = new Lexer('=SUM(A1:A5, B1*2)');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    expect(ast?.type).toBe('FunctionCall');
    if (ast?.type === 'FunctionCall') {
      expect(ast.name).toBe('SUM');
      expect(ast.args.length).toBe(2);
      expect(ast.args[0].type).toBe('RangeReference');
      expect(ast.args[1].type).toBe('BinaryExpression');
    }
  });

  it('reports informative syntax error for missing parenthesis', () => {
    const lexer = new Lexer('=SUM(A1, B1');
    const parser = new Parser(lexer.tokenize());
    parser.parse();
    expect(parser.diagnostics.length).toBeGreaterThan(0);
    expect(parser.diagnostics[0].message).toContain('Missing closing parenthesis');
  });
});

describe('Semantic Analyzer', () => {
  it('detects unknown functions', () => {
    const lexer = new Lexer('=UNKNOWN(A1)');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const analyzer = new SemanticAnalyzer('B1');
    const diagnostics = analyzer.analyze(ast);
    expect(diagnostics.some((d) => d.message.includes("Unknown function 'UNKNOWN'"))).toBe(true);
  });

  it('detects wrong argument count for IF', () => {
    const lexer = new Lexer('=IF(A1)');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const analyzer = new SemanticAnalyzer('B1');
    const diagnostics = analyzer.analyze(ast);
    expect(diagnostics.some((d) => d.message.includes("expects at least 2 argument(s)"))).toBe(true);
  });

  it('detects direct self-reference', () => {
    const lexer = new Lexer('=B2+10');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const analyzer = new SemanticAnalyzer('B2');
    const diagnostics = analyzer.analyze(ast);
    expect(diagnostics.some((d) => d.message.includes('Direct self-reference'))).toBe(true);
  });

  it('detects type error with arithmetic on strings', () => {
    const lexer = new Lexer('="hello" * 5');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const analyzer = new SemanticAnalyzer('A1');
    const diagnostics = analyzer.analyze(ast);
    expect(diagnostics.some((d) => d.message.includes('Incompatible operation'))).toBe(true);
  });
});

describe('Dependency Analyzer & Circular Detection', () => {
  it('tracks multi-level dependency chain D2 -> E2 -> F2', () => {
    const mockGrid: SheetGrid = {
      B2: { id: 'B2', raw: '80', computedValue: 80, valueType: 'number', isFormula: false },
      C2: { id: 'C2', raw: '10', computedValue: 10, valueType: 'number', isFormula: false },
      D2: {
        id: 'D2',
        raw: '=B2*2',
        formula: '=B2*2',
        computedValue: 160,
        valueType: 'number',
        isFormula: true,
        compilerResult: CompilerEngine.compileFormula('=B2*2', 'D2'),
      },
      E2: {
        id: 'E2',
        raw: '=D2+C2',
        formula: '=D2+C2',
        computedValue: 170,
        valueType: 'number',
        isFormula: true,
        compilerResult: CompilerEngine.compileFormula('=D2+C2', 'E2'),
      },
      F2: {
        id: 'F2',
        raw: '=E2+10',
        formula: '=E2+10',
        computedValue: 180,
        valueType: 'number',
        isFormula: true,
        compilerResult: CompilerEngine.compileFormula('=E2+10', 'F2'),
      },
    };

    const analyzer = new DependencyAnalyzer(mockGrid);
    const result = analyzer.analyze();
    expect(result.hasCircular).toBe(false);
    expect(result.graph['D2'].dependencies).toContain('B2');
    expect(result.graph['E2'].dependencies).toEqual(expect.arrayContaining(['D2', 'C2']));
    expect(result.graph['F2'].dependencies).toContain('E2');

    const impact = analyzer.computeRecalculationImpact('B2');
    expect(impact.affectedCells).toEqual(expect.arrayContaining(['D2', 'E2', 'F2']));
    expect(impact.recalculatedCount).toBe(3);
  });

  it('calculates correct affected cells for test spreadsheet students_grades', () => {
    const grid: SheetGrid = {
      B2: { id: 'B2', raw: '80', computedValue: 80, valueType: 'number', isFormula: false },
      C2: { id: 'C2', raw: '10', computedValue: 10, valueType: 'number', isFormula: false },
      D2: { id: 'D2', raw: '=B2+C2', isFormula: true, computedValue: 90, valueType: 'number', compilerResult: CompilerEngine.compileFormula('=B2+C2', 'D2') },
      E2: { id: 'E2', raw: '=IF(D2>=75,"Distinction","Pass")', isFormula: true, computedValue: 'Distinction', valueType: 'string', compilerResult: CompilerEngine.compileFormula('=IF(D2>=75,"Distinction","Pass")', 'E2') },
      B3: { id: 'B3', raw: '45', computedValue: 45, valueType: 'number', isFormula: false },
      C3: { id: 'C3', raw: '5', computedValue: 5, valueType: 'number', isFormula: false },
      D3: { id: 'D3', raw: '=B3+C3', isFormula: true, computedValue: 50, valueType: 'number', compilerResult: CompilerEngine.compileFormula('=B3+C3', 'D3') },
      E3: { id: 'E3', raw: '=IF(D3>=75,"Distinction","Pass")', isFormula: true, computedValue: 'Pass', valueType: 'string', compilerResult: CompilerEngine.compileFormula('=IF(D3>=75,"Distinction","Pass")', 'E3') },
      B7: { id: 'B7', raw: '=AVG(D2:D5)', isFormula: true, computedValue: 78.5, valueType: 'number', compilerResult: CompilerEngine.compileFormula('=AVG(D2:D5)', 'B7') },
      B8: { id: 'B8', raw: '=MAX(D2:D5)', isFormula: true, computedValue: 100, valueType: 'number', compilerResult: CompilerEngine.compileFormula('=MAX(D2:D5)', 'B8') },
      B9: { id: 'B9', raw: '=COUNT(B2:B5)', isFormula: true, computedValue: 4, valueType: 'number', compilerResult: CompilerEngine.compileFormula('=COUNT(B2:B5)', 'B9') },
    };

    const analyzer = new DependencyAnalyzer(grid);
    const impact = analyzer.computeRecalculationImpact('B2');
    expect(impact.affectedCells).not.toContain('E3');
    expect(impact.affectedCells).not.toContain('D3');
    expect(impact.affectedCells).toEqual(expect.arrayContaining(['D2', 'E2', 'B7', 'B8', 'B9']));
  });

  it('calculates correct affected cells for complete SAMPLE_SHEETS[0] even with uncompiled formulas', () => {
    const preset = SAMPLE_SHEETS[0];
    const analyzer = new DependencyAnalyzer(preset.cells);
    const impact = analyzer.computeRecalculationImpact('B2');
    expect(impact.affectedCells).not.toContain('E3');
    expect(impact.affectedCells).not.toContain('D3');
    expect(impact.affectedCells).toEqual(expect.arrayContaining(['D2', 'E2', 'B7', 'B8', 'B9']));
  });

  it('detects circular dependency A1 -> B1 -> A1', () => {
    const mockGrid: SheetGrid = {
      A1: {
        id: 'A1',
        raw: '=B1+10',
        formula: '=B1+10',
        computedValue: 0,
        valueType: 'number',
        isFormula: true,
        compilerResult: CompilerEngine.compileFormula('=B1+10', 'A1'),
      },
      B1: {
        id: 'B1',
        raw: '=A1+5',
        formula: '=A1+5',
        computedValue: 0,
        valueType: 'number',
        isFormula: true,
        compilerResult: CompilerEngine.compileFormula('=A1+5', 'B1'),
      },
    };

    const analyzer = new DependencyAnalyzer(mockGrid);
    const result = analyzer.analyze();
    expect(result.hasCircular).toBe(true);
    expect(result.cycles.length).toBeGreaterThan(0);
  });
});

describe('Optimizer', () => {
  it('folds constants: 10 * 5 + A1 => 50 + A1', () => {
    const lexer = new Lexer('=10*5+A1');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const optimizer = new Optimizer();
    const { optimizedAst, steps } = optimizer.optimize(ast);

    expect(steps.some((s) => s.rule === 'Constant Folding')).toBe(true);
    if (optimizedAst.type === 'BinaryExpression') {
      expect(optimizedAst.left.type).toBe('NumberLiteral');
      if (optimizedAst.left.type === 'NumberLiteral') {
        expect(optimizedAst.left.value).toBe(50);
      }
    }
  });

  it('simplifies algebraic identities: A1 + 0 => A1', () => {
    const lexer = new Lexer('=A1+0');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse()!;
    const optimizer = new Optimizer();
    const { optimizedAst, steps } = optimizer.optimize(ast);

    expect(optimizedAst.type).toBe('CellReference');
    expect(steps.some((s) => s.rule === 'Algebraic Simplification')).toBe(true);
  });

  it('simplifies multiplication identities: A1 * 1 => A1, A1 * 0 => 0', () => {
    const lexer1 = new Lexer('=A1*1');
    const parser1 = new Parser(lexer1.tokenize());
    const ast1 = parser1.parse()!;
    const opt1 = new Optimizer().optimize(ast1);
    expect(opt1.optimizedAst.type).toBe('CellReference');

    const lexer2 = new Lexer('=A1*0');
    const parser2 = new Parser(lexer2.tokenize());
    const ast2 = parser2.parse()!;
    const opt2 = new Optimizer().optimize(ast2);
    expect(opt2.optimizedAst.type).toBe('NumberLiteral');
    if (opt2.optimizedAst.type === 'NumberLiteral') {
      expect(opt2.optimizedAst.value).toBe(0);
    }
  });
});

describe('Evaluator', () => {
  const env: Record<string, any> = {
    A1: 10,
    A2: 20,
    A3: 30,
    B1: 5,
    B2: 80,
    C2: 10,
  };

  const lookup = (cellId: string) => env[cellId.toUpperCase()] ?? 0;

  it('evaluates arithmetic and comparisons correctly', () => {
    const evaluator = new Evaluator(lookup);
    const ast1 = new Parser(new Lexer('=A1*B1+5').tokenize()).parse()!;
    expect(evaluator.evaluate(ast1)).toBe(55);

    const ast2 = new Parser(new Lexer('=B2>50').tokenize()).parse()!;
    expect(evaluator.evaluate(ast2)).toBe(true);
  });

  it('evaluates built-in functions SUM, AVG, MIN, MAX, COUNT', () => {
    const evaluator = new Evaluator(lookup);

    const sumAst = new Parser(new Lexer('=SUM(A1:A3)').tokenize()).parse()!;
    expect(evaluator.evaluate(sumAst)).toBe(60);

    const avgAst = new Parser(new Lexer('=AVG(A1:A3)').tokenize()).parse()!;
    expect(evaluator.evaluate(avgAst)).toBe(20);

    const minAst = new Parser(new Lexer('=MIN(A1:A3)').tokenize()).parse()!;
    expect(evaluator.evaluate(minAst)).toBe(10);

    const maxAst = new Parser(new Lexer('=MAX(A1:A3)').tokenize()).parse()!;
    expect(evaluator.evaluate(maxAst)).toBe(30);

    const countAst = new Parser(new Lexer('=COUNT(A1:A3)').tokenize()).parse()!;
    expect(evaluator.evaluate(countAst)).toBe(3);
  });

  it('evaluates IF conditional branches', () => {
    const evaluator = new Evaluator(lookup);
    const ifAst = new Parser(new Lexer('=IF(B2>50, B2*2, C2)').tokenize()).parse()!;
    expect(evaluator.evaluate(ifAst)).toBe(160);

    const ifFalseAst = new Parser(new Lexer('=IF(B1>50, B2*2, C2)').tokenize()).parse()!;
    expect(evaluator.evaluate(ifFalseAst)).toBe(10);
  });

  it('evaluates logical AND, OR, NOT', () => {
    const evaluator = new Evaluator(lookup);
    const andAst = new Parser(new Lexer('=IF(AND(B2>50, C2=10), 100, 0)').tokenize()).parse()!;
    expect(evaluator.evaluate(andAst)).toBe(100);

    const orAst = new Parser(new Lexer('=OR(B1>50, C2=10)').tokenize()).parse()!;
    expect(evaluator.evaluate(orAst)).toBe(true);

    const notAst = new Parser(new Lexer('=NOT(B1=5)').tokenize()).parse()!;
    expect(evaluator.evaluate(notAst)).toBe(false);
  });
});
