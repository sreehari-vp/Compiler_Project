import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  CellData,
  SheetGrid,
  SpreadsheetState,
  SheetHistory,
} from '../types/spreadsheet';
import type {
  CompilerPhaseId,
  CompilerPipelineResult,
  DependencyAnalysisResult,
  RecalculationImpact,
} from '../types/compiler';
import { CompilerEngine } from '../compiler/engine';
import { DependencyAnalyzer } from '../compiler/dependencyAnalyzer';
import { SAMPLE_SHEETS } from '../data/sampleSheets';

const LOCAL_STORAGE_KEY = 'formulaflow_spreadsheet_state_v1';
const MAX_HISTORY = 30;

export interface SpreadsheetStoreHook {
  state: SpreadsheetState;
  activePhase: CompilerPhaseId;
  setActivePhase: (phase: CompilerPhaseId) => void;
  selectedCellData: CellData | null;
  activeCompilerResult: CompilerPipelineResult | null;
  dependencyAnalysis: DependencyAnalysisResult;
  lastImpact: RecalculationImpact | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  selectCell: (cellId: string) => void;
  setEditValue: (value: string) => void;
  commitCellEdit: (cellId: string, value: string) => void;
  clearCell: (cellId: string) => void;
  compileSelectedCell: () => void;
  compileAll: () => void;
  undo: () => void;
  redo: () => void;
  loadPreset: (presetId: string) => void;
  resetSheet: () => void;
  setSheetName: (name: string) => void;
}

export function useSpreadsheetStore(): SpreadsheetStoreHook {
  const defaultPreset = SAMPLE_SHEETS[0];

  const [state, setState] = useState<SpreadsheetState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.cells) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state:', e);
    }

    return {
      id: defaultPreset.id,
      name: defaultPreset.name,
      rowCount: defaultPreset.rowCount,
      colCount: defaultPreset.colCount,
      cells: defaultPreset.cells,
      selectedCell: defaultPreset.initialSelectedCell,
      editingCell: null,
      editValue: defaultPreset.cells[defaultPreset.initialSelectedCell]?.raw || '',
      isCompiled: true,
      isDirty: false,
    };
  });

  const [activePhase, setActivePhase] = useState<CompilerPhaseId>('ast');
  const [history, setHistory] = useState<SheetHistory>({ past: [], future: [] });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastImpact, setLastImpact] = useState<RecalculationImpact | null>(null);

  const recomputeGrid = useCallback((initialGrid: SheetGrid, changedCellId?: string): {
    updatedGrid: SheetGrid;
    depResult: DependencyAnalysisResult;
    impact: RecalculationImpact | null;
  } => {
    const grid: SheetGrid = { ...initialGrid };

    if (changedCellId) {
      const cellData = grid[changedCellId];
      if (cellData) {
        if (cellData.raw.startsWith('=')) {
          const res = CompilerEngine.compileFormula(cellData.raw, changedCellId, grid);
          grid[changedCellId] = {
            ...cellData,
            formula: cellData.raw,
            isFormula: true,
            compilerResult: res,
            computedValue: res.evaluationResult,
            valueType: typeof res.evaluationResult === 'number' ? 'number' : typeof res.evaluationResult === 'boolean' ? 'boolean' : 'string',
          };
        } else {
          const numVal = Number(cellData.raw);
          const isNum = cellData.raw.trim() !== '' && !isNaN(numVal);
          grid[changedCellId] = {
            ...cellData,
            isFormula: false,
            formula: undefined,
            compilerResult: undefined,
            computedValue: isNum ? numVal : cellData.raw,
            valueType: cellData.raw === '' ? 'empty' : isNum ? 'number' : 'string',
          };
        }
      }
    } else {
      for (const [cellId, cellData] of Object.entries(grid)) {
        if (cellData.raw.startsWith('=')) {
          const res = CompilerEngine.compileFormula(cellData.raw, cellId, grid);
          grid[cellId] = {
            ...cellData,
            formula: cellData.raw,
            isFormula: true,
            compilerResult: res,
            computedValue: res.evaluationResult,
            valueType: typeof res.evaluationResult === 'number' ? 'number' : typeof res.evaluationResult === 'boolean' ? 'boolean' : 'string',
          };
        } else {
          const numVal = Number(cellData.raw);
          const isNum = cellData.raw.trim() !== '' && !isNaN(numVal);
          grid[cellId] = {
            ...cellData,
            isFormula: false,
            formula: undefined,
            compilerResult: undefined,
            computedValue: isNum ? numVal : cellData.raw,
            valueType: cellData.raw === '' ? 'empty' : isNum ? 'number' : 'string',
          };
        }
      }
    }

    const depAnalyzer = new DependencyAnalyzer(grid);
    const depResult = depAnalyzer.analyze();

    let impact: RecalculationImpact | null = null;
    if (changedCellId) {
      impact = depAnalyzer.computeRecalculationImpact(changedCellId);
    }

    if (depResult.hasCircular) {
      const cycleCells = new Set<string>();
      for (const cycle of depResult.cycles) {
        for (const c of cycle) {
          cycleCells.add(c);
        }
      }

      for (const cellId of cycleCells) {
        if (grid[cellId]) {
          grid[cellId] = {
            ...grid[cellId],
            computedValue: '#CIRCULAR!',
            valueType: 'error',
            error: `Circular dependency loop detected: ${depResult.cycles[0]?.join(' → ')}`,
          };
        }
      }
      return { updatedGrid: grid, depResult, impact };
    }

    const cellsToEvaluate = changedCellId && impact
      ? impact.order
      : depResult.evaluationOrder;

    for (const cellId of cellsToEvaluate) {
      const cellData = grid[cellId];
      if (cellData && cellData.isFormula && cellData.raw.startsWith('=')) {
        const res = CompilerEngine.compileFormula(cellData.raw, cellId, grid);
        grid[cellId] = {
          ...cellData,
          compilerResult: res,
          computedValue: res.evaluationResult,
          valueType: typeof res.evaluationResult === 'number' ? 'number' : typeof res.evaluationResult === 'boolean' ? 'boolean' : 'string',
          error: res.isValid ? undefined : res.diagnostics[0]?.message,
        };
      }
    }

    return { updatedGrid: grid, depResult, impact };
  }, []);

  const dependencyAnalysis = useMemo(() => {
    const analyzer = new DependencyAnalyzer(state.cells);
    return analyzer.analyze();
  }, [state.cells]);

  const selectedCellData = useMemo(() => {
    return state.cells[state.selectedCell] || null;
  }, [state.cells, state.selectedCell]);

  const activeCompilerResult = useMemo(() => {
    if (!selectedCellData) return null;
    if (selectedCellData.compilerResult) return selectedCellData.compilerResult;
    if (selectedCellData.raw.startsWith('=')) {
      return CompilerEngine.compileFormula(selectedCellData.raw, selectedCellData.id, state.cells);
    }
    return null;
  }, [selectedCellData, state.cells]);

  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
        setSaveStatus('unsaved');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [state]);

  const selectCell = useCallback((cellId: string) => {
    const upperId = cellId.toUpperCase();
    setState((prev) => ({
      ...prev,
      selectedCell: upperId,
      editingCell: null,
      editValue: prev.cells[upperId]?.raw || '',
    }));
  }, []);

  const setEditValue = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      editValue: value,
    }));
  }, []);

  const commitCellEdit = useCallback((cellId: string, rawVal: string) => {
    const upperId = cellId.toUpperCase();
    setState((prev) => {
      setHistory((h) => ({
        past: [...h.past.slice(-MAX_HISTORY), prev.cells],
        future: [],
      }));

      const newCells = { ...prev.cells };
      newCells[upperId] = {
        id: upperId,
        raw: rawVal,
        computedValue: rawVal,
        valueType: 'string',
        isFormula: rawVal.startsWith('='),
      };

      const { updatedGrid, impact } = recomputeGrid(newCells, upperId);
      if (impact) {
        setLastImpact(impact);
      }

      return {
        ...prev,
        cells: updatedGrid,
        editingCell: null,
        editValue: rawVal,
        isDirty: true,
      };
    });
  }, [recomputeGrid]);

  const clearCell = useCallback((cellId: string) => {
    commitCellEdit(cellId, '');
  }, [commitCellEdit]);

  const compileSelectedCell = useCallback(() => {
    if (!state.selectedCell) return;
    const cell = state.cells[state.selectedCell];
    const formulaStr = state.editValue.trim();

    if (formulaStr.startsWith('=')) {
      commitCellEdit(state.selectedCell, formulaStr);
    } else if (cell && cell.raw.startsWith('=')) {
      commitCellEdit(state.selectedCell, cell.raw);
    }
  }, [state.selectedCell, state.editValue, state.cells, commitCellEdit]);

  const compileAll = useCallback(() => {
    setState((prev) => {
      const { updatedGrid } = recomputeGrid(prev.cells);
      return {
        ...prev,
        cells: updatedGrid,
        isCompiled: true,
      };
    });
  }, [recomputeGrid]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);

      setState((prev) => {
        const { updatedGrid } = recomputeGrid(previous);
        return {
          ...prev,
          cells: updatedGrid,
          editValue: updatedGrid[prev.selectedCell]?.raw || '',
        };
      });

      return {
        past: newPast,
        future: [state.cells, ...h.future],
      };
    });
  }, [state.cells, recomputeGrid]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const newFuture = h.future.slice(1);

      setState((prev) => {
        const { updatedGrid } = recomputeGrid(next);
        return {
          ...prev,
          cells: updatedGrid,
          editValue: updatedGrid[prev.selectedCell]?.raw || '',
        };
      });

      return {
        past: [...h.past, state.cells],
        future: newFuture,
      };
    });
  }, [state.cells, recomputeGrid]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = SAMPLE_SHEETS.find((p) => p.id === presetId) || SAMPLE_SHEETS[0];
    const { updatedGrid } = recomputeGrid(preset.cells);

    setState({
      id: preset.id,
      name: preset.name,
      rowCount: preset.rowCount,
      colCount: preset.colCount,
      cells: updatedGrid,
      selectedCell: preset.initialSelectedCell,
      editingCell: null,
      editValue: updatedGrid[preset.initialSelectedCell]?.raw || '',
      isCompiled: true,
      isDirty: false,
    });
    setHistory({ past: [], future: [] });
    setLastImpact(null);
  }, [recomputeGrid]);

  const resetSheet = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    loadPreset(SAMPLE_SHEETS[0].id);
  }, [loadPreset]);

  const setSheetName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  return {
    state,
    activePhase,
    setActivePhase,
    selectedCellData,
    activeCompilerResult,
    dependencyAnalysis,
    lastImpact,
    saveStatus,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    selectCell,
    setEditValue,
    commitCellEdit,
    clearCell,
    compileSelectedCell,
    compileAll,
    undo,
    redo,
    loadPreset,
    resetSheet,
    setSheetName,
  };
}
