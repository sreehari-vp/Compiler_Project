import React from 'react';
import type { CompilerPipelineResult } from '../../types/compiler';
import { GitCommit, AlertOctagon, CheckCircle2, BookOpen } from 'lucide-react';

interface ParserPanelProps {
  result: CompilerPipelineResult | null;
}

export const ParserPanel: React.FC<ParserPanelProps> = ({ result }) => {
  const parserErrors = result?.diagnostics.filter((d) => d.phase === 'parser' && d.severity === 'error') || [];
  const isParsed = result?.ast !== null && parserErrors.length === 0;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <GitCommit className="w-5 h-5" />
          <h3 className="text-base font-bold text-text-primary">Phase 03: Syntax Parsing & Grammar</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The recursive descent parser consumes the token stream according to context-free grammar rules, enforcing operator precedence and building the Abstract Syntax Tree.
        </p>
      </div>

      <div className={`p-4 rounded-xl border shadow-card flex items-center justify-between ${
        isParsed ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
      }`}>
        <div className="flex items-center space-x-3">
          {isParsed ? (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          ) : (
            <AlertOctagon className="w-6 h-6 text-danger shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold text-text-primary">
              {isParsed ? 'Parsing Succeeded: Valid Grammar' : 'Parsing Failed: Syntax Errors Detected'}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {isParsed
                ? 'All tokens conformed to the FormulaFlow spreadsheet expression grammar.'
                : 'The token stream violated grammar production rules.'}
            </div>
          </div>
        </div>

        <div className="font-mono text-xs px-2.5 py-1 rounded bg-bg-surface border border-border text-text-primary font-semibold">
          {isParsed ? 'Status: 200 OK' : 'Status: Syntax Error'}
        </div>
      </div>

      {parserErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/40 space-y-3">
          <div className="text-xs font-bold text-danger uppercase tracking-wider flex items-center">
            <AlertOctagon className="w-4 h-4 mr-1.5" />
            Syntax Diagnostics ({parserErrors.length})
          </div>

          <div className="space-y-2">
            {parserErrors.map((err, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-bg-surface border border-danger/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-danger font-mono">{err.message}</span>
                  {err.position && (
                    <span className="text-text-muted font-mono text-[11px]">
                      Line {err.position.line}, Col {err.position.column}
                    </span>
                  )}
                </div>

                {result?.formula && err.position && (
                  <div className="font-mono text-xs bg-bg-dark p-2.5 rounded border border-border space-y-0.5 mt-2">
                    <div className="text-text-primary">{result.formula}</div>
                    <div className="text-danger font-bold">
                      {' '.repeat(Math.max(0, err.position.start))}
                      {'^'.repeat(Math.max(1, err.position.end - err.position.start))}
                    </div>
                  </div>
                )}

                {err.suggestion && (
                  <div className="text-[11px] text-cyan-light font-mono pt-1">
                    Suggestion: {err.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary-light" />
            Grammar Production Rules & Precedence Hierarchy
          </div>
          <span className="text-[11px] font-mono text-cyan-light">Recursive Descent</span>
        </div>

        <div className="p-4 space-y-3 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-bg-dark border border-border space-y-1">
              <div className="text-primary-light font-bold">1. Expression (Comparison)</div>
              <div className="text-text-muted text-[11px]">
                Additive ( ('=' | '!=' | '&lt;' | '&lt;=' | '&gt;' | '&gt;=') Additive )*
              </div>
              <div className="text-[10px] text-text-secondary font-sans italic pt-1">
                Lowest binary precedence. Evaluates booleans.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-bg-dark border border-border space-y-1">
              <div className="text-secondary-light font-bold">2. Additive Level</div>
              <div className="text-text-muted text-[11px]">
                Multiplicative ( ('+' | '-') Multiplicative )*
              </div>
              <div className="text-[10px] text-text-secondary font-sans italic pt-1">
                Standard binary addition and subtraction.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-bg-dark border border-border space-y-1">
              <div className="text-cyan-light font-bold">3. Multiplicative Level</div>
              <div className="text-text-muted text-[11px]">
                Unary ( ('*' | '/' | '%') Unary )*
              </div>
              <div className="text-[10px] text-text-secondary font-sans italic pt-1">
                Multiplication, division, and modulo. Binds tighter than addition.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-bg-dark border border-border space-y-1">
              <div className="text-emerald-400 font-bold">4. Unary Level</div>
              <div className="text-text-muted text-[11px]">
                ('+' | '-') Unary | Primary
              </div>
              <div className="text-[10px] text-text-secondary font-sans italic pt-1">
                Prefix signs like -5 or -(A1+B1).
              </div>
            </div>

            <div className="p-3 rounded-lg bg-bg-dark border border-border space-y-1 md:col-span-2">
              <div className="text-amber-400 font-bold">5. Primary & Function Calls</div>
              <div className="text-text-muted text-[11px]">
                NUMBER | STRING | BOOLEAN | CELL_REF | RANGE | IDENTIFIER '(' Args ')' | '(' Expression ')'
              </div>
              <div className="text-[10px] text-text-secondary font-sans italic pt-1">
                Leaf atoms and parenthesized sub-expressions with highest precedence.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
