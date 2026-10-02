// Compiler Core Types for FormulaFlow

export type TokenType =
  | 'EQUALS'             // Leading '='
  | 'NUMBER'             // 123, 45.67
  | 'STRING'             // "hello"
  | 'BOOLEAN'            // TRUE, FALSE
  | 'CELL_REFERENCE'     // A1, B12, AA100
  | 'RANGE'              // A1:B10
  | 'IDENTIFIER'         // Function name or variable
  | 'PLUS'               // +
  | 'MINUS'              // -
  | 'MULTIPLY'           // *
  | 'DIVIDE'             // /
  | 'MODULO'             // %
  | 'EQ'                 // = (in comparison context)
  | 'NEQ'                // != or <>
  | 'LT'                 // <
  | 'LTE'                // <=
  | 'GT'                 // >
  | 'GTE'                // >=
  | 'LPAREN'             // (
  | 'RPAREN'             // )
  | 'COMMA'              // ,
  | 'COLON'              // :
  | 'EOF'                // End of token stream
  | 'ERROR';             // Invalid lexical token

export interface SourcePosition {
  start: number;
  end: number;
  line: number;
  column: number;
}

export interface Token {
  type: TokenType;
  value: string;
  position: SourcePosition;
}

// AST Nodes
export type ASTNodeType =
  | 'NumberLiteral'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'CellReference'
  | 'RangeReference'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'FunctionCall';

export interface BaseASTNode {
  id: string;
  type: ASTNodeType;
  position: SourcePosition;
}

export interface NumberLiteralNode extends BaseASTNode {
  type: 'NumberLiteral';
  value: number;
  raw: string;
}

export interface StringLiteralNode extends BaseASTNode {
  type: 'StringLiteral';
  value: string;
  raw: string;
}

export interface BooleanLiteralNode extends BaseASTNode {
  type: 'BooleanLiteral';
  value: boolean;
  raw: string;
}

export interface CellReferenceNode extends BaseASTNode {
  type: 'CellReference';
  cell: string;       // e.g. "B2"
  col: string;        // "B"
  row: number;        // 2
}

export interface RangeReferenceNode extends BaseASTNode {
  type: 'RangeReference';
  range: string;      // e.g. "A1:A10"
  startCell: string;  // "A1"
  endCell: string;    // "A10"
  cells: string[];    // Expanded list of cells in range: ["A1", "A2", ...]
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '=' | '!=' | '<' | '<=' | '>' | '>=';

export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: ASTNode;
  right: ASTNode;
}

export type UnaryOperator = '+' | '-';

export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  operand: ASTNode;
}

export interface FunctionCallNode extends BaseASTNode {
  type: 'FunctionCall';
  name: string;        // Uppercase, e.g. "SUM", "IF"
  args: ASTNode[];
}

export type ASTNode =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | CellReferenceNode
  | RangeReferenceNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | FunctionCallNode;

// Compiler Diagnostics
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  phase: 'lexer' | 'parser' | 'semantic' | 'dependency' | 'optimizer' | 'evaluator';
  severity: DiagnosticSeverity;
  message: string;
  position?: SourcePosition;
  cell?: string;
  suggestion?: string;
}

// Intermediate Representation (3-Address Code / Quadruples)
export type IROp =
  | 'CONST'       // dest = CONST val
  | 'LOAD'        // dest = LOAD cell
  | 'LOAD_RANGE'  // dest = LOAD_RANGE [cells...]
  | 'ADD'         // dest = ADD src1, src2
  | 'SUB'         // dest = SUB src1, src2
  | 'MUL'         // dest = MUL src1, src2
  | 'DIV'         // dest = DIV src1, src2
  | 'MOD'         // dest = MOD src1, src2
  | 'NEG'         // dest = NEG src1
  | 'EQ'          // dest = EQ src1, src2
  | 'NEQ'         // dest = NEQ src1, src2
  | 'LT'          // dest = LT src1, src2
  | 'LTE'         // dest = LTE src1, src2
  | 'GT'          // dest = GT src1, src2
  | 'GTE'         // dest = GTE src1, src2
  | 'CALL'        // dest = CALL func, [arg1, arg2...]
  | 'IF_THEN_ELSE'// dest = IF cond, trueSrc, falseSrc
  | 'RETURN';     // RETURN src

export interface IRInstruction {
  index: number;
  op: IROp;
  dest?: string;
  args: (string | number | boolean)[];
  text: string;
  comment?: string;
}

// Optimization Step
export interface OptimizationStep {
  rule: string;
  description: string;
  beforeSnippet: string;
  afterSnippet: string;
  location?: SourcePosition;
}

// Dependency Analysis
export interface DependencyNode {
  cellId: string;
  dependencies: string[];    // cells this cell depends on
  dependents: string[];      // cells that depend on this cell
  hasFormula: boolean;
  value: any;
  error?: string;
}

export interface DependencyAnalysisResult {
  graph: Record<string, DependencyNode>;
  cycles: string[][];         // e.g. [["A1", "B1", "A1"]]
  evaluationOrder: string[];  // Topological sort of formula cells
  hasCircular: boolean;
}

// Recalculation Impact
export interface RecalculationImpact {
  changedCell: string;
  affectedCells: string[];
  recalculatedCount: number;
  skippedCount: number;
  executionTimeMs: number;
  order: string[];
}

// Compiler Phase identifiers
export type CompilerPhaseId =
  | 'input'
  | 'lexer'
  | 'parser'
  | 'ast'
  | 'semantic'
  | 'dependencies'
  | 'ir'
  | 'optimizer'
  | 'evaluator';

export interface CompilerPipelineResult {
  formula: string;
  targetCell: string;
  isValid: boolean;
  tokens: Token[];
  ast: ASTNode | null;
  semanticDiagnostics: Diagnostic[];
  dependencies: string[];
  ranges: string[];
  ir: IRInstruction[];
  optimizedAst: ASTNode | null;
  optimizedIr: IRInstruction[];
  optimizationSteps: OptimizationStep[];
  evaluationResult: any;
  diagnostics: Diagnostic[];
}
