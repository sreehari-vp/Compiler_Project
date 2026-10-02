import React, { useState } from 'react';
import type { CompilerPipelineResult, TokenType } from '../../types/compiler';
import { Binary } from 'lucide-react';

interface LexerPanelProps {
  result: CompilerPipelineResult | null;
}

export const LexerPanel: React.FC<LexerPanelProps> = ({ result }) => {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

  if (!result || result.tokens.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        <Binary className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
        <p>No tokens available. Select or enter a formula to see lexical analysis.</p>
      </div>
    );
  }

  const tokens = result.tokens;

  const getTokenBadgeClass = (type: TokenType): string => {
    switch (type) {
      case 'CELL_REFERENCE':
        return 'bg-cyan/15 text-cyan-light border-cyan/30';
      case 'RANGE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'NUMBER':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'STRING':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      case 'BOOLEAN':
        return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      case 'IDENTIFIER':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'PLUS':
      case 'MINUS':
      case 'MULTIPLY':
      case 'DIVIDE':
      case 'MODULO':
      case 'EQ':
      case 'NEQ':
      case 'LT':
      case 'LTE':
      case 'GT':
      case 'GTE':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'LPAREN':
      case 'RPAREN':
      case 'COMMA':
      case 'COLON':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
      case 'EQUALS':
        return 'bg-primary/20 text-primary-light border-primary/40';
      case 'EOF':
        return 'bg-bg-elevated text-text-muted border-border';
      default:
        return 'bg-danger/20 text-danger-light border-danger/40';
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-cyan">
          <Binary className="w-5 h-5" />
          <h3 className="text-base font-bold text-text-primary">Phase 02: Lexical Analysis (Tokenizer)</h3>
        </div>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The lexer breaks the input string into a stream of discrete semantic tokens with precise start/end character coordinates.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold uppercase tracking-wider">Token Sequence Preview</span>
          <span className="font-mono text-cyan-light font-bold">{tokens.length} Tokens</span>
        </div>

        <div className="p-3 rounded-lg bg-bg-dark border border-border flex flex-wrap gap-1.5 min-h-[50px] items-center">
          {tokens.map((tok, idx) => {
            const isSelected = selectedTokenIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedTokenIdx(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all ${getTokenBadgeClass(
                  tok.type
                )} ${isSelected ? 'ring-2 ring-primary scale-105 shadow-soft-glow' : 'hover:scale-102'}`}
              >
                <span className="font-bold">{tok.value || tok.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-bg-surface border border-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-border bg-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Structured Token Stream Table
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Line:Col & Character Offsets
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-bg-surface border-b border-border text-[11px] font-mono uppercase text-text-muted z-10">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Token Type</th>
                <th className="py-2.5 px-3">Lexeme Value</th>
                <th className="py-2.5 px-3">Span (Start-End)</th>
                <th className="py-2.5 px-3">Line : Col</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {tokens.map((token, index) => {
                const isSelected = selectedTokenIdx === index;
                return (
                  <tr
                    key={index}
                    onClick={() => setSelectedTokenIdx(index)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 text-white font-semibold'
                        : 'hover:bg-bg-elevated/60 text-text-primary'
                    }`}
                  >
                    <td className="py-2 px-3 text-text-muted text-[11px]">{index + 1}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTokenBadgeClass(
                          token.type
                        )}`}
                      >
                        {token.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-light font-bold">
                      {token.value === '' ? '<EOF>' : token.value}
                    </td>
                    <td className="py-2 px-3 text-text-muted text-[11px]">
                      [{token.position.start} - {token.position.end}]
                    </td>
                    <td className="py-2 px-3 text-text-muted text-[11px]">
                      L{token.position.line}:{token.position.column}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
