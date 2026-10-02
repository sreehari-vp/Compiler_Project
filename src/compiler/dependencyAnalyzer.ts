import type {
  DependencyNode,
  DependencyAnalysisResult,
  RecalculationImpact,
} from '../types/compiler';
import type { SheetGrid } from '../types/spreadsheet';

import { CompilerEngine } from './engine';

export class DependencyAnalyzer {
  private grid: SheetGrid;

  constructor(grid: SheetGrid) {
    this.grid = grid;
  }

  public analyze(): DependencyAnalysisResult {
    const graph: Record<string, DependencyNode> = {};

    for (const [cellId, cellData] of Object.entries(this.grid)) {
      const upperId = cellId.toUpperCase();
      graph[upperId] = {
        cellId: upperId,
        dependencies: [],
        dependents: [],
        hasFormula: cellData.isFormula || Boolean(cellData.raw?.startsWith('=')),
        value: cellData.computedValue,
      };
    }

    for (const [cellId, cellData] of Object.entries(this.grid)) {
      const upperId = cellId.toUpperCase();
      const rawFormula = cellData.formula || (cellData.raw && cellData.raw.startsWith('=') ? cellData.raw : null);
      if (cellData.isFormula || rawFormula) {
        let deps: string[] = [];
        if (cellData.compilerResult && cellData.compilerResult.dependencies) {
          deps = cellData.compilerResult.dependencies.map((d) => d.toUpperCase());
        } else if (rawFormula) {
          const res = CompilerEngine.compileFormula(rawFormula, upperId, this.grid);
          deps = res.dependencies.map((d) => d.toUpperCase());
        }
        graph[upperId].dependencies = deps;

        for (const dep of deps) {
          if (!graph[dep]) {
            graph[dep] = {
              cellId: dep,
              dependencies: [],
              dependents: [],
              hasFormula: false,
              value: 0,
            };
          }
          if (!graph[dep].dependents.includes(upperId)) {
            graph[dep].dependents.push(upperId);
          }
        }
      }
    }

    const cycles = this.detectCycles(graph);
    const hasCircular = cycles.length > 0;
    const evaluationOrder = this.computeTopologicalSort(graph, hasCircular);

    return {
      graph,
      cycles,
      evaluationOrder,
      hasCircular,
    };
  }

  private detectCycles(graph: Record<string, DependencyNode>): string[][] {
    const cycles: string[][] = [];
    const state: Record<string, 'UNVISITED' | 'VISITING' | 'VISITED'> = {};
    const path: string[] = [];

    for (const cellId of Object.keys(graph)) {
      state[cellId] = 'UNVISITED';
    }

    const dfs = (nodeId: string) => {
      state[nodeId] = 'VISITING';
      path.push(nodeId);

      const node = graph[nodeId];
      if (node) {
        for (const depId of node.dependencies) {
          if (!graph[depId]) continue;

          if (state[depId] === 'VISITING') {
            const cycleStartIndex = path.indexOf(depId);
            if (cycleStartIndex !== -1) {
              const cyclePath = path.slice(cycleStartIndex);
              cyclePath.push(depId);
              cycles.push(cyclePath);
            }
          } else if (state[depId] === 'UNVISITED') {
            dfs(depId);
          }
        }
      }

      path.pop();
      state[nodeId] = 'VISITED';
    };

    for (const cellId of Object.keys(graph)) {
      if (state[cellId] === 'UNVISITED') {
        dfs(cellId);
      }
    }

    return cycles;
  }

  private computeTopologicalSort(graph: Record<string, DependencyNode>, hasCycles: boolean): string[] {
    if (hasCycles) return [];

    const order: string[] = [];
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    for (const cellId of Object.keys(graph)) {
      inDegree[cellId] = 0;
      adj[cellId] = [];
    }

    for (const [cellId, node] of Object.entries(graph)) {
      for (const dep of node.dependencies) {
        if (!adj[dep]) adj[dep] = [];
        adj[dep].push(cellId);
        inDegree[cellId] = (inDegree[cellId] || 0) + 1;
      }
    }

    const queue: string[] = [];
    for (const [cellId, deg] of Object.entries(inDegree)) {
      if (deg === 0) {
        queue.push(cellId);
      }
    }

    while (queue.length > 0) {
      const u = queue.shift()!;
      order.push(u);

      for (const v of adj[u] || []) {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      }
    }

    return order;
  }

  public computeRecalculationImpact(changedCellId: string): RecalculationImpact {
    const startTime = performance.now();
    const upperChanged = changedCellId.toUpperCase();
    const analysis = this.analyze();
    const graph = analysis.graph;

    const affectedSet = new Set<string>();
    const queue: string[] = [upperChanged];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = graph[current];
      if (!node) continue;

      for (const dependent of node.dependents) {
        if (!affectedSet.has(dependent)) {
          affectedSet.add(dependent);
          queue.push(dependent);
        }
      }
    }

    const affectedCells = Array.from(affectedSet);
    const orderedAffected = analysis.evaluationOrder.filter((c) => affectedSet.has(c));
    const totalCells = Object.keys(this.grid).length;
    const recalculatedCount = affectedCells.length;
    const skippedCount = Math.max(0, totalCells - recalculatedCount - 1);
    const endTime = performance.now();

    return {
      changedCell: upperChanged,
      affectedCells,
      recalculatedCount,
      skippedCount,
      executionTimeMs: parseFloat((endTime - startTime).toFixed(3)),
      order: orderedAffected.length > 0 ? orderedAffected : affectedCells,
    };
  }
}
