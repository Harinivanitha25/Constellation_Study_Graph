import React, { useState } from 'react';
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
  useInternalNode,
  Position,
} from '@xyflow/react';
import type { LinkType } from '../../data/types';

export interface ConstellationEdgeData {
  type: LinkType;
  score: number;
  reason?: string;
  sourceTopicId: string;
  targetTopicId: string;
  sourceTitle?: string;
  targetTitle?: string;
}

interface EdgeCoords {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

/**
 * Calculates the closest adjacent facing sides between two topics
 * so connection filaments dynamically attach to the most natural points
 * whenever either topic is moved around the constellation canvas.
 */
function getAdjacentEdgeParams(
  sourceNode: ReturnType<typeof useInternalNode>,
  targetNode: ReturnType<typeof useInternalNode>,
  defaults: EdgeCoords
): EdgeCoords {
  if (!sourceNode || !targetNode) {
    return defaults;
  }

  const sPos = sourceNode.internals?.positionAbsolute;
  const tPos = targetNode.internals?.positionAbsolute;
  if (!sPos || !tPos) {
    return defaults;
  }

  const sWidth = sourceNode.measured?.width ?? 220;
  const sHeight = sourceNode.measured?.height ?? 64;
  const tWidth = targetNode.measured?.width ?? 220;
  const tHeight = targetNode.measured?.height ?? 64;

  // The 4 compass connection points on source topic (Top, Bottom, Left, Right)
  const sPoints = [
    { x: sPos.x + sWidth / 2, y: sPos.y, position: Position.Top },
    { x: sPos.x + sWidth / 2, y: sPos.y + sHeight, position: Position.Bottom },
    { x: sPos.x, y: sPos.y + sHeight / 2, position: Position.Left },
    { x: sPos.x + sWidth, y: sPos.y + sHeight / 2, position: Position.Right },
  ];

  // The 4 compass connection points on target topic (Top, Bottom, Left, Right)
  const tPoints = [
    { x: tPos.x + tWidth / 2, y: tPos.y, position: Position.Top },
    { x: tPos.x + tWidth / 2, y: tPos.y + tHeight, position: Position.Bottom },
    { x: tPos.x, y: tPos.y + tHeight / 2, position: Position.Left },
    { x: tPos.x + tWidth, y: tPos.y + tHeight / 2, position: Position.Right },
  ];

  // Pick the pair with shortest Euclidean distance between facing edges
  let minDistance = Infinity;
  let optimalSource = sPoints[0];
  let optimalTarget = tPoints[0];

  for (const s of sPoints) {
    for (const t of tPoints) {
      const dist = (s.x - t.x) ** 2 + (s.y - t.y) ** 2;
      if (dist < minDistance) {
        minDistance = dist;
        optimalSource = s;
        optimalTarget = t;
      }
    }
  }

  return {
    sourceX: optimalSource.x,
    sourceY: optimalSource.y,
    targetX: optimalTarget.x,
    targetY: optimalTarget.y,
    sourcePosition: optimalSource.position,
    targetPosition: optimalTarget.position,
  };
}

export const ConstellationEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX: defaultSourceX,
  sourceY: defaultSourceY,
  targetX: defaultTargetX,
  targetY: defaultTargetY,
  sourcePosition: defaultSourcePosition,
  targetPosition: defaultTargetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const edgeData = data as unknown as ConstellationEdgeData | undefined;
  const [isHovered, setIsHovered] = useState(false);

  // Subscribe to live node positions so links update dynamically when topics move
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Dynamically compute the closest adjacent sides between the two topics
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = getAdjacentEdgeParams(sourceNode, targetNode, {
    sourceX: defaultSourceX,
    sourceY: defaultSourceY,
    targetX: defaultTargetX,
    targetY: defaultTargetY,
    sourcePosition: defaultSourcePosition,
    targetPosition: defaultTargetPosition,
  });

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const linkType = edgeData?.type || 'auto';
  const score = edgeData?.score ?? 0.5;

  // Determine edge visual styling based on connection type
  let strokeColor = 'rgba(56, 189, 248, 0.4)'; // Cyan for auto
  let strokeDasharray: string | undefined = '4 4';
  let strokeWidth = 1.5;
  let filter = 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.3))';

  if (linkType === 'manual') {
    strokeColor = '#38bdf8'; // Electric luminous cyan
    strokeDasharray = undefined;
    strokeWidth = 2.5;
    filter = 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))';
  } else {
    // Auto links: faint dashed lines scaled by score
    const opacity = Math.min(0.8, Math.max(0.35, score));
    strokeColor = `rgba(56, 189, 248, ${opacity})`;
    strokeDasharray = '5 5';
    strokeWidth = 1.5;
  }

  return (
    <>
      {/* Invisible wider stroke for easy hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHovered ? '#67e8f9' : strokeColor,
          strokeWidth: isHovered ? strokeWidth + 1 : strokeWidth,
          strokeDasharray,
          filter: isHovered ? 'drop-shadow(0 0 8px rgba(103, 232, 249, 0.8))' : filter,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Subtle central dot for manual links (non-interactive, no hover tooltip) */}
      {linkType === 'manual' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="nodrag nopan"
          >
            <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] opacity-75" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
