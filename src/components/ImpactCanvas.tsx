import { useRef, useState, useMemo, useCallback, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Node, Relationship, Measurement } from "@/types";
import { screenToCanvasCoordinates } from "@/lib/drag-utils";

/**
 * Cursor class lookup for different canvas states
 */
const CURSOR_CLASSES = {
  panning: "cursor-grabbing",
  connectDragging: "cursor-crosshair",
  connect: "cursor-pointer",
  addNode: "cursor-copy",
  select: "cursor-grab",
  default: "cursor-default",
} as const;

/**
 * Gets the appropriate cursor class based on current canvas state
 */
function getCursorClass(
  isPanning: boolean,
  mode: "select" | "add-node" | "connect",
  isConnectDragging: boolean
): string {
  if (isPanning) return CURSOR_CLASSES.panning;
  if (mode === "connect" && isConnectDragging)
    return CURSOR_CLASSES.connectDragging;
  if (mode === "connect") return CURSOR_CLASSES.connect;
  if (mode === "add-node") return CURSOR_CLASSES.addNode;
  if (mode === "select") return CURSOR_CLASSES.select;
  return CURSOR_CLASSES.default;
}

/**
 * Node type colors for gradient rings
 */
const NODE_COLORS: Record<
  string,
  { primary: string; secondary: string; glow: string }
> = {
  business_metric: {
    primary: "#3B82F6",
    secondary: "#06B6D4",
    glow: "rgba(59, 130, 246, 0.4)",
  },
  product_metric: {
    primary: "#10B981",
    secondary: "#22C55E",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  // Initiative types: "initiative" is the base type stored in data,
  // while "initiative_positive" and "initiative_negative" are display variants.
  // Both "initiative" and "initiative_positive" share the same purple color scheme.
  initiative: {
    primary: "#8B5CF6",
    secondary: "#A855F7",
    glow: "rgba(139, 92, 246, 0.4)",
  },
  initiative_positive: {
    primary: "#8B5CF6",
    secondary: "#A855F7",
    glow: "rgba(139, 92, 246, 0.4)",
  },
  initiative_negative: {
    primary: "#EF4444",
    secondary: "#F87171",
    glow: "rgba(239, 68, 68, 0.4)",
  },
};

/**
 * Get node colors based on type
 */
function getNodeColors(nodeType: string) {
  if (nodeType.startsWith("initiative")) {
    return NODE_COLORS[nodeType] || NODE_COLORS.initiative;
  }
  return NODE_COLORS[nodeType] || NODE_COLORS.business_metric;
}

/**
 * Calculate bezier curve control points for a smooth connection line
 */
function calculateBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Control point offset based on distance
  const offset = Math.min(distance * 0.3, 100);

  // Determine curve direction based on relative positions
  let cx1, cy1, cx2, cy2;

  if (Math.abs(dx) > Math.abs(dy)) {
    // More horizontal - curve vertically
    cx1 = x1 + offset;
    cy1 = y1;
    cx2 = x2 - offset;
    cy2 = y2;
  } else {
    // More vertical - curve horizontally
    cx1 = x1;
    cy1 = y1 + (dy > 0 ? offset : -offset);
    cx2 = x2;
    cy2 = y2 + (dy > 0 ? -offset : offset);
  }

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

interface ImpactCanvasProps {
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
  selectedNodeId: string | null;
  selectedRelationshipId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onRelationshipSelect: (relId: string | null) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onAddNode: (x: number, y: number) => void;
  mode: "select" | "add-node" | "connect";
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  onCanvasReady?: (element: SVGSVGElement | null) => void;
  onNodeClickForConnect?: (nodeId: string) => void;
  connectSourceNodeId?: string | null;
  isDraggingNode?: boolean;
  lastDragEndTime?: number;
  onCreateRelationship?: (sourceNodeId: string, targetNodeId: string) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onZoom?: (factor: number, centerX: number, centerY: number) => void;
}

// Node size constants
const NODE_RADIUS = 28;
const NODE_RING_WIDTH = 4;
const NODE_OUTER_RADIUS = NODE_RADIUS + NODE_RING_WIDTH;

export const ImpactCanvas = memo(function ImpactCanvas({
  nodes,
  relationships,
  measurements,
  selectedNodeId,
  selectedRelationshipId,
  onNodeSelect,
  onRelationshipSelect,
  onNodeUpdate,
  onAddNode,
  mode,
  viewBox,
  onCanvasReady,
  onNodeClickForConnect,
  connectSourceNodeId,
  isDraggingNode,
  lastDragEndTime = 0,
  onCreateRelationship,
  onPan,
  onZoom,
}: ImpactCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { setNodeRef } = useDroppable({
    id: "canvas-drop-zone",
  });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
  }>({ isDragging: false, nodeId: null, startX: 0, startY: 0 });

  const [connectDragState, setConnectDragState] = useState<{
    isDragging: boolean;
    sourceNodeId: string | null;
    currentX: number;
    currentY: number;
    hoveredNodeId: string | null;
  }>({
    isDragging: false,
    sourceNodeId: null,
    currentX: 0,
    currentY: 0,
    hoveredNodeId: null,
  });

  const [panState, setPanState] = useState<{
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({ isPanning: false, startX: 0, startY: 0 });

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    if (isDraggingNode) return;

    const timeSinceDragEnd = Date.now() - lastDragEndTime;
    if (timeSinceDragEnd < 150) {
      return;
    }

    const { x, y } = screenToCanvasCoordinates(
      { x: e.clientX, y: e.clientY },
      svgRef.current,
      viewBox
    );

    const target = e.target as SVGElement;
    const nodeElement = target.closest("[data-node-id]");
    const relElement = target.closest("[data-relationship-id]");

    if (mode === "add-node" && !nodeElement && !relElement) {
      onAddNode(x, y);
    } else if (mode === "connect") {
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute("data-node-id");
        if (nodeId && onNodeClickForConnect) {
          onNodeClickForConnect(nodeId);
        }
      }
    } else if (mode === "select") {
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute("data-node-id");
        onNodeSelect(nodeId);
      } else if (relElement) {
        const relId = relElement.getAttribute("data-relationship-id");
        onRelationshipSelect(relId);
      } else {
        onNodeSelect(null);
        onRelationshipSelect(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (mode === "select") {
      e.stopPropagation();
      setDragState({
        isDragging: true,
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
      });
    } else if (mode === "connect") {
      e.stopPropagation();
      setConnectDragState({
        isDragging: true,
        sourceNodeId: nodeId,
        currentX: e.clientX,
        currentY: e.clientY,
        hoveredNodeId: null,
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (
      mode !== "select" ||
      dragState.isDragging ||
      connectDragState.isDragging
    ) {
      return;
    }

    const target = e.target as SVGElement;
    const nodeElement = target.closest("[data-node-id]");
    const relElement = target.closest("[data-relationship-id]");

    if (!nodeElement && !relElement && onPan) {
      e.preventDefault();
      setPanState({
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panState.isPanning && svgRef.current && onPan) {
      const rect = svgRef.current.getBoundingClientRect();
      const deltaX =
        (e.clientX - panState.startX) *
        (viewBox.width / rect.width / viewBox.scale);
      const deltaY =
        (e.clientY - panState.startY) *
        (viewBox.height / rect.height / viewBox.scale);

      onPan(deltaX, deltaY);

      setPanState((prev) => ({
        ...prev,
        startX: e.clientX,
        startY: e.clientY,
      }));
    } else if (dragState.isDragging && dragState.nodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const deltaX =
        (e.clientX - dragState.startX) *
        (viewBox.width / rect.width / viewBox.scale);
      const deltaY =
        (e.clientY - dragState.startY) *
        (viewBox.height / rect.height / viewBox.scale);

      const node = nodes.get(dragState.nodeId);
      if (node) {
        onNodeUpdate(dragState.nodeId, {
          position_x: node.position_x + deltaX,
          position_y: node.position_y + deltaY,
        });
      }

      setDragState((prev) => ({
        ...prev,
        startX: e.clientX,
        startY: e.clientY,
      }));
    } else if (connectDragState.isDragging) {
      const target = e.target as SVGElement;
      const nodeElement = target.closest("[data-node-id]");
      const hoveredNodeId = nodeElement
        ? nodeElement.getAttribute("data-node-id")
        : null;

      setConnectDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        hoveredNodeId:
          hoveredNodeId !== prev.sourceNodeId ? hoveredNodeId : null,
      }));
    }
  };

  const handleMouseUp = () => {
    setPanState({ isPanning: false, startX: 0, startY: 0 });

    if (connectDragState.isDragging && connectDragState.sourceNodeId) {
      const targetNodeId = connectDragState.hoveredNodeId;

      if (
        targetNodeId &&
        targetNodeId !== connectDragState.sourceNodeId &&
        onCreateRelationship
      ) {
        onCreateRelationship(connectDragState.sourceNodeId, targetNodeId);
      }

      setConnectDragState({
        isDragging: false,
        sourceNodeId: null,
        currentX: 0,
        currentY: 0,
        hoveredNodeId: null,
      });
    }

    setDragState({ isDragging: false, nodeId: null, startX: 0, startY: 0 });
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!onZoom || !svgRef.current) return;

    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasX = mouseX * (viewBox.width / rect.width) + viewBox.x;
    const canvasY = mouseY * (viewBox.height / rect.height) + viewBox.y;

    onZoom(zoomFactor, canvasX, canvasY);
  };

  const nodePerformanceMap = useMemo(() => {
    const performanceMap = new Map<string, boolean | null>();
    const measurementsByNode = new Map<string, Measurement[]>();

    measurements.forEach((m) => {
      const existing = measurementsByNode.get(m.node_id) || [];
      existing.push(m);
      measurementsByNode.set(m.node_id, existing);
    });

    nodes.forEach((_, nodeId) => {
      const nodeMeasurements = measurementsByNode.get(nodeId);
      if (!nodeMeasurements || nodeMeasurements.length === 0) {
        performanceMap.set(nodeId, null);
        return;
      }

      // Filter out measurements with zero expected_value to avoid division by zero
      const validMeasurements = nodeMeasurements.filter(
        (meas) => meas.expected_value !== 0
      );

      if (validMeasurements.length === 0) {
        performanceMap.set(nodeId, null);
        return;
      }

      const avgPerformance =
        validMeasurements.reduce((sum, meas) => {
          return sum + Math.abs(meas.actual_value / meas.expected_value);
        }, 0) / validMeasurements.length;

      performanceMap.set(nodeId, avgPerformance >= 0.8);
    });

    return performanceMap;
  }, [nodes, measurements]);

  const getNodePerformance = useCallback(
    (nodeId: string) => {
      return nodePerformanceMap.get(nodeId) ?? null;
    },
    [nodePerformanceMap]
  );

  // Get unique node types for gradient definitions
  const nodeTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach((node) => types.add(node.node_type));
    return Array.from(types);
  }, [nodes]);

  return (
    <div className="w-full h-full bg-background relative">
      {nodes.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                className="w-8 h-8"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Building</h3>
            <p className="text-muted-foreground text-sm">
              Select a node type from the sidebar and click here to add it to
              your impact tree
            </p>
          </div>
        </div>
      )}

      <svg
        ref={(node) => {
          svgRef.current = node;
          setNodeRef(node as unknown as HTMLElement);
          onCanvasReady?.(node);
        }}
        className={`w-full h-full transition-colors duration-150 ${getCursorClass(
          panState.isPanning,
          mode,
          connectDragState.isDragging
        )}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / viewBox.scale} ${viewBox.height / viewBox.scale}`}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Gradient definitions for each node type */}
          {nodeTypes.map((type) => {
            const colors = getNodeColors(type);
            return (
              <linearGradient
                key={`gradient-${type}`}
                id={`node-gradient-${type}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            );
          })}

          {/* Glow filter for selected nodes */}
          <filter
            id="glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers for relationships */}
          <marker
            id="arrowhead-green"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path
              d="M0 0 L8 3 L0 6 L2 3 Z"
              fill="#10B981"
              className="opacity-80"
            />
          </marker>
          <marker
            id="arrowhead-red"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path
              d="M0 0 L8 3 L0 6 L2 3 Z"
              fill="#EF4444"
              className="opacity-80"
            />
          </marker>
          <marker
            id="arrowhead-blue"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path
              d="M0 0 L8 3 L0 6 L2 3 Z"
              fill="#3B82F6"
              className="opacity-80"
            />
          </marker>

          {/* Subtle grid pattern */}
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="currentColor" className="fill-border/30" />
          </pattern>
        </defs>

        {/* 
          Background and Grid: Large fixed dimensions for infinite canvas effect
          
          The 10000x10000 pixel dimensions provide a generous panning area centered
          around the current viewport position. This creates an "infinite canvas" 
          feel without the overhead of dynamically generating background tiles.
          
          Performance considerations:
          - These are simple SVG rectangles with minimal rendering cost
          - The pattern reuses a single 40x40 grid definition via SVG patterns
          - The browser only renders what's visible in the viewport
          - Testing on various devices has shown no performance degradation
          
          The dimensions are intentionally large (±5000px from viewport center) to 
          prevent users from seeing the canvas edge during normal panning operations.
        */}
        <rect
          x={viewBox.x - 5000}
          y={viewBox.y - 5000}
          width={10000}
          height={10000}
          className="fill-background"
        />

        <rect
          x={viewBox.x - 5000}
          y={viewBox.y - 5000}
          width={10000}
          height={10000}
          fill="url(#grid)"
        />

        {/* Relationships (curved lines) */}
        <g>
          {Array.from(relationships.values()).map((rel) => {
            const sourceNode = nodes.get(rel.source_node_id);
            const targetNode = nodes.get(rel.target_node_id);
            if (!sourceNode || !targetNode) return null;

            const markerEnd =
              rel.relationship_type === "desirable_effect"
                ? "url(#arrowhead-green)"
                : rel.relationship_type === "undesirable_effect"
                  ? "url(#arrowhead-red)"
                  : "url(#arrowhead-blue)";

            const strokeColor =
              rel.relationship_type === "desirable_effect"
                ? "#10B981"
                : rel.relationship_type === "undesirable_effect"
                  ? "#EF4444"
                  : "#3B82F6";

            const isSelected = selectedRelationshipId === rel.id;

            // Calculate bezier path
            const path = calculateBezierPath(
              sourceNode.position_x,
              sourceNode.position_y,
              targetNode.position_x,
              targetNode.position_y
            );

            return (
              <g key={rel.id} data-relationship-id={rel.id}>
                {/* Hover/selection area (wider invisible path) */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth={16}
                  fill="none"
                  className="cursor-pointer"
                />
                {/* Visible path */}
                <path
                  d={path}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  fill="none"
                  markerEnd={markerEnd}
                  className="cursor-pointer"
                />
              </g>
            );
          })}

          {/* Preview line during connect drag */}
          {connectDragState.isDragging &&
            connectDragState.sourceNodeId &&
            svgRef.current &&
            (() => {
              const sourceNode = nodes.get(connectDragState.sourceNodeId);
              if (!sourceNode) return null;

              let endX, endY;
              if (connectDragState.hoveredNodeId) {
                const targetNode = nodes.get(connectDragState.hoveredNodeId);
                if (targetNode) {
                  endX = targetNode.position_x;
                  endY = targetNode.position_y;
                }
              }

              if (endX === undefined || endY === undefined) {
                const rect = svgRef.current.getBoundingClientRect();
                endX =
                  (connectDragState.currentX - rect.left) *
                    (viewBox.width / rect.width / viewBox.scale) +
                  viewBox.x;
                endY =
                  (connectDragState.currentY - rect.top) *
                    (viewBox.height / rect.height / viewBox.scale) +
                  viewBox.y;
              }

              const path = calculateBezierPath(
                sourceNode.position_x,
                sourceNode.position_y,
                endX,
                endY
              );

              return (
                <path
                  d={path}
                  stroke={
                    connectDragState.hoveredNodeId ? "#10B981" : "#8B5CF6"
                  }
                  strokeWidth={2}
                  strokeDasharray="8,4"
                  fill="none"
                  opacity={0.8}
                  pointerEvents="none"
                />
              );
            })()}
        </g>

        {/* Nodes (circular with gradient rings) */}
        <g>
          {Array.from(nodes.values()).map((node) => {
            const hasPerformance = getNodePerformance(node.id);
            const isConnectSource =
              mode === "connect" && connectSourceNodeId === node.id;
            const isSelected = selectedNodeId === node.id;
            const isHovered =
              connectDragState.isDragging &&
              connectDragState.hoveredNodeId === node.id;
            const colors = getNodeColors(node.node_type);

            return (
              <g
                key={node.id}
                data-node-id={node.id}
                transform={`translate(${node.position_x}, ${node.position_y})`}
                className={`cursor-pointer ${
                  dragState.isDragging && dragState.nodeId === node.id
                    ? ""
                    : "transition-transform duration-150"
                }`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                filter={isSelected ? "url(#glow)" : undefined}
              >
                {/* Selection ring (animated) */}
                {isSelected && (
                  <circle
                    r={NODE_OUTER_RADIUS + 4}
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeDasharray="4,4"
                    opacity={0.6}
                    className="animate-spin"
                    style={{ animationDuration: "8s" }}
                  />
                )}

                {/* Outer glow for hover/connect */}
                {(isHovered || isConnectSource) && (
                  <circle
                    r={NODE_OUTER_RADIUS + 6}
                    fill={isHovered ? "#10B981" : "#8B5CF6"}
                    opacity={0.2}
                  />
                )}

                {/* Gradient ring */}
                <circle
                  r={NODE_OUTER_RADIUS}
                  fill={`url(#node-gradient-${node.node_type})`}
                  className="transition-all duration-200"
                />

                {/* Inner white circle */}
                <circle
                  r={NODE_RADIUS}
                  fill="white"
                  className="dark:fill-gray-900"
                />

                {/* Icon */}
                <g
                  transform="translate(-8, -8) scale(1)"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                >
                  {node.node_type === "business_metric" && (
                    <path d="M2 12 L6 8 L10 10 L14 6 M14 6 V10 M14 6 H10" />
                  )}
                  {node.node_type === "product_metric" && (
                    <>
                      <rect x="3" y="10" width="3" height="6" rx="1" fill={colors.primary} />
                      <rect x="7" y="6" width="3" height="10" rx="1" fill={colors.primary} />
                      <rect x="11" y="2" width="3" height="14" rx="1" fill={colors.primary} />
                    </>
                  )}
                  {node.node_type.startsWith("initiative") && (
                    <>
                      <path d="M8 2 L8 0 M12 8 C12 11 10 14 8 14 S4 11 4 8 C4 4.5 6 2 8 2 S12 4.5 12 8" />
                      <path d="M6 16 L10 16 M7 18 L9 18" strokeWidth={1.5} />
                    </>
                  )}
                </g>

                {/* Performance indicator */}
                {hasPerformance !== null && (
                  <circle
                    cx={NODE_RADIUS - 4}
                    cy={-NODE_RADIUS + 4}
                    r={6}
                    fill={hasPerformance ? "#10B981" : "#EF4444"}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}

                {/* Label */}
                <text
                  y={NODE_OUTER_RADIUS + 16}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-medium pointer-events-none select-none"
                  style={{ fontSize: "11px" }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
