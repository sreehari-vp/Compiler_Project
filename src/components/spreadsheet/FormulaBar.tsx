import React, { useRef } from 'react';
import {
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { CellData } from '../../types/spreadsheet';

interface FormulaBarProps {
  selectedCellId: string;
  selectedCellData: CellData | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onCommit: (cellId: string, value: string) => void;
  onCompile: () => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  selectedCellId,
  selectedCellData,
  editValue,
  onEditValueChange,
  onCommit,
  onCompile,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(selectedCellId, editValue);
      onCompile();
    } else if (e.key === 'Escape') {
      onEditValueChange(selectedCellData?.raw || '');
      inputRef.current?.blur();
    }
  };

  const isFormula = editValue.trim().startsWith('=');
  const hasError = selectedCellData?.valueType === 'error' || (selectedCellData?.compilerResult && !selectedCellData.compilerResult.isValid);

  return (
    <div className="h-11 bg-bg-secondary border-b border-border px-4 flex items-center space-x-3 select-none">
      {/* Name Box */}
      <div className="flex items-center space-x-2">
        <div className="bg-bg-elevated text-text-primary px-3 py-1 rounded border border-border font-mono text-xs font-semibold w-16 text-center shadow-inner">
          {selectedCellId || '—'}
        </div>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Function / Formula Glyph */}
      <div className="flex items-center text-text-muted hover:text-cyan transition-colors" title="Formula prefix (=)">
        <span className="font-mono font-bold text-sm text-cyan select-none italic px-1">
          fx
        </span>
      </div>

      {/* Formula Input */}
      <div className="flex-1 relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommit(selectedCellId, editValue)}
          placeholder="Enter a value or formula starting with = (e.g. =B2+C2 or =IF(B2>50, B2*2, C2))"
          className="w-full bg-bg-surface text-text-primary font-mono text-xs sm:text-sm px-3 py-1.5 rounded border border-border focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all placeholder:text-text-muted/60"
        />

        {/* Status Indicator Icon inside input */}
        <div className="absolute right-2.5 flex items-center space-x-1.5 pointer-events-none">
          {isFormula && !hasError && (
            <span className="flex items-center text-[11px] font-mono font-medium text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded">
              <Check className="w-3 h-3 mr-1" />
              Valid
            </span>
          )}
          {isFormula && hasError && (
            <span className="flex items-center text-[11px] font-mono font-medium text-danger bg-danger/10 border border-danger/30 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Error
            </span>
          )}
          {!isFormula && editValue.trim() !== '' && (
            <span className="text-[10px] font-mono text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded border border-border">
              {isNaN(Number(editValue)) ? 'text' : 'number'}
            </span>
          )}
        </div>
      </div>

      {/* Explicit Compile Button */}
      <button
        onClick={() => {
          onCommit(selectedCellId, editValue);
          onCompile();
        }}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-bg-elevated hover:bg-primary/20 text-text-primary hover:text-primary-light border border-border hover:border-primary/50 flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
        title="Compile formula and re-analyze (Enter)"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary-light" />
        <span className="hidden sm:inline">Compile</span>
      </button>
    </div>
  );
};
