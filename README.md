# FormulaFlow — Spreadsheet Formula Compiler and Analyzer

**FormulaFlow** is a mini spreadsheet formula compiler, optimizer, and analyzer built from scratch in TypeScript, React, and Tailwind CSS. It visually demonstrates how spreadsheet formulas pass through every compiler phase from raw input to evaluated cell output.

---

## 🏗️ Compiler Architecture & Pipeline

```text
Formula Input
      ↓
Lexical Analysis (Tokenizer)
      ↓
Syntax Parsing (Recursive Descent)
      ↓
Abstract Syntax Tree (AST Generation)
      ↓
Semantic Analysis (Signatures, Arity, Types, Self-References)
      ↓
Dependency Analysis (DAG Construction & Cycle Detection)
      ↓
Intermediate Representation (3-Address Code / Quadruples)
      ↓
Optimization (Constant Folding & Algebraic Reduction)
      ↓
Evaluation (Runtime Execution & Incremental Recalculation)
      ↓
Cell Result
```

---

## 📐 Formal Formula Grammar

```text
Formula      := [ '=' ] Expression EOF
Expression   := Comparison
Comparison   := Additive ( ('=' | '!=' | '<>' | '<' | '<=' | '>' | '>=') Additive )*
Additive     := Multiplicative ( ('+' | '-') Multiplicative )*
Multiplicative := Unary ( ('*' | '/' | '%') Unary )*
Unary        := ('+' | '-') Unary | Primary
Primary      := NumberLiteral
              | StringLiteral
              | BooleanLiteral
              | RangeReference
              | CellReference
              | FunctionCall
              | '(' Expression ')'
FunctionCall := IDENTIFIER '(' [ Expression (',' Expression)* ] ')'
```

### Precedence Hierarchy:
1. **Primary & Function Calls**: Literals, Parentheses `(...)`, Functions `SUM(...)`, Ranges `A1:B10`, References `B2`
2. **Unary Operators**: `+`, `-`
3. **Multiplicative Operators**: `*`, `/`, `%`
4. **Additive Operators**: `+`, `-`
5. **Comparison Operators**: `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=`

---

## 🚀 Key Features

1. **Custom Hand-Written Lexer**:
   - Tokenizes numbers, quoted strings, booleans, cell coordinates (`B2`, `AA100`), ranges (`A1:A10`), functions, and operators with exact character and line/col coordinates.

2. **Hand-Written Recursive Descent Parser**:
   - Produces structured Abstract Syntax Trees without any third-party formula parsing libraries.
   - Informative educational error diagnostics with character pointer carats.

3. **Interactive AST Visualizer (React Flow)**:
   - Dynamic hierarchical graph layout with category-colored nodes: Functions, Operators, Cell References, Ranges, and Literals.
   - Zoom, pan, minimap, and node inspection.

4. **Comprehensive Semantic Analyzer**:
   - Validates function existence (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`, `IF`, `AND`, `OR`, `NOT`).
   - Validates argument count / arity constraints.
   - Detects direct and range self-references (e.g. `=B2*2` inside `B2`).
   - Catches incompatible operations (e.g. `"hello" * 5`) and division by zero literals.

5. **Directed Dependency Graph & Cycle Detection**:
   - Computes topological evaluation order.
   - Detects circular dependencies (e.g. `A1 → B1 → A1`) via cycle detection algorithms and protects against infinite recursion.

6. **Compiler-Grade Intermediate Representation (IR)**:
   - Linear 3-Address Code with infinite virtual registers ($t_1, t_2, \dots$), load operations, call operations, and comments.

7. **Multi-Pass Optimizer**:
   - **Constant Folding**: e.g. `10 * 5 + A1` $\to$ `50 + A1`
   - **Algebraic Identities**:
     - Additive identity: $X + 0 \to X$
     - Multiplicative identity: $X \times 1 \to X$
     - Multiplicative annihilation: $X \times 0 \to 0$
     - Division identity: $X / 1 \to X$
     - Self-subtraction: $X - X \to 0$
     - Double negation: $-(-X) \to X$
     - Dead branch elimination: `IF(TRUE, X, Y)` $\to$ `X`

8. **Incremental Recalculation Engine**:
   - When a cell value changes, selectively evaluates only affected downstream cells while skipping independent cells.
   - Tracks execution latency and topological order.

9. **Live In-Browser Test Suite**:
   - 20 automated unit tests executing directly in the browser and CLI via Vitest.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Deep Navy `#0B1020` & Indigo `#6366F1` developer palette)
- **Visualization**: React Flow (`@xyflow/react`)
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage
- **Testing**: Vitest

---

## 📦 Getting Started

### Development Server:
```bash
npm run dev
```

### Run Compiler Unit Tests:
```bash
npx vitest run
```

### Production Build:
```bash
npm run build
```
