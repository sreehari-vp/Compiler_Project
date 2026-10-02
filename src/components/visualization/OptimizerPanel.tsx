import React from 'react';
import type { CompilerPipelineResult } from '../../types/compiler';
import { Zap, ArrowDown, CheckCircle2, Sparkles, Scale } from 'lucide-react';
import { printASTExpression } from '../../compiler/ast';

interface OptimizerPanelProps {
  result: CompilerPipelineResult | null;
}

export const OptimizerPanel: React.FC<OptimizerPanelProps> = ({ result }) => {
  const steps = result?.optimizationSteps || [];
  const originalAst = result?.ast;
  const optimizedAst = result?.optimizedAst;

  const originalStr = originalAst ? printASTExpression(originalAst) : '';
  const optimizedStr = optimizedAst ? printASTExpression(optimizedAst) : '';

  const hasOptimizations = steps.length > 0;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-text-primary">Phase 08: Compiler Optimization</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Safe semantics-preserving AST rewrite transformations including constant folding, algebraic identity reduction, and dead branch elimination.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold uppercase tracking-wider">Original Expression</span>
            <span className="font-mono text-[11px] text-text-muted">Pre-Optimization</span>
          </div>
          <div className="p-3 rounded-lg bg-bg-dark border border-border font-mono text-sm text-text-primary truncate">
            {originalStr || result?.formula || '—'}
          </div>
          <div className="text-[11px] text-text-muted font-mono flex items-center justify-between pt-1">
            <span>IR Instructions:</span>
            <span className="text-text-primary font-bold">{result?.ir.length || 0} ops</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-semibold uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Optimized Output
            </span>
            <span className="font-mono text-[11px] text-emerald-400">Canonical Form</span>
          </div>
          <div className="p-3 rounded-lg bg-bg-dark border border-emerald-500/40 font-mono text-sm text-emerald-300 font-bold truncate">
            {optimizedStr || '—'}
          </div>
          <div className="text-[11px] text-text-muted font-mono flex items-center justify-between pt-1">
            <span>Optimized IR:</span>
            <span className="text-emerald-400 font-bold">{result?.optimizedIr.length || 0} ops</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center">
            <Scale className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Applied Optimization Passes ({steps.length})
          </div>
          <span className="text-[11px] font-mono text-cyan-light">Fixed-Point Loop</span>
        </div>

        <div className="p-4">
          {hasOptimizations ? (
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-bg-elevated/60 border border-border hover:border-emerald-500/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 font-mono flex items-center">
                      <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] mr-1.5 font-bold">
                        {idx + 1}
                      </span>
                      {step.rule}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono uppercase bg-bg-surface px-2 py-0.5 rounded border border-border">
                      AST Rewrite
                    </span>
                  </div>

                  <p className="text-xs text-text-primary font-sans leading-relaxed">
                    {step.description}
                  </p>

                  <div className="flex items-center space-x-2 font-mono text-xs pt-1">
                    <div className="px-2 py-1 rounded bg-bg-dark border border-border text-text-muted line-through">
                      {step.beforeSnippet}
                    </div>
                    <ArrowDown className="w-3.5 h-3.5 text-text-muted transform -rotate-90 shrink-0" />
                    <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                      {step.afterSnippet}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-text-muted space-y-1">
              <CheckCircle2 className="w-7 h-7 mx-auto text-cyan-light mb-1.5" />
              <div className="font-semibold text-text-primary text-xs">
                No safe optimization opportunities found.
              </div>
              <p className="text-[11px] max-w-md mx-auto">
                Expression is already in minimal canonical form without redundant identity constants or foldable static terms.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border text-xs text-text-secondary space-y-2.5">
        <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider">
          Active Optimization Strategies in FormulaFlow:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-text-muted">
          <div>• <span className="text-cyan-light">Constant Folding:</span> 10*5 → 50</div>
          <div>• <span className="text-cyan-light">Additive Identity:</span> X + 0 → X</div>
          <div>• <span className="text-cyan-light">Multiplicative Identity:</span> X * 1 → X</div>
          <div>• <span className="text-cyan-light">Multiplicative Annihilation:</span> X * 0 → 0</div>
          <div>• <span className="text-cyan-light">Self-Subtraction:</span> X - X → 0</div>
          <div>• <span className="text-cyan-light">Double Negation:</span> -(-X) → X</div>
        </div>
      </div>
    </div>
  );
};
