import React, { useState } from 'react';
import { EXAMPLE_FORMULAS } from '../../data/exampleFormulas';
import { BookOpen, ArrowRight, X, Search } from 'lucide-react';

interface FormulaPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormula: (formula: string, recommendedCell?: string) => void;
}

export const FormulaPlaygroundModal: React.FC<FormulaPlaygroundModalProps> = ({
  isOpen,
  onClose,
  onSelectFormula,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(EXAMPLE_FORMULAS.map((f) => f.category)))];

  const filteredFormulas = EXAMPLE_FORMULAS.filter((f) => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-bg-surface border border-border rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-elevated/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan/15 text-cyan-light border border-cyan/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                FormulaFlow Expression Laboratory
              </h2>
              <p className="text-xs text-text-muted">
                Explore pre-built formula templates, compiler optimization testbeds, and diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border space-y-3 bg-bg-dark/40">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formulas (e.g. IF, SUM, folding, cycle)..."
              className="w-full pl-9 pr-4 py-2 bg-bg-elevated border border-border rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan text-bg-dark font-bold shadow-cyan-glow'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary hover:bg-border/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredFormulas.map((preset, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-bg-elevated/50 hover:bg-bg-elevated border border-border hover:border-cyan/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-surface border border-border text-primary-light font-semibold">
                    {preset.category}
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    {preset.title}
                  </span>
                </div>

                <div className="font-mono text-xs text-cyan-light bg-bg-dark px-2.5 py-1 rounded border border-border/80 inline-block font-bold">
                  {preset.formula}
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                {preset.targetCellRecommendation && (
                  <span className="text-[10px] font-mono text-text-muted">
                    Target: {preset.targetCellRecommendation}
                  </span>
                )}
                <button
                  onClick={() => {
                    onSelectFormula(preset.formula, preset.targetCellRecommendation);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan/15 hover:bg-cyan text-cyan-light hover:text-bg-dark border border-cyan/40 font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredFormulas.length === 0 && (
            <div className="p-8 text-center text-text-muted">
              No formulas matched your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
