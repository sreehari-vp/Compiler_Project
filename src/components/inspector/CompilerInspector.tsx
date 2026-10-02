import React from 'react';
import type {
  CompilerPipelineResult,
  CompilerPhaseId,
  DependencyAnalysisResult,
} from '../../types/compiler';
import type { CellData, SheetGrid } from '../../types/spreadsheet';
import { countASTNodes, getASTDepth } from '../../compiler/ast';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Database,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { formatCellValue } from '../../utils/cellUtils';

interface CompilerInspectorProps {
  selectedCell: string;
  cellData: CellData | null;
  result: CompilerPipelineResult | null;
  grid: SheetGrid;
  dependencyAnalysis: DependencyAnalysisResult;
  onNavigatePhase: (phase: CompilerPhaseId) => void;
  onSelectCell: (cellId: string) => void;
}

export const CompilerInspector: React.FC<CompilerInspectorProps> = ({
  selectedCell,
  cellData,
  result,
  grid,
  dependencyAnalysis,
  onNavigatePhase,
  onSelectCell,
}) => {
  const isFormula = cellData?.isFormula || cellData?.raw?.startsWith('=');
  const tokenCount = result ? result.tokens.length : 0;
  const astNodeCount = result?.ast ? countASTNodes(result.ast) : 0;
  const astDepth = result?.ast ? getASTDepth(result.ast) : 0;
  const depCount = result ? result.dependencies.length : 0;
  const irCount = result ? result.ir.length : 0;
  const optCount = result ? result.optimizationSteps.length : 0;
  const isValid = result ? result.isValid : true;

  const referencedDeps = result ? result.dependencies : [];
  const dependents = dependencyAnalysis.graph[selectedCell]?.dependents || [];

  return (
    <aside className="w-80 bg-bg-surface border-l border-border flex flex-col h-full select-none shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-3.5 border-b border-border/80 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Inspector & Symbol Table
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Cell diagnostics & metadata
          </p>
        </div>
        <div className="font-mono text-xs px-2 py-0.5 rounded bg-bg-elevated border border-border text-cyan-light font-bold">
          {selectedCell}
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        <div className="p-3 rounded-lg bg-bg-elevated/70 border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted font-medium">Cell Type</span>
            <span className="font-mono px-2 py-0.5 rounded bg-bg-surface border border-border text-[11px] text-primary-light font-semibold">
              {isFormula ? 'Formula Expression' : cellData?.valueType || 'Empty'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted font-medium">Raw Value</span>
            <span className="font-mono text-xs text-text-primary truncate max-w-[170px]" title={cellData?.raw}>
              {cellData?.raw || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
            <span className="text-text-muted font-medium">Evaluated Output</span>
            <span className="font-mono text-sm font-bold text-cyan-light truncate max-w-[170px]">
              {formatCellValue(cellData?.computedValue) || '—'}
            </span>
          </div>
        </div>

        {isFormula && result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1.5 text-primary-light" />
                Compiler Metrics
              </span>
              {isValid ? (
                <span className="flex items-center text-[11px] font-mono text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded font-semibold">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valid
                </span>
              ) : (
                <span className="flex items-center text-[11px] font-mono text-danger bg-danger/15 border border-danger/30 px-2 py-0.5 rounded font-semibold">
                  <AlertOctagon className="w-3 h-3 mr-1" />
                  Failed
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigatePhase('lexer')}
                className="p-2 rounded bg-bg-elevated/50 hover:bg-bg-elevated border border-border/80 hover:border-cyan/40 text-left transition-all group"
              >
                <div className="text-[10px] text-text-muted group-hover:text-cyan transition-colors">
                  Tokens
                </div>
                <div className="text-base font-mono font-bold text-text-primary">
                  {tokenCount}
                </div>
              </button>

              <button
                onClick={() => onNavigatePhase('ast')}
                className="p-2 rounded bg-bg-elevated/50 hover:bg-bg-elevated border border-border/80 hover:border-indigo-400/40 text-left transition-all group"
              >
                <div className="text-[10px] text-text-muted group-hover:text-indigo-400 transition-colors">
                  AST Nodes (d={astDepth})
                </div>
                <div className="text-base font-mono font-bold text-text-primary">
                  {astNodeCount}
                </div>
              </button>

              <button
                onClick={() => onNavigatePhase('dependencies')}
                className="p-2 rounded bg-bg-elevated/50 hover:bg-bg-elevated border border-border/80 hover:border-amber-400/40 text-left transition-all group"
              >
                <div className="text-[10px] text-text-muted group-hover:text-amber-400 transition-colors">
                  Dependencies
                </div>
                <div className="text-base font-mono font-bold text-text-primary">
                  {depCount}
                </div>
              </button>

              <button
                onClick={() => onNavigatePhase('ir')}
                className="p-2 rounded bg-bg-elevated/50 hover:bg-bg-elevated border border-border/80 hover:border-purple-400/40 text-left transition-all group"
              >
                <div className="text-[10px] text-text-muted group-hover:text-purple-400 transition-colors">
                  IR Instructions
                </div>
                <div className="text-base font-mono font-bold text-text-primary">
                  {irCount}
                </div>
              </button>

              <button
                onClick={() => onNavigatePhase('optimizer')}
                className="col-span-2 p-2 rounded bg-bg-elevated/50 hover:bg-bg-elevated border border-border/80 hover:border-emerald-400/40 flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="text-[10px] text-text-muted group-hover:text-emerald-400 transition-colors">
                    Applied Optimizations
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {optCount > 0 ? `${optCount} Transformation(s)` : 'None (Already Optimal)'}
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        )}

        {result && result.diagnostics.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-warning" />
              Diagnostics ({result.diagnostics.length})
            </span>

            <div className="space-y-1.5">
              {result.diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    diag.severity === 'error'
                      ? 'bg-danger/10 border-danger/30 text-danger-light'
                      : diag.severity === 'warning'
                      ? 'bg-warning/10 border-warning/30 text-warning-light'
                      : 'bg-cyan/10 border-cyan/30 text-cyan-light'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold font-mono text-[11px] uppercase">
                    <span>{diag.phase} {diag.severity}</span>
                    {diag.position && (
                      <span>pos {diag.position.start}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-primary font-sans leading-relaxed">
                    {diag.message}
                  </p>
                  {diag.suggestion && (
                    <p className="text-[11px] text-text-secondary font-mono italic">
                      Tip: {diag.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center">
            <Database className="w-3.5 h-3.5 mr-1.5 text-cyan" />
            Symbol Table Entries
          </span>

          {referencedDeps.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/60 text-xs">
              {referencedDeps.map((depCell) => {
                const depData = grid[depCell];
                return (
                  <div
                    key={depCell}
                    onClick={() => onSelectCell(depCell)}
                    className="p-2 bg-bg-elevated/40 hover:bg-bg-elevated flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-primary-light">
                        {depCell}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        {depData?.isFormula ? 'formula' : depData?.valueType || 'empty'}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-cyan-light font-medium">
                      {depData ? formatCellValue(depData.computedValue) : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-bg-elevated/30 border border-border/60 text-center text-xs text-text-muted italic">
              No input cell references
            </div>
          )}

          <div className="pt-2">
            <div className="text-[11px] text-text-muted font-medium mb-1">
              Downstream Dependents ({dependents.length}):
            </div>
            {dependents.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {dependents.map((depId) => (
                  <button
                    key={depId}
                    onClick={() => onSelectCell(depId)}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-bg-elevated hover:bg-primary/20 text-text-primary hover:text-primary-light border border-border hover:border-primary/50 transition-colors"
                  >
                    {depId}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-text-muted italic">
                No cells depend on {selectedCell}
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
