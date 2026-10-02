import type {
  CompilerPipelineResult,
  Diagnostic,
} from '../types/compiler';
import type { SheetGrid } from '../types/spreadsheet';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './semanticAnalyzer';
import { extractDependenciesFromAST } from './ast';
import { IRGenerator } from './irGenerator';
import { Optimizer } from './optimizer';
import { Evaluator } from './evaluator';

export class CompilerEngine {
  public static compileFormula(
    formula: string,
    targetCell: string,
    grid?: SheetGrid
  ): CompilerPipelineResult {
    const cleanFormula = formula.trim();
    const allDiagnostics: Diagnostic[] = [];

    const lexer = new Lexer(cleanFormula);
    const tokens = lexer.tokenize();
    allDiagnostics.push(...lexer.diagnostics);

    if (lexer.diagnostics.some((d) => d.severity === 'error')) {
      return {
        formula: cleanFormula,
        targetCell,
        isValid: false,
        tokens,
        ast: null,
        semanticDiagnostics: [],
        dependencies: [],
        ranges: [],
        ir: [],
        optimizedAst: null,
        optimizedIr: [],
        optimizationSteps: [],
        evaluationResult: '#ERROR! Lexer Error',
        diagnostics: allDiagnostics,
      };
    }

    const parser = new Parser(tokens);
    const ast = parser.parse();
    allDiagnostics.push(...parser.diagnostics);

    if (!ast || parser.diagnostics.some((d) => d.severity === 'error')) {
      return {
        formula: cleanFormula,
        targetCell,
        isValid: false,
        tokens,
        ast: null,
        semanticDiagnostics: [],
        dependencies: [],
        ranges: [],
        ir: [],
        optimizedAst: null,
        optimizedIr: [],
        optimizationSteps: [],
        evaluationResult: '#ERROR! Syntax Error',
        diagnostics: allDiagnostics,
      };
    }

    const semanticAnalyzer = new SemanticAnalyzer(targetCell, grid);
    const semanticDiagnostics = semanticAnalyzer.analyze(ast);
    allDiagnostics.push(...semanticDiagnostics);

    const hasSemanticError = semanticDiagnostics.some((d) => d.severity === 'error');

    const { cells: dependencies, ranges } = extractDependenciesFromAST(ast);

    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);

    const optimizer = new Optimizer();
    const { optimizedAst, steps: optimizationSteps } = optimizer.optimize(ast);

    const optIrGen = new IRGenerator();
    const optimizedIr = optIrGen.generate(optimizedAst);

    let evaluationResult: any = null;
    if (!hasSemanticError) {
      try {
        const evaluator = new Evaluator(grid || {});
        evaluationResult = evaluator.evaluate(optimizedAst);
      } catch (err: any) {
        evaluationResult = err.message || '#ERROR!';
        allDiagnostics.push({
          phase: 'evaluator',
          severity: 'error',
          message: `Evaluation failed: ${evaluationResult}`,
          cell: targetCell,
        });
      }
    } else {
      evaluationResult = '#VALUE!';
    }

    const isValid = !allDiagnostics.some((d) => d.severity === 'error');

    return {
      formula: cleanFormula,
      targetCell,
      isValid,
      tokens,
      ast,
      semanticDiagnostics,
      dependencies,
      ranges,
      ir,
      optimizedAst,
      optimizedIr,
      optimizationSteps,
      evaluationResult,
      diagnostics: allDiagnostics,
    };
  }
}
