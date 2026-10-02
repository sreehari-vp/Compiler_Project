import React, { useState, useEffect, useRef } from 'react';
import type { SheetGrid, CellData } from '../../types/spreadsheet';
import { indexToColLetters, formatCellValue, parseCellAddress } from '../../utils/cellUtils';

interface SpreadsheetGridProps {
  rowCount: number;
  colCount: number;
  cells: SheetGrid;
  selectedCell: string;
  onSelectCell: (cellId: string) => void;
  onCommitCell: (cellId: string, value: string) => void;
  onClearCell: (cellId: string) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rowCount,
  colCount,
  cells,
  selectedCell,
  onSelectCell,
  onCommitCell,
  onClearCell,
}) => {
  const [inlineEditing, setInlineEditing] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inlineEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditing]);

  const handleCellClick = (cellId: string) => {
    if (inlineEditing && inlineEditing !== cellId) {
      onCommitCell(inlineEditing, inlineValue);
      setInlineEditing(null);
    }
    onSelectCell(cellId);
  };

  const handleCellDoubleClick = (cellId: string) => {
    const rawVal = cells[cellId]?.raw || '';
    setInlineEditing(cellId);
    setInlineValue(rawVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (inlineEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCommitCell(inlineEditing, inlineValue);
        setInlineEditing(null);
        moveSelection(0, 1);
      } else if (e.key === 'Escape') {
        setInlineEditing(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onCommitCell(inlineEditing, inlineValue);
        setInlineEditing(null);
        moveSelection(1, 0);
      }
      return;
    }

    const addr = parseCellAddress(selectedCell);
    if (!addr) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(0, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(0, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveSelection(-1, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveSelection(1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      moveSelection(e.shiftKey ? -1 : 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCellDoubleClick(selectedCell);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onClearCell(selectedCell);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setInlineEditing(selectedCell);
      setInlineValue(e.key);
    }
  };

  const moveSelection = (colDelta: number, rowDelta: number) => {
    const addr = parseCellAddress(selectedCell);
    if (!addr) return;

    const newColIndex = Math.max(0, Math.min(colCount - 1, addr.colIndex + colDelta));
    const newRowIndex = Math.max(0, Math.min(rowCount - 1, addr.rowIndex + rowDelta));
    const newCellId = `${indexToColLetters(newColIndex)}${newRowIndex + 1}`;
    onSelectCell(newCellId);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 overflow-auto bg-bg-dark outline-none select-none relative custom-scrollbar focus:ring-0"
    >
      <table className="border-collapse table-fixed w-full min-w-max text-xs">
        <thead>
          <tr className="sticky top-0 z-20 bg-bg-surface border-b border-border shadow-sm">
            <th className="w-10 sm:w-12 h-7 bg-bg-surface border-r border-border text-center text-text-muted font-mono font-medium text-[11px] sticky left-0 z-30">
              #
            </th>

            {Array.from({ length: colCount }).map((_, c) => {
              const colLabel = indexToColLetters(c);
              const isSelectedCol = parseCellAddress(selectedCell)?.col === colLabel;
              return (
                <th
                  key={colLabel}
                  className={`w-28 sm:w-32 h-7 border-r border-border text-center font-mono font-medium text-[11px] transition-colors ${
                    isSelectedCol
                      ? 'bg-primary/20 text-primary-light font-bold'
                      : 'text-text-secondary hover:bg-bg-elevated/80'
                  }`}
                >
                  {colLabel}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowCount }).map((_, r) => {
            const rowNumber = r + 1;
            const isSelectedRow = parseCellAddress(selectedCell)?.row === rowNumber;

            return (
              <tr key={rowNumber} className="border-b border-border/70 hover:bg-bg-surface/30">
                <td
                  className={`h-7 border-r border-border text-center font-mono font-medium text-[11px] sticky left-0 z-10 transition-colors ${
                    isSelectedRow
                      ? 'bg-primary/20 text-primary-light font-bold'
                      : 'bg-bg-surface text-text-muted'
                  }`}
                >
                  {rowNumber}
                </td>

                {Array.from({ length: colCount }).map((_, c) => {
                  const colLabel = indexToColLetters(c);
                  const cellId = `${colLabel}${rowNumber}`;
                  const cellData: CellData | undefined = cells[cellId];
                  const isSelected = selectedCell === cellId;
                  const isEditingThis = inlineEditing === cellId;

                  const isFormula = cellData?.isFormula || cellData?.raw?.startsWith('=');
                  const isError = cellData?.valueType === 'error' || String(cellData?.computedValue).startsWith('#');
                  const isNumber = typeof cellData?.computedValue === 'number';

                  return (
                    <td
                      key={cellId}
                      onClick={() => handleCellClick(cellId)}
                      onDoubleClick={() => handleCellDoubleClick(cellId)}
                      className={`h-7 px-2 border-r border-border/80 relative truncate font-sans text-xs transition-colors cursor-cell ${
                        isSelected
                          ? 'ring-2 ring-primary ring-inset bg-primary/10 z-10'
                          : isFormula
                          ? 'bg-bg-surface/40 hover:bg-bg-surface/70'
                          : 'bg-bg-dark hover:bg-bg-surface/20'
                      }`}
                    >
                      {isEditingThis ? (
                        <input
                          ref={inlineInputRef}
                          type="text"
                          value={inlineValue}
                          onChange={(e) => setInlineValue(e.target.value)}
                          onBlur={() => {
                            onCommitCell(cellId, inlineValue);
                            setInlineEditing(null);
                          }}
                          className="absolute inset-0 w-full h-full px-2 font-mono text-xs bg-bg-surface text-text-primary border-2 border-primary outline-none z-20"
                        />
                      ) : (
                        <div
                          className={`flex items-center justify-between w-full h-full ${
                            isNumber ? 'justify-end text-right' : 'justify-start text-left'
                          }`}
                        >
                          {isFormula && (
                            <span
                              className="mr-1 text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold select-none shrink-0"
                              title={`Formula: ${cellData?.raw}`}
                            >
                              fx
                            </span>
                          )}

                          <span
                            className={`truncate ${
                              isError
                                ? 'text-danger font-mono font-medium'
                                : isFormula
                                ? 'text-text-primary font-medium'
                                : 'text-text-primary'
                            }`}
                          >
                            {cellData ? formatCellValue(cellData.computedValue) : ''}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
