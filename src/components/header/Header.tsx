import React from 'react';
import {
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  CheckCircle2,
  Layers,
  FlaskConical,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_SHEETS } from '../../data/sampleSheets';

interface HeaderProps {
  sheetName: string;
  onSheetNameChange: (name: string) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCompileAll: () => void;
  onReset: () => void;
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenPlayground: () => void;
  onOpenTestRunner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetName,
  onSheetNameChange,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCompileAll,
  onReset,
  currentPresetId,
  onSelectPreset,
  onOpenPlayground,
  onOpenTestRunner,
}) => {
  return (
    <header className="h-14 bg-bg-surface border-b border-border px-4 flex items-center justify-between select-none">
      {/* Left: Logo & Sheet Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          {/* Custom FormulaFlow Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan flex items-center justify-center shadow-soft-glow ring-1 ring-primary/40">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" strokeOpacity="0.4" />
              <path d="M7 8h10" />
              <path d="M7 12h5" />
              <path d="M7 16h8" />
              <circle cx="17" cy="12" r="2" fill="#06B6D4" stroke="none" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                FormulaFlow
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/30 uppercase tracking-wider font-semibold">
                Compiler Lab
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* Sheet Name Input */}
        <input
          type="text"
          value={sheetName}
          onChange={(e) => onSheetNameChange(e.target.value)}
          className="bg-transparent hover:bg-bg-elevated/60 focus:bg-bg-elevated px-2 py-1 rounded text-sm text-text-primary font-medium border border-transparent hover:border-border/60 focus:border-primary/60 outline-none transition-all w-48 sm:w-60 truncate"
          title="Click to rename spreadsheet"
        />

        {/* Save status badge */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs text-text-muted">
          {saveStatus === 'saved' && (
            <span className="flex items-center text-success text-[11px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-success" />
              Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-warning text-[11px] font-mono animate-pulse">
              Saving...
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-text-muted text-[11px] font-mono">
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Center: Preset Selector */}
      <div className="hidden lg:flex items-center space-x-2">
        <span className="text-xs text-text-muted font-medium flex items-center">
          <Layers className="w-3.5 h-3.5 mr-1" />
          Preset:
        </span>
        <select
          value={currentPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="bg-bg-elevated text-xs font-medium text-text-primary px-2.5 py-1.5 rounded-md border border-border hover:border-border-light focus:border-primary focus:outline-none transition-colors cursor-pointer"
        >
          {SAMPLE_SHEETS.map((sheet) => (
            <option key={sheet.id} value={sheet.id} className="bg-bg-elevated text-text-primary">
              {sheet.name}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" />

        {/* Formula Examples Playground */}
        <button
          onClick={onOpenPlayground}
          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-bg-elevated hover:bg-border/60 text-cyan-light border border-cyan/30 hover:border-cyan flex items-center space-x-1.5 transition-all shadow-sm"
          title="Browse formula examples and load presets"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan" />
          <span className="hidden sm:inline">Formulas</span>
        </button>

        {/* In-app Compiler Test Suite */}
        <button
          onClick={onOpenTestRunner}
          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-bg-elevated hover:bg-border/60 text-secondary-light border border-secondary/30 hover:border-secondary flex items-center space-x-1.5 transition-all shadow-sm"
          title="Run in-browser compiler unit test suite"
        >
          <FlaskConical className="w-3.5 h-3.5 text-secondary" />
          <span className="hidden md:inline">Test Suite</span>
        </button>

        {/* Compile All Button */}
        <button
          onClick={onCompileAll}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary hover:bg-primary-hover text-white flex items-center space-x-1.5 transition-all shadow-soft-glow active:scale-95"
          title="Compile and evaluate all formulas across the spreadsheet"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Compile All</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="Reset to initial default spreadsheet"
          className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
