import React from 'react';
import type {
  CompilerPhaseId,
  CompilerPipelineResult,
} from '../../types/compiler';
import {
  FileCode2,
  Binary,
  GitCommit,
  Network,
  ShieldCheck,
  GitFork,
  Cpu,
  Zap,
  Calculator,
  ChevronRight,
} from 'lucide-react';
import { countASTNodes } from '../../compiler/ast';

interface CompilerSidebarProps {
  activePhase: CompilerPhaseId;
  onSelectPhase: (phase: CompilerPhaseId) => void;
  result: CompilerPipelineResult | null;
  targetCell: string;
}

interface PhaseConfig {
  id: CompilerPhaseId;
  step: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: 'input',
    step: '01',
    name: 'Formula Input',
    icon: FileCode2,
    description: 'Raw formula text and metadata',
  },
  {
    id: 'lexer',
    step: '02',
    name: 'Lexical Analysis',
    icon: Binary,
    description: 'Token stream generation & positions',
  },
  {
    id: 'parser',
    step: '03',
    name: 'Syntax Parsing',
    icon: GitCommit,
    description: 'Grammar rules & operator precedence',
  },
  {
    id: 'ast',
    step: '04',
    name: 'Abstract Syntax Tree',
    icon: Network,
    description: 'Hierarchical AST graph structure',
  },
  {
    id: 'semantic',
    step: '05',
    name: 'Semantic Analysis',
    icon: ShieldCheck,
    description: 'Types, signatures & scope validation',
  },
  {
    id: 'dependencies',
    step: '06',
    name: 'Dependency Graph',
    icon: GitFork,
    description: 'Cell dependency DAG & cycle detection',
  },
  {
    id: 'ir',
    step: '07',
    name: 'Intermediate Repr.',
    icon: Cpu,
    description: '3-Address Code with virtual registers',
  },
  {
    id: 'optimizer',
    step: '08',
    name: 'Optimization',
    icon: Zap,
    description: 'Constant folding & algebraic reduction',
  },
  {
    id: 'evaluator',
    step: '09',
    name: 'Evaluation',
    icon: Calculator,
    description: 'Execution & incremental recalculation',
  },
];

export const CompilerSidebar: React.FC<CompilerSidebarProps> = ({
  activePhase,
  onSelectPhase,
  result,
  targetCell,
}) => {
  const getBadgeForPhase = (id: CompilerPhaseId) => {
    if (!result) return null;

    switch (id) {
      case 'input':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface text-text-muted">
            {targetCell}
          </span>
        );
      case 'lexer':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan/15 text-cyan-light font-medium">
            {result.tokens.length} tok
          </span>
        );
      case 'parser':
        return result.ast ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">
            parsed
          </span>
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-danger/15 text-danger font-medium">
            error
          </span>
        );
      case 'ast':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-medium">
            {result.ast ? `${countASTNodes(result.ast)} nodes` : '0'}
          </span>
        );
      case 'semantic': {
        const errors = result.semanticDiagnostics.filter((d) => d.severity === 'error');
        if (errors.length > 0) {
          return (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-danger/15 text-danger font-medium">
              {errors.length} err
            </span>
          );
        }
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">
            valid
          </span>
        );
      }
      case 'dependencies':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
            {result.dependencies.length} deps
          </span>
        );
      case 'ir':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium">
            {result.ir.length} ops
          </span>
        );
      case 'optimizer':
        return result.optimizationSteps.length > 0 ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-medium">
            {result.optimizationSteps.length} opt
          </span>
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface text-text-muted">
            clean
          </span>
        );
      case 'evaluator':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-light font-medium truncate max-w-[55px]">
            {String(result.evaluationResult)}
          </span>
        );
    }
  };

  return (
    <aside className="w-64 bg-bg-surface border-r border-border flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-border/80 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Compiler Pipeline
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Phase-by-phase execution trace
          </p>
        </div>
        <div className="text-[11px] font-mono text-cyan-light bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-full font-semibold">
          9 Phases
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {PHASES.map((phase) => {
          const isActive = activePhase === phase.id;
          const Icon = phase.icon;
          const badge = getBadgeForPhase(phase.id);

          return (
            <button
              key={phase.id}
              onClick={() => onSelectPhase(phase.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/50 text-text-primary shadow-soft-glow'
                  : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary hover:border-border/60'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className={`text-[10px] font-mono font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-bg-elevated text-text-muted group-hover:text-text-secondary'
                  }`}
                >
                  {phase.step}
                </span>

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-cyan-light'
                      : 'text-text-muted group-hover:text-text-secondary'
                  }`}
                />

                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {phase.name}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {phase.description}
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-1 flex items-center space-x-1">
                {badge}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive
                      ? 'text-primary transform translate-x-0.5'
                      : 'text-text-muted/40 group-hover:text-text-muted'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border bg-bg-elevated/40">
        <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
          <span>Active Target</span>
          <span className="font-mono text-cyan-light font-bold">{targetCell}</span>
        </div>
        <div className="font-mono text-[11px] text-text-primary bg-bg-dark/80 px-2 py-1.5 rounded border border-border truncate">
          {result?.formula || 'No formula active'}
        </div>
      </div>
    </aside>
  );
};
