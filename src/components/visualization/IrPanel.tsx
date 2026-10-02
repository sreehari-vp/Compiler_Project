import React, { useState } from 'react';
import type { CompilerPipelineResult } from '../../types/compiler';
import { Cpu, Copy, Check, Terminal } from 'lucide-react';

interface IrPanelProps {
  result: CompilerPipelineResult | null;
}

export const IrPanel: React.FC<IrPanelProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const irList = result?.ir || [];

  const handleCopy = () => {
    if (!irList.length) return;
    const text = irList
      .map((inst) => `${inst.text.padEnd(28)} ; ${inst.comment || ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOpColor = (op: string) => {
    switch (op) {
      case 'CONST':
        return 'text-emerald-400';
      case 'LOAD':
      case 'LOAD_RANGE':
        return 'text-cyan-light';
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
      case 'MOD':
        return 'text-purple-400';
      case 'EQ':
      case 'NEQ':
      case 'LT':
      case 'LTE':
      case 'GT':
      case 'GTE':
        return 'text-amber-400';
      case 'CALL':
      case 'IF_THEN_ELSE':
        return 'text-indigo-400 font-bold';
      case 'RETURN':
        return 'text-danger-light font-bold';
      default:
        return 'text-primary-light';
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan">
            <Cpu className="w-5 h-5" />
            <h3 className="text-base font-bold text-text-primary">
              Phase 07: Intermediate Representation (IR)
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            FormulaFlow emits linear 3-Address Code (3AC) with infinite virtual registers (t1, t2, ...), bridging the high-level AST and the evaluator.
          </p>
        </div>

        <button
          onClick={handleCopy}
          disabled={irList.length === 0}
          className="px-3 py-1.5 text-xs font-mono rounded bg-bg-elevated hover:bg-border/60 text-text-primary border border-border flex items-center space-x-1.5 transition-colors disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy IR</span>
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl bg-bg-dark border border-border shadow-card overflow-hidden">
        <div className="px-4 py-2.5 bg-bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
            </div>
            <span className="text-[11px] font-mono text-text-muted ml-2">
              ir_quadruples.ff
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-light font-bold">
            {irList.length} Instructions
          </span>
        </div>

        <div className="p-4 font-mono text-xs overflow-x-auto custom-scrollbar space-y-1">
          {irList.length > 0 ? (
            irList.map((inst) => (
              <div
                key={inst.index}
                className="flex items-center hover:bg-bg-elevated/40 px-2 py-1 rounded transition-colors group"
              >
                <span className="w-8 text-right text-text-muted/60 select-none mr-4 text-[11px]">
                  {inst.index}
                </span>

                <div className="flex-1 flex items-center justify-between">
                  <div className="space-x-1.5">
                    {inst.dest && (
                      <>
                        <span className="text-primary-light font-semibold">{inst.dest}</span>
                        <span className="text-text-muted">=</span>
                      </>
                    )}
                    <span className={getOpColor(inst.op)}>{inst.op}</span>
                    <span className="text-text-primary">{inst.args.join(', ')}</span>
                  </div>

                  {inst.comment && (
                    <span className="text-text-muted/70 text-[11px] italic pl-6 select-none hidden sm:inline">
                      ; {inst.comment}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-text-muted italic">
              No IR generated. Check formula syntax.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center">
          <Terminal className="w-3.5 h-3.5 mr-1.5 text-primary-light" />
          FormulaFlow IR Opcode Architecture
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <span className="text-cyan-light font-bold">LOAD & LOAD_RANGE</span>
            <p className="text-[11px] text-text-muted font-sans mt-0.5">
              Reads cell or expands range into virtual register.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <span className="text-emerald-400 font-bold">CONST</span>
            <p className="text-[11px] text-text-muted font-sans mt-0.5">
              Materializes an immediate numeric, string or boolean literal.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-bg-elevated border border-border">
            <span className="text-indigo-400 font-bold">CALL & IF</span>
            <p className="text-[11px] text-text-muted font-sans mt-0.5">
              Dispatches built-in library functions and branch selection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
