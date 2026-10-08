import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnNodeDrag,
  type Viewport,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ConstellationNode } from './ConstellationNode';
import { ConstellationEdge } from './ConstellationEdge';
import { useConstellationStore } from '../../store/useConstellationStore';
import { computeGraphLinks } from '../../services/linkingService';
import type { Topic } from '../../data/types';
import { Sparkles, AlertCircle, Info } from 'lucide-react';

interface GraphViewProps {
  onEditTopic: (topic: Topic) => void;
}

const nodeTypes = {
  constellationNode: ConstellationNode,
};

const edgeTypes = {
  constellationEdge: ConstellationEdge,
};

export const GraphViewInner: React.FC<GraphViewProps> = ({ onEditTopic }) => {
  const {
    topics,
    storedLinks,
    similarityThreshold,
    showAutoLinks,
    updatePosition,
    addManualLink,
    hideLink,
    searchQuery,
    modelStatus,
    modelMessage,
    savedViewport,
    setSavedViewport,
  } = useConstellationStore();

  const reactFlowInstance = useReactFlow();

  // Search matching IDs
  const matchedTopicIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const t of topics) {
      if (
        t.title.toLowerCase().includes(q) ||
        (t.previewText && t.previewText.toLowerCase().includes(q)) ||
        (t.notesPlainText && t.notesPlainText.toLowerCase().includes(q))
      ) {
        ids.add(t.id);
      }
    }
    return ids;
  }, [topics, searchQuery]);

  // Center on searched node when search query changes
  useEffect(() => {
    if (searchQuery.trim() && matchedTopicIds.size > 0) {
      const firstMatchedId = Array.from(matchedTopicIds)[0];
      const targetTopic = topics.find((t) => t.id === firstMatchedId);
      if (targetTopic) {
        reactFlowInstance.setCenter(targetTopic.positionX + 100, targetTopic.positionY + 30, {
          zoom: 1.2,
          duration: 800,
        });
      }
    }
  }, [searchQuery, matchedTopicIds, topics, reactFlowInstance]);

  // Compute active links from stored links + semantic similarity
  const activeLinks = useMemo(() => {
    return computeGraphLinks({
      topics,
      storedLinks,
      similarityThreshold,
      useFallbackKeywordSimilarity: modelStatus === 'fallback' || modelStatus === 'error',
      showAutoLinks,
    });
  }, [topics, storedLinks, similarityThreshold, modelStatus, showAutoLinks]);

  // Transform topics to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return topics.map((topic) => ({
      id: topic.id,
      type: 'constellationNode',
      position: { x: topic.positionX, y: topic.positionY },
      data: {
        topic,
        onEditTopic,
        isSearchResult: matchedTopicIds.has(topic.id),
      },
    }));
  }, [topics, onEditTopic, matchedTopicIds]);

  // Transform activeLinks to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return activeLinks.map((link) => {
      const sourceTopic = topics.find((t) => t.id === link.sourceTopicId);
      const targetTopic = topics.find((t) => t.id === link.targetTopicId);

      return {
        id: link.id,
        source: link.sourceTopicId,
        target: link.targetTopicId,
        type: 'constellationEdge',
        data: {
          type: link.type,
          score: link.score,
          reason: link.reason,
          sourceTopicId: link.sourceTopicId,
          targetTopicId: link.targetTopicId,
          sourceTitle: sourceTopic?.title,
          targetTitle: targetTopic?.title,
        },
      };
    });
  }, [activeLinks, topics]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when topics or links update
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Save node position to IndexedDB when dragging stops
  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      updatePosition(node.id, node.position.x, node.position.y);
    },
    [updatePosition]
  );

  // Manual edge connection
  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        addManualLink(params.source, params.target);
      }
    },
    [addManualLink]
  );

  // Keyboard edge deletion (Backspace / Delete key)
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        if (edge.source && edge.target) {
          hideLink(edge.source, edge.target);
        }
      }
    },
    [hideLink]
  );

  // Track viewport changes (pan and zoom) so returning from topic pages stays at the exact position
  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      setSavedViewport(viewport);
    },
    [setSavedViewport]
  );

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden select-none">
      {/* Background Star Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgesDelete={handleEdgesDelete}
        onNodeDragStop={handleNodeDragStop}
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={savedViewport || undefined}
        fitView={!savedViewport}
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'constellationEdge' }}
        connectionMode={ConnectionMode.Loose}
        elevateNodesOnSelect={true}
        connectionLineStyle={{
          stroke: '#38bdf8',
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))',
        }}
        className="constellation-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1.2}
          color="rgba(56, 189, 248, 0.15)"
          className="bg-radial from-[#070e24] via-[#040816] to-[#02040a]"
        />

        <Controls
          className="!bg-slate-900/80 !border-slate-800 !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800"
          showInteractive={false}
        />

        <MiniMap
          nodeColor="#38bdf8"
          maskColor="rgba(2, 6, 23, 0.75)"
          className="!bg-slate-950/90 !border !border-slate-800/80 !rounded-xl !overflow-hidden hidden sm:block"
          style={{ width: 150, height: 100 }}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Fallback Notice if model failed or is using keyword fallback */}
      {(modelStatus === 'fallback' || modelStatus === 'error') && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/90 border border-amber-600/40 text-[11px] text-amber-200 shadow-lg backdrop-blur-md pointer-events-auto">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Keyword similarity fallback active: {modelMessage}</span>
        </div>
      )}
    </div>
  );
};

export const GraphView: React.FC<GraphViewProps> = (props) => {
  return <GraphViewInner {...props} />;
};
