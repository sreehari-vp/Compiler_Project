import React from 'react';
import type { CompilerPipelineResult } from '../../types/compiler';
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Check,
  X,
} from 'lucide-react';

interface SemanticPanelProps {
  result: CompilerPipelineResult | null;
  targetCell: string;
}

export const SemanticPanel: React.FC<SemanticPanelProps> = ({
  result,
  targetCell,
}) => {
  const diagnostics = result?.semanticDiagnostics || [];
  const errors = diagnostics.filter((d) => d.severity === 'error');

  const isSemanticallyValid = errors.length === 0;

  const checkItems = [
    {
      title: 'Function Existence & Signatures',
      description: 'All called function identifiers match built-in library (SUM, AVG, MIN, MAX, COUNT, IF, AND, OR, NOT).',
      passed: !errors.some((e) => e.message.includes('Unknown function')),
    },
    {
      title: 'Argument Arity Validation',
      description: 'Arguments count matches minimum and maximum limits for each function.',
      passed: !errors.some((e) => e.message.includes('argument(s)')),
    },
    {
      title: 'Self-Reference Immunity',
      description: `Formula does not directly reference its own target cell address (${targetCell}).`,
      passed: !errors.some((e) => e.message.includes('self-reference') || e.message.includes('Self-reference')),
    },
    {
      title: 'Static Type Compatibility',
      description: 'Arithmetic operators (+, -, *, /, %) are not applied to incompatible text strings.',
      passed: !errors.some((e) => e.message.includes('Type Error') || e.message.includes('Incompatible')),
    },
    {
      title: 'Division by Zero Guard',
      description: 'Expressions do not contain static division or modulo by literal zero.',
      passed: !errors.some((e) => e.message.includes('Division by zero')),
    },
    {
      title: 'Range Boundary Consistency',
      description: 'Cell ranges have valid alphanumeric start and end coordinates.',
      passed: !errors.some((e) => e.message.includes('Invalid range')),
    },
  ];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-base font-bold text-text-primary">Phase 05: Semantic Analysis</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Validates expression meaning beyond syntactic grammar. Checks function signatures, arities, static type compatibility, and self-referencing bounds.
        </p>
      </div>

      <div
        className={`p-4 rounded-xl border shadow-card flex items-center justify-between ${
          isSemanticallyValid
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isSemanticallyValid ? (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          ) : (
            <AlertOctagon className="w-6 h-6 text-danger shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold text-text-primary">
              {isSemanticallyValid
                ? 'Formula is Semantically Valid ✓'
                : 'Semantic Violations Detected ✕'}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {isSemanticallyValid
                ? 'All functions, types, and references passed semantic verification.'
                : `${errors.length} fatal error(s) prevent evaluation.`}
            </div>
          </div>
        </div>

        <div className="font-mono text-xs px-2.5 py-1 rounded bg-bg-surface border border-border text-text-primary font-semibold">
          {isSemanticallyValid ? 'Verdict: PASSED' : 'Verdict: REJECTED'}
        </div>
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Semantic Diagnostics
          </div>
          <div className="space-y-2">
            {diagnostics.map((diag, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  diag.severity === 'error'
                    ? 'bg-danger/10 border-danger/30 text-danger-light'
                    : diag.severity === 'warning'
                    ? 'bg-warning/10 border-warning/30 text-warning-light'
                    : 'bg-cyan/10 border-cyan/30 text-cyan-light'
                }`}
              >
                <div className="flex items-center justify-between font-bold font-mono text-[11px] uppercase">
                  <span>{diag.severity}</span>
                  {diag.position && <span>offset {diag.position.start}</span>}
                </div>
                <div className="font-sans text-xs text-text-primary">
                  {diag.message}
                </div>
                {diag.suggestion && (
                  <div className="text-[11px] font-mono text-text-secondary">
                    Recommendation: {diag.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 text-xs font-bold uppercase tracking-wider text-text-secondary">
          Compiler Semantic Verification Checklist
        </div>

        <div className="p-3 divide-y divide-border/60">
          {checkItems.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-start space-x-3">
              <div
                className={`p-1 rounded-full shrink-0 mt-0.5 ${
                  item.passed
                    ? 'bg-success/20 text-success'
                    : 'bg-danger/20 text-danger'
                }`}
              >
                {item.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
              <div>
                <div className={`text-xs font-semibold ${item.passed ? 'text-text-primary' : 'text-danger-light'}`}>
                  {item.title}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
