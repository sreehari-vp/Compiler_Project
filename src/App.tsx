import { useState, useEffect } from 'react';
import { useSpreadsheetStore } from './store/spreadsheetStore';
import { Header } from './components/header/Header';
import { FormulaBar } from './components/spreadsheet/FormulaBar';
import { SpreadsheetGrid } from './components/spreadsheet/SpreadsheetGrid';
import { CompilerSidebar } from './components/sidebar/CompilerSidebar';
import { CompilerInspector } from './components/inspector/CompilerInspector';
import { InputPanel } from './components/visualization/InputPanel';
import { LexerPanel } from './components/visualization/LexerPanel';
import { ParserPanel } from './components/visualization/ParserPanel';
import { AstPanel } from './components/visualization/AstPanel';
import { SemanticPanel } from './components/visualization/SemanticPanel';
import { DependencyPanel } from './components/visualization/DependencyPanel';
import { IrPanel } from './components/visualization/IrPanel';
import { OptimizerPanel } from './components/visualization/OptimizerPanel';
import { EvaluatorPanel } from './components/visualization/EvaluatorPanel';
import { FormulaPlaygroundModal } from './components/playground/FormulaPlaygroundModal';
import { TestRunnerModal } from './components/testrunner/TestRunnerModal';

export function App() {
  const store = useSpreadsheetStore();

  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'grid-focused' | 'compiler-focused'>('split');
  const [showInspector, setShowInspector] = useState(true);

  // Global Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [store]);

  const handleSelectFormulaPreset = (formula: string, recommendedCell?: string) => {
    const target = recommendedCell || store.state.selectedCell;
    store.selectCell(target);
    store.commitCellEdit(target, formula);
  };

  const renderVisualizationPanel = () => {
    switch (store.activePhase) {
      case 'input':
        return (
          <InputPanel
            targetCell={store.state.selectedCell}
            cellData={store.selectedCellData}
            result={store.activeCompilerResult}
          />
        );
      case 'lexer':
        return <LexerPanel result={store.activeCompilerResult} />;
      case 'parser':
        return <ParserPanel result={store.activeCompilerResult} />;
      case 'ast':
        return <AstPanel result={store.activeCompilerResult} />;
      case 'semantic':
        return (
          <SemanticPanel
            result={store.activeCompilerResult}
            targetCell={store.state.selectedCell}
          />
        );
      case 'dependencies':
        return (
          <DependencyPanel
            dependencyAnalysis={store.dependencyAnalysis}
            selectedCell={store.state.selectedCell}
            grid={store.state.cells}
            lastImpact={store.lastImpact}
            onSelectCell={store.selectCell}
          />
        );
      case 'ir':
        return <IrPanel result={store.activeCompilerResult} />;
      case 'optimizer':
        return <OptimizerPanel result={store.activeCompilerResult} />;
      case 'evaluator':
        return (
          <EvaluatorPanel
            result={store.activeCompilerResult}
            selectedCell={store.state.selectedCell}
            grid={store.state.cells}
            lastImpact={store.lastImpact}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-dark text-text-primary">
      {/* 1. Header */}
      <Header
        sheetName={store.state.name}
        onSheetNameChange={store.setSheetName}
        saveStatus={store.saveStatus}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        onUndo={store.undo}
        onRedo={store.redo}
        onCompileAll={store.compileAll}
        onReset={store.resetSheet}
        currentPresetId={store.state.id}
        onSelectPreset={store.loadPreset}
        onOpenPlayground={() => setIsPlaygroundOpen(true)}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
      />

      {/* 2. Formula Bar */}
      <FormulaBar
        selectedCellId={store.state.selectedCell}
        selectedCellData={store.selectedCellData}
        editValue={store.state.editValue}
        onEditValueChange={store.setEditValue}
        onCommit={store.commitCellEdit}
        onCompile={store.compileSelectedCell}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Compiler Pipeline Navigation */}
        <CompilerSidebar
          activePhase={store.activePhase}
          onSelectPhase={store.setActivePhase}
          result={store.activeCompilerResult}
          targetCell={store.state.selectedCell}
        />

        {/* Center: Workspace (Grid + Compiler Visualization) */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-dark overflow-hidden border-r border-border">
          {/* View Mode Switcher Toolbar */}
          <div className="h-8 bg-bg-surface/80 border-b border-border/80 px-4 flex items-center justify-between text-xs select-none">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-text-muted">Layout View:</span>
              <div className="flex items-center bg-bg-elevated p-0.5 rounded border border-border">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'split' ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setViewMode('grid-focused')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'grid-focused' ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Grid Focus
                </button>
                <button
                  onClick={() => setViewMode('compiler-focused')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'compiler-focused' ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Compiler Focus
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInspector(!showInspector)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  showInspector
                    ? 'bg-bg-elevated text-cyan-light border-cyan/40'
                    : 'bg-transparent text-text-muted border-border hover:text-text-primary'
                }`}
              >
                {showInspector ? 'Hide Inspector' : 'Show Inspector'}
              </button>
            </div>
          </div>

          {/* Center Content: Split or Focused Panels */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Area: Spreadsheet Grid */}
            {(viewMode === 'split' || viewMode === 'grid-focused') && (
              <div
                className={`flex flex-col border-b border-border overflow-hidden ${
                  viewMode === 'split' ? 'h-1/2 min-h-[220px]' : 'h-full'
                }`}
              >
                <SpreadsheetGrid
                  rowCount={store.state.rowCount}
                  colCount={store.state.colCount}
                  cells={store.state.cells}
                  selectedCell={store.state.selectedCell}
                  onSelectCell={store.selectCell}
                  onCommitCell={store.commitCellEdit}
                  onClearCell={store.clearCell}
                />
              </div>
            )}

            {/* Bottom Area: Active Compiler Visualization Panel */}
            {(viewMode === 'split' || viewMode === 'compiler-focused') && (
              <div
                className={`flex-1 overflow-auto bg-bg-dark custom-scrollbar ${
                  viewMode === 'compiler-focused' ? 'h-full' : ''
                }`}
              >
                {renderVisualizationPanel()}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Compiler Inspector & Symbol Table */}
        {showInspector && (
          <CompilerInspector
            selectedCell={store.state.selectedCell}
            cellData={store.selectedCellData}
            result={store.activeCompilerResult}
            grid={store.state.cells}
            dependencyAnalysis={store.dependencyAnalysis}
            onNavigatePhase={store.setActivePhase}
            onSelectCell={store.selectCell}
          />
        )}
      </div>

      {/* Modals */}
      <FormulaPlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        onSelectFormula={handleSelectFormulaPreset}
      />

      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
}

export default App;
