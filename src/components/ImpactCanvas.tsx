import { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Node, Relationship, Measurement } from "@/types";

interface ImpactCanvasProps {
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
  selectedNodeId: string | null;
  selectedRelationshipId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onRelationshipSelect: (relId: string | null) => void;
  onNodeMove: (nodeId: string, updates: Partial<Node>) => void;
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
}

export function ImpactCanvas({
  nodes,
  relationships,
  measurements,
  selectedNodeId,
  selectedRelationshipId,
  onNodeSelect,
  onRelationshipSelect,
  onNodeMove,
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
}: ImpactCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Configure drop zone for @dnd-kit drag-and-drop
  const { setNodeRef } = useDroppable({
    id: "canvas-drop-zone",
  });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
  }>({ isDragging: false, nodeId: null, startX: 0, startY: 0 });

  // State for tracking relationship creation via drag
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

  // State for tracking canvas panning
  const [panState, setPanState] = useState<{
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({ isPanning: false, startX: 0, startY: 0 });

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    // Prevent click from firing if a node drag just completed
    // (drag drop triggers both drag end AND click, causing duplicates)
    if (isDraggingNode) return;

    // Prevent clicks within 150ms of drag ending (cooldown period)
    const timeSinceDragEnd = Date.now() - lastDragEndTime;
    if (timeSinceDragEnd < 150) {
      return;
    }

    // Try using SVG's native coordinate transformation
    let x, y;

    if (svgRef.current instanceof SVGSVGElement) {
      try {
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (ctm) {
          const svgPoint = pt.matrixTransform(ctm.inverse());
          x = svgPoint.x;
          y = svgPoint.y;
        }
      } catch {
        // SVG native transform failed, will use fallback
      }
    }

    // Fallback to manual calculation
    if (x === undefined || y === undefined) {
      const rect = svgRef.current.getBoundingClientRect();

      // The actual viewBox dimensions on the SVG (scaled)
      const actualViewBoxWidth = viewBox.width / viewBox.scale;
      const actualViewBoxHeight = viewBox.height / viewBox.scale;

      // Transform: screen -> normalized (0-1) -> viewBox coordinates
      const normalizedX = (e.clientX - rect.left) / rect.width;
      const normalizedY = (e.clientY - rect.top) / rect.height;

      x = viewBox.x + normalizedX * actualViewBoxWidth;
      y = viewBox.y + normalizedY * actualViewBoxHeight;
    }

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
    // Only allow panning in select mode and when not already dragging
    if (mode !== "select" || dragState.isDragging || connectDragState.isDragging) {
      return;
    }

    // Check if clicking on empty canvas (not on nodes or relationships)
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
      // Handle canvas panning
      const rect = svgRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - panState.startX) * (viewBox.width / rect.width / viewBox.scale);
      const deltaY = (e.clientY - panState.startY) * (viewBox.height / rect.height / viewBox.scale);

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
        onNodeMove(dragState.nodeId, {
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
      // Check if hovering over a node
      const target = e.target as SVGElement;
      const nodeElement = target.closest("[data-node-id]");
      const hoveredNodeId = nodeElement
        ? nodeElement.getAttribute("data-node-id")
        : null;

      // Update cursor position for connect mode drag
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
    // Reset pan state
    setPanState({ isPanning: false, startX: 0, startY: 0 });

    if (connectDragState.isDragging && connectDragState.sourceNodeId) {
      // Use hoveredNodeId from state which is more reliable than checking event target
      const targetNodeId = connectDragState.hoveredNodeId;

      if (
        targetNodeId &&
        targetNodeId !== connectDragState.sourceNodeId &&
        onCreateRelationship
      ) {
        // Create relationship directly via callback instead of using click handler
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const calculatePerformance = (nodeId: string) => {
    const nodeMeasurements = Array.from(measurements.values()).filter(
      (m) => m.node_id === nodeId
    );
    if (nodeMeasurements.length === 0) return null;

    const avgPerformance =
      nodeMeasurements.reduce((sum, meas) => {
        return sum + Math.abs(meas.actual_value / meas.expected_value);
      }, 0) / nodeMeasurements.length;

    return avgPerformance >= 0.8;
  };

  return (
    <div className="w-full h-full bg-muted/10 relative">
      {nodes.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-card p-8 rounded-lg border shadow-lg max-w-md">
            <p className="text-muted-foreground mb-2">
              👈 Select a node type from the left sidebar and click here to add
              it
            </p>
            <p className="text-sm text-muted-foreground">
              Click nodes to select them, drag to move, use toolbar to manage
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
        className={`w-full h-full transition-colors duration-150 ${
          panState.isPanning
            ? "cursor-grabbing"
            : mode === "connect" && connectDragState.isDragging
            ? "cursor-crosshair"
            : mode === "connect"
            ? "cursor-pointer"
            : mode === "add-node"
            ? "cursor-copy"
            : mode === "select"
            ? "cursor-grab"
            : "cursor-default"
        }`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / viewBox.scale} ${
          viewBox.height / viewBox.scale
        }`}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker
            id="arrowhead-green"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50" />
          </marker>
          <marker
            id="arrowhead-red"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#F44336" />
          </marker>
          <marker
            id="arrowhead-blue"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
          </marker>
        </defs>

        {/* Background */}
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width / viewBox.scale}
          height={viewBox.height / viewBox.scale}
          className="fill-muted/10"
        />

        {/* Grid pattern for better visual reference */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="stroke-muted/20"
            />
          </pattern>
        </defs>
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width / viewBox.scale}
          height={viewBox.height / viewBox.scale}
          fill="url(#grid)"
        />

        {/* Relationships */}
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

            return (
              <line
                key={rel.id}
                data-relationship-id={rel.id}
                x1={sourceNode.position_x}
                y1={sourceNode.position_y}
                x2={targetNode.position_x}
                y2={targetNode.position_y}
                stroke={rel.color}
                strokeWidth={selectedRelationshipId === rel.id ? 4 : 2}
                strokeDasharray={
                  selectedRelationshipId === rel.id ? "5,5" : "none"
                }
                markerEnd={markerEnd}
                className="cursor-pointer transition-all hover:opacity-80"
              />
            );
          })}

          {/* Preview line during connect drag */}
          {connectDragState.isDragging &&
            connectDragState.sourceNodeId &&
            svgRef.current &&
            (() => {
              const sourceNode = nodes.get(connectDragState.sourceNodeId);
              if (!sourceNode) return null;

              // If hovering over a target node, snap to its center
              let endX, endY;
              if (connectDragState.hoveredNodeId) {
                const targetNode = nodes.get(connectDragState.hoveredNodeId);
                if (targetNode) {
                  endX = targetNode.position_x;
                  endY = targetNode.position_y;
                }
              }

              // Otherwise, use cursor position
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

              return (
                <line
                  x1={sourceNode.position_x}
                  y1={sourceNode.position_y}
                  x2={endX}
                  y2={endY}
                  stroke={
                    connectDragState.hoveredNodeId ? "#4CAF50" : "#FF6F00"
                  }
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={0.6}
                  pointerEvents="none"
                />
              );
            })()}
        </g>

        {/* Nodes */}
        <g>
          {Array.from(nodes.values()).map((node) => {
            const hasPerformance = calculatePerformance(node.id);
            const isConnectSource =
              mode === "connect" && connectSourceNodeId === node.id;

            return (
              <g
                key={node.id}
                data-node-id={node.id}
                transform={`translate(${node.position_x}, ${node.position_y})`}
                className={`cursor-pointer ${
                  dragState.isDragging && dragState.nodeId === node.id
                    ? ""
                    : "transition-all duration-200"
                } ${
                  connectDragState.isDragging &&
                  connectDragState.hoveredNodeId === node.id
                    ? "animate-pulse"
                    : ""
                }`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
              >
                {node.shape === "ellipse" ? (
                  <ellipse
                    cx={0}
                    cy={0}
                    rx={60}
                    ry={35}
                    fill={node.color}
                    stroke={
                      selectedNodeId === node.id
                        ? "hsl(var(--primary))"
                        : isConnectSource
                        ? "#FF6F00"
                        : "#fff"
                    }
                    strokeWidth={
                      selectedNodeId === node.id || isConnectSource ? 3 : 1
                    }
                    className="transition-all hover:brightness-110"
                  />
                ) : (
                  <rect
                    x={-75}
                    y={-25}
                    width={150}
                    height={50}
                    rx={8}
                    fill={node.color}
                    stroke={
                      selectedNodeId === node.id
                        ? "hsl(var(--primary))"
                        : isConnectSource
                        ? "#FF6F00"
                        : "#fff"
                    }
                    strokeWidth={
                      selectedNodeId === node.id || isConnectSource ? 3 : 1
                    }
                    className="transition-all hover:brightness-110"
                  />
                )}

                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                  className="pointer-events-none select-none"
                  style={{ textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}
                >
                  {truncateText(node.name, 20)}
                </text>

                {hasPerformance !== null && (
                  <circle
                    cx={node.shape === "ellipse" ? 45 : 60}
                    cy={node.shape === "ellipse" ? -25 : -15}
                    r={4}
                    fill={hasPerformance ? "#4CAF50" : "#F44336"}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
