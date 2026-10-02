import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { ASTNode, CompilerPipelineResult } from '../../types/compiler';
import { Network } from 'lucide-react';
import { countASTNodes, getASTDepth } from '../../compiler/ast';

interface AstPanelProps {
  result: CompilerPipelineResult | null;
}

const ASTCustomNode = ({ data }: { data: any }) => {
  const { nodeType, label, subLabel, badgeColor, borderColor, isSelected } = data;

  return (
    <div
      className={`px-3 py-2 rounded-xl border bg-bg-surface shadow-card min-w-[130px] max-w-[200px] text-center select-none transition-all ${borderColor} ${
        isSelected ? 'ring-2 ring-primary scale-105 shadow-soft-glow' : 'hover:scale-102'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-bg-surface"
      />

      <div className="flex items-center justify-center space-x-1 mb-1">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
          {nodeType}
        </span>
      </div>

      <div className="font-mono text-xs font-bold text-text-primary truncate">
        {label}
      </div>

      {subLabel && (
        <div className="text-[10px] text-text-muted font-mono truncate mt-0.5">
          {subLabel}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan !w-2.5 !h-2.5 !border-2 !border-bg-surface"
      />
    </div>
  );
};

const nodeTypes = {
  astNode: ASTCustomNode,
};

export const AstPanel: React.FC<AstPanelProps> = ({ result }) => {
  const [selectedASTNode, setSelectedASTNode] = useState<ASTNode | null>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!result?.ast) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const levelHeight = 90;
    const nodeWidth = 160;

    const computeSubtreeWidth = (node: ASTNode): number => {
      switch (node.type) {
        case 'BinaryExpression':
          return computeSubtreeWidth(node.left) + computeSubtreeWidth(node.right) + 40;
        case 'UnaryExpression':
          return computeSubtreeWidth(node.operand) + 40;
        case 'FunctionCall': {
          if (node.args.length === 0) return nodeWidth;
          return node.args.reduce((acc, arg) => acc + computeSubtreeWidth(arg) + 30, 0);
        }
        default:
          return nodeWidth;
      }
    };

    const layoutTree = (node: ASTNode, xCenter: number, yPos: number) => {
      let label = '';
      let subLabel = '';
      let badgeColor = 'bg-bg-elevated text-text-muted';
      let borderColor = 'border-border';

      switch (node.type) {
        case 'FunctionCall':
          label = `${node.name}()`;
          subLabel = `${node.args.length} arg(s)`;
          badgeColor = 'bg-indigo-500/20 text-indigo-300';
          borderColor = 'border-indigo-500/50';
          break;
        case 'BinaryExpression':
          label = `Operator '${node.operator}'`;
          subLabel = 'Binary Expression';
          badgeColor = 'bg-purple-500/20 text-purple-300';
          borderColor = 'border-purple-500/50';
          break;
        case 'UnaryExpression':
          label = `Unary '${node.operator}'`;
          subLabel = 'Prefix Operator';
          badgeColor = 'bg-pink-500/20 text-pink-300';
          borderColor = 'border-pink-500/50';
          break;
        case 'CellReference':
          label = node.cell;
          subLabel = `Col ${node.col}, Row ${node.row}`;
          badgeColor = 'bg-cyan/20 text-cyan-light';
          borderColor = 'border-cyan/50';
          break;
        case 'RangeReference':
          label = node.range;
          subLabel = `${node.cells.length} cells`;
          badgeColor = 'bg-amber-500/20 text-amber-300';
          borderColor = 'border-amber-500/50';
          break;
        case 'NumberLiteral':
          label = node.raw;
          subLabel = 'Numeric Literal';
          badgeColor = 'bg-emerald-500/20 text-emerald-300';
          borderColor = 'border-emerald-500/50';
          break;
        case 'StringLiteral':
          label = `"${node.value}"`;
          subLabel = 'String Literal';
          badgeColor = 'bg-yellow-500/20 text-yellow-300';
          borderColor = 'border-yellow-500/50';
          break;
        case 'BooleanLiteral':
          label = node.raw;
          subLabel = 'Boolean Literal';
          badgeColor = 'bg-rose-500/20 text-rose-300';
          borderColor = 'border-rose-500/50';
          break;
      }

      nodes.push({
        id: node.id,
        type: 'astNode',
        position: { x: xCenter - 75, y: yPos },
        data: {
          nodeType: node.type,
          label,
          subLabel,
          badgeColor,
          borderColor,
          astNodeRef: node,
        },
      });

      if (node.type === 'BinaryExpression') {
        const leftWidth = computeSubtreeWidth(node.left);
        const rightWidth = computeSubtreeWidth(node.right);
        const totalW = leftWidth + rightWidth + 40;

        const leftX = xCenter - totalW / 4;
        const rightX = xCenter + totalW / 4;

        edges.push({
          id: `${node.id}->${node.left.id}`,
          source: node.id,
          target: node.left.id,
          label: 'L',
          labelStyle: { fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
          style: { stroke: '#6366F1', strokeWidth: 1.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366F1' },
        });
        layoutTree(node.left, leftX, yPos + levelHeight);

        edges.push({
          id: `${node.id}->${node.right.id}`,
          source: node.id,
          target: node.right.id,
          label: 'R',
          labelStyle: { fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
          style: { stroke: '#6366F1', strokeWidth: 1.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366F1' },
        });
        layoutTree(node.right, rightX, yPos + levelHeight);
      } else if (node.type === 'UnaryExpression') {
        edges.push({
          id: `${node.id}->${node.operand.id}`,
          source: node.id,
          target: node.operand.id,
          style: { stroke: '#EC4899', strokeWidth: 1.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#EC4899' },
        });
        layoutTree(node.operand, xCenter, yPos + levelHeight);
      } else if (node.type === 'FunctionCall') {
        const argCount = node.args.length;
        if (argCount > 0) {
          const totalW = node.args.reduce((sum, a) => sum + computeSubtreeWidth(a) + 30, 0);
          let currentLeft = xCenter - totalW / 2;

          node.args.forEach((arg, idx) => {
            const w = computeSubtreeWidth(arg);
            const childX = currentLeft + w / 2;
            currentLeft += w + 30;

            edges.push({
              id: `${node.id}->${arg.id}`,
              source: node.id,
              target: arg.id,
              label: `arg[${idx}]`,
              labelStyle: { fill: '#94A3B8', fontSize: 9, fontFamily: 'monospace' },
              style: { stroke: '#8B5CF6', strokeWidth: 1.8 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
            });
            layoutTree(arg, childX, yPos + levelHeight);
          });
        }
      }
    };

    layoutTree(result.ast, 450, 40);

    return { initialNodes: nodes, initialEdges: edges };
  }, [result?.ast]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.data?.astNodeRef) {
      setSelectedASTNode(node.data.astNodeRef as ASTNode);
    }
  }, []);

  if (!result?.ast) {
    return (
      <div className="p-8 text-center text-text-muted">
        <Network className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
        <p>No valid AST generated. Correct formula syntax to view the syntax tree.</p>
      </div>
    );
  }

  const totalNodes = countASTNodes(result.ast);
  const maxDepth = getASTDepth(result.ast);

  return (
    <div className="h-full flex flex-col select-none">
      <div className="h-12 bg-bg-surface border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-cyan">
          <Network className="w-4 h-4" />
          <h3 className="text-xs font-bold text-text-primary">Phase 04: Abstract Syntax Tree (AST)</h3>
          <span className="text-[11px] font-mono text-text-muted">
            ({totalNodes} nodes, depth={maxDepth})
          </span>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-[10px] font-mono">
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" /> Function</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1" /> Operator</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan mr-1" /> CellRef</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1" /> Range</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Literal</span>
        </div>
      </div>

      <div className="flex-1 relative bg-bg-dark">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ animated: true }}
        >
          <Background color="#1F293D" gap={18} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#6366F1"
            maskColor="rgba(11, 16, 32, 0.75)"
            className="!bg-bg-surface !border !border-border !rounded-lg"
          />
        </ReactFlow>

        {selectedASTNode && (
          <div className="absolute top-3 right-3 w-72 p-3 rounded-xl bg-bg-surface/95 backdrop-blur border border-border shadow-card text-xs space-y-2 z-20">
            <div className="flex items-center justify-between border-b border-border/80 pb-1.5">
              <span className="font-bold text-primary-light font-mono">AST Node Details</span>
              <button
                onClick={() => setSelectedASTNode(null)}
                className="text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div><span className="text-text-muted">Type:</span> <span className="text-cyan-light font-bold">{selectedASTNode.type}</span></div>
              <div><span className="text-text-muted">Node ID:</span> {selectedASTNode.id}</div>
              <div>
                <span className="text-text-muted">Span:</span> [{selectedASTNode.position?.start} - {selectedASTNode.position?.end}]
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
