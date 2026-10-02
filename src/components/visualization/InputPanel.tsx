import React from 'react';
import type { CompilerPipelineResult } from '../../types/compiler';
import type { CellData } from '../../types/spreadsheet';
import { FileCode, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';

interface InputPanelProps {
  targetCell: string;
  cellData: CellData | null;
  result: CompilerPipelineResult | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  targetCell,
  cellData,
  result,
}) => {
  const formula = result?.formula || cellData?.raw || '';
  const isFormula = formula.startsWith('=');

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <FileCode className="w-5 h-5" />
          <h3 className="text-base font-bold text-text-primary">Phase 01: Formula Source Input</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The starting point of the spreadsheet compiler pipeline. The user enters raw characters which are tagged with source positions and fed to lexical analysis.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold uppercase tracking-wider">Raw Input String</span>
          <span className="font-mono text-cyan-light font-bold">Cell {targetCell}</span>
        </div>

        <div className="p-3.5 rounded-lg bg-bg-dark border border-border/80 font-mono text-sm sm:text-base text-cyan-light flex items-center justify-between">
          <span className="truncate">{formula || '<Empty>'}</span>
          <span className="text-xs text-text-muted font-sans font-normal ml-3 shrink-0">
            {formula.length} character{formula.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <div className="text-[10px] text-text-muted uppercase font-medium">Input Type</div>
            <div className="text-xs font-semibold text-text-primary mt-0.5">
              {isFormula ? 'Formula Expression' : 'Literal Constant'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <div className="text-[10px] text-text-muted uppercase font-medium">Target Address</div>
            <div className="text-xs font-mono font-semibold text-primary-light mt-0.5">
              {targetCell}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <div className="text-[10px] text-text-muted uppercase font-medium">Leading Token</div>
            <div className="text-xs font-mono font-semibold text-text-primary mt-0.5">
              {isFormula ? "'=' (Assign / Eval)" : 'None'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <div className="text-[10px] text-text-muted uppercase font-medium">Compiler Status</div>
            <div className="text-xs font-semibold flex items-center mt-0.5">
              {result?.isValid ? (
                <span className="text-success flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Ready
                </span>
              ) : (
                <span className="text-danger flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Errors Present
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {formula && (
        <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-secondary-light" />
              Character Source Map (1D Stream)
            </span>
            <span className="text-[11px] text-text-muted font-mono">0-indexed offset</span>
          </div>

          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center space-x-1 min-w-max py-1">
              {formula.split('').map((char, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-1.5 min-w-[28px] rounded bg-bg-elevated border border-border/80 hover:border-cyan hover:bg-cyan/10 transition-colors"
                >
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {char === ' ' ? '␣' : char}
                  </span>
                  <span className="font-mono text-[9px] text-text-muted mt-1">
                    {index}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border text-xs text-text-secondary leading-relaxed space-y-2">
        <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider">
          How FormulaFlow Processes this Formula:
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-text-muted pl-1">
          <li>The lexer scans the raw characters above into structured tokens with precise location spans.</li>
          <li>The recursive descent parser enforces operator precedence and produces a typed AST.</li>
          <li>Semantic validation ensures referenced functions, cells, and ranges are valid.</li>
          <li>The dependency engine analyzes references for cycles and determines evaluation order.</li>
          <li>3-Address intermediate code is generated and passed to the constant folding optimizer.</li>
          <li>The evaluator computes the final cell result and triggers downstream recalculations.</li>
        </ol>
      </div>
    </div>
  );
};
