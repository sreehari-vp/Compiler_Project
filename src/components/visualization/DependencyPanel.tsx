import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { DependencyAnalysisResult, RecalculationImpact } from '../../types/compiler';
import type { SheetGrid } from '../../types/spreadsheet';
import { GitFork, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { formatCellValue } from '../../utils/cellUtils';

interface DependencyPanelProps {
  dependencyAnalysis: DependencyAnalysisResult;
  selectedCell: string;
  grid: SheetGrid;
  lastImpact: RecalculationImpact | null;
  onSelectCell: (cellId: string) => void;
}

const DependencyCustomNode = ({ data }: { data: any }) => {
  const { cellId, isFormula, value, isSelected, isAffected, isCircular, raw } = data;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border min-w-[130px] text-center select-none shadow-card transition-all ${
        isCircular
          ? 'bg-danger/20 border-danger text-danger-light ring-2 ring-danger animate-pulse'
          : isSelected
          ? 'bg-primary/20 border-primary text-text-primary ring-2 ring-primary shadow-soft-glow'
          : isAffected
          ? 'bg-amber-500/15 border-amber-400 text-amber-200'
          : isFormula
          ? 'bg-bg-surface border-indigo-500/40 text-text-primary hover:border-indigo-400'
          : 'bg-bg-elevated border-border text-text-secondary hover:border-border-light'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-bg-surface"
      />

      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
        <span className="font-bold text-xs">{cellId}</span>
        <span
          className={`px-1 rounded text-[9px] font-semibold ${
            isFormula ? 'bg-primary/30 text-primary-light' : 'bg-bg-dark text-text-muted'
          }`}
        >
          {isFormula ? 'FORMULA' : 'VALUE'}
        </span>
      </div>

      <div className="font-mono text-xs font-bold truncate">
        {formatCellValue(value) || '—'}
      </div>

      {isFormula && raw && (
        <div className="text-[9px] text-text-muted font-mono truncate mt-0.5" title={raw}>
          {raw}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyan !w-2.5 !h-2.5 !border-2 !border-bg-surface"
      />
    </div>
  );
};

const nodeTypes = {
  depNode: DependencyCustomNode,
};

export const DependencyPanel: React.FC<DependencyPanelProps> = ({
  dependencyAnalysis,
  selectedCell,
  grid,
  lastImpact,
  onSelectCell,
}) => {
  const { graph, cycles, hasCircular } = dependencyAnalysis;

  const { nodes, edges } = useMemo(() => {
    const rfNodes: Node[] = [];
    const rfEdges: Edge[] = [];

    const relevantCellIds = new Set<string>();

    for (const [cellId, node] of Object.entries(graph)) {
      if (node.hasFormula || node.dependencies.length > 0 || node.dependents.length > 0) {
        relevantCellIds.add(cellId);
        for (const d of node.dependencies) relevantCellIds.add(d);
        for (const dep of node.dependents) relevantCellIds.add(dep);
      }
    }

    relevantCellIds.add(selectedCell);

    if (relevantCellIds.size === 0) {
      relevantCellIds.add('A1');
    }

    const depths: Record<string, number> = {};

    const computeDepth = (id: string, visited: Set<string>): number => {
      if (visited.has(id)) return 0;
      if (depths[id] !== undefined) return depths[id];

      visited.add(id);
      const node = graph[id];
      if (!node || node.dependencies.length === 0) {
        depths[id] = 0;
      } else {
        const parentDepths = node.dependencies.map((d) => computeDepth(d, new Set(visited)));
        depths[id] = Math.max(0, ...parentDepths) + 1;
      }
      return depths[id];
    };

    for (const id of relevantCellIds) {
      computeDepth(id, new Set());
    }

    const columns: Record<number, string[]> = {};
    for (const id of relevantCellIds) {
      const d = depths[id] || 0;
      if (!columns[d]) columns[d] = [];
      columns[d].push(id);
    }

    const colWidth = 220;
    const rowHeight = 90;

    Object.entries(columns).forEach(([colStr, cellList]) => {
      const colIdx = parseInt(colStr, 10);
      cellList.forEach((cellId, rowIdx) => {
        const cellData = grid[cellId];
        const isSelected = cellId === selectedCell;
        const isAffected = lastImpact?.affectedCells.includes(cellId) || false;
        const isCircular = cycles.some((cycle) => cycle.includes(cellId));

        rfNodes.push({
          id: cellId,
          type: 'depNode',
          position: { x: colIdx * colWidth + 50, y: rowIdx * rowHeight + 50 },
          data: {
            cellId,
            isFormula: cellData?.isFormula || false,
            value: cellData?.computedValue,
            raw: cellData?.raw,
            isSelected,
            isAffected,
            isCircular,
          },
        });
      });
    });

    for (const cellId of relevantCellIds) {
      const node = graph[cellId];
      if (!node) continue;

      for (const depId of node.dependencies) {
        if (!relevantCellIds.has(depId)) continue;

        const isInCycle = cycles.some(
          (cycle) => cycle.includes(depId) && cycle.includes(cellId)
        );

        rfEdges.push({
          id: `${depId}->${cellId}`,
          source: depId,
          target: cellId,
          animated: isInCycle || lastImpact?.affectedCells.includes(cellId),
          style: {
            stroke: isInCycle ? '#EF4444' : isNaN(Number(grid[depId]?.computedValue)) ? '#8B5CF6' : '#6366F1',
            strokeWidth: isInCycle ? 2.5 : 1.8,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isInCycle ? '#EF4444' : '#6366F1',
          },
        });
      }
    }

    return { nodes: rfNodes, edges: rfEdges };
  }, [graph, cycles, selectedCell, grid, lastImpact]);

  return (
    <div className="h-full flex flex-col select-none">
      <div className="h-12 bg-bg-surface border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-cyan">
          <GitFork className="w-4 h-4" />
          <h3 className="text-xs font-bold text-text-primary">
            Phase 06: Dependency Graph & Cycles
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          {hasCircular ? (
            <span className="flex items-center text-danger bg-danger/15 border border-danger/30 px-2 py-0.5 rounded font-bold animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5 mr-1" />
              Circular Cycle: {cycles[0]?.join(' → ')}
            </span>
          ) : (
            <span className="flex items-center text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Acyclic DAG Valid
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-bg-dark">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelectCell(node.id)}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ animated: true }}
        >
          <Background color="#1F293D" gap={18} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#06B6D4"
            maskColor="rgba(11, 16, 32, 0.75)"
            className="!bg-bg-surface !border !border-border !rounded-lg"
          />
        </ReactFlow>

        {lastImpact && (
          <div className="absolute bottom-4 left-4 max-w-sm p-3 rounded-xl bg-bg-surface/95 backdrop-blur border border-border shadow-card text-xs space-y-1 z-20">
            <div className="flex items-center justify-between text-amber-300 font-bold font-mono">
              <span>Recalculation Impact</span>
              <span>{lastImpact.executionTimeMs} ms</span>
            </div>
            <div className="text-[11px] text-text-muted">
              Changed: <span className="font-bold text-text-primary">{lastImpact.changedCell}</span> → Affected: <span className="font-bold text-amber-200">{lastImpact.affectedCells.join(', ') || 'None'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
