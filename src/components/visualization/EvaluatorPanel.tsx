import React from 'react';
import type { CompilerPipelineResult, RecalculationImpact } from '../../types/compiler';
import type { SheetGrid } from '../../types/spreadsheet';
import {
  Calculator,
  RotateCw,
  Zap,
} from 'lucide-react';
import { formatCellValue } from '../../utils/cellUtils';

interface EvaluatorPanelProps {
  result: CompilerPipelineResult | null;
  selectedCell: string;
  grid: SheetGrid;
  lastImpact: RecalculationImpact | null;
}

export const EvaluatorPanel: React.FC<EvaluatorPanelProps> = ({
  result,
  selectedCell,
  grid,
  lastImpact,
}) => {
  const evalResult = result?.evaluationResult;
  const isError = String(evalResult).startsWith('#');
  const referencedCells = result?.dependencies || [];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-text-primary">Phase 09: Evaluator & Recalculation</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The runtime engine evaluates the optimized AST against current cell values and propagates incremental changes topologically through dependent cells.
        </p>
      </div>

      <div className="p-5 rounded-xl bg-bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold uppercase tracking-wider">Computed Cell Result</span>
          <span className="font-mono text-cyan-light font-bold">Cell {selectedCell}</span>
        </div>

        <div className="p-4 rounded-xl bg-bg-dark border border-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-text-muted font-mono">Expression: {result?.formula}</div>
            <div
              className={`text-2xl sm:text-3xl font-mono font-bold ${
                isError ? 'text-danger' : 'text-cyan-light'
              }`}
            >
              {evalResult !== undefined ? formatCellValue(evalResult) : '—'}
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded font-semibold border ${
                isError
                  ? 'bg-danger/20 border-danger/40 text-danger-light'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {typeof evalResult === 'number'
                ? 'Type: float64 / number'
                : typeof evalResult === 'boolean'
                ? 'Type: boolean'
                : typeof evalResult === 'string'
                ? 'Type: string'
                : 'Type: empty'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Evaluation Runtime Environment (Referenced Cells)
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {referencedCells.length} Bound Symbols
          </span>
        </div>

        <div className="p-3">
          {referencedCells.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
              {referencedCells.map((cellId) => {
                const cell = grid[cellId];
                return (
                  <div
                    key={cellId}
                    className="p-2.5 rounded-lg bg-bg-elevated/60 border border-border flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-primary-light">{cellId}</span>
                      <span className="text-[10px] text-text-muted ml-1.5 font-sans">
                        ({cell?.isFormula ? 'formula' : cell?.valueType || 'empty'})
                      </span>
                    </div>
                    <span className="font-bold text-cyan-light">
                      {cell ? formatCellValue(cell.computedValue) : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-text-muted italic">
              Formula is constant or does not reference any external cells.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center">
            <RotateCw className="w-3.5 h-3.5 mr-1.5 text-cyan-light" />
            Incremental Recalculation Impact Analysis
          </div>
          <span className="text-[11px] font-mono text-cyan-light">
            Targeted Dependency Propagation
          </span>
        </div>

        <div className="p-4 space-y-4">
          {lastImpact ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
                  <div className="text-[10px] text-text-muted uppercase">Changed Cell</div>
                  <div className="text-sm font-bold text-primary-light mt-0.5">
                    {lastImpact.changedCell}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
                  <div className="text-[10px] text-text-muted uppercase">Recalculated Cells</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {lastImpact.recalculatedCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
                  <div className="text-[10px] text-text-muted uppercase">Skipped Cells</div>
                  <div className="text-sm font-bold text-text-secondary mt-0.5">
                    {lastImpact.skippedCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
                  <div className="text-[10px] text-text-muted uppercase">Recalc Latency</div>
                  <div className="text-sm font-bold text-cyan-light mt-0.5">
                    {lastImpact.executionTimeMs} ms
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Topological Recalculation Order:
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-primary/20 text-primary-light border border-primary/40 font-bold">
                    {lastImpact.changedCell} (Trigger)
                  </span>
                  {lastImpact.order.map((affId) => (
                    <React.Fragment key={affId}>
                      <span className="text-text-muted">→</span>
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        {affId}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-bg-elevated/40 border border-border text-center text-xs text-text-muted space-y-1">
              <Zap className="w-5 h-5 mx-auto text-cyan-light mb-1" />
              <div className="font-semibold text-text-primary">
                Awaiting Cell Mutation
              </div>
              <p className="text-[11px] max-w-sm mx-auto">
                Edit any cell value in the grid (e.g. change marks in B2 from 80 to 90) to see incremental recalculation selectively update affected cells while skipping independent ones.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
