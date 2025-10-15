import { useRef, useState } from "react";
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
}: ImpactCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
  }>({ isDragging: false, nodeId: null, startX: 0, startY: 0 });

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x =
      (e.clientX - rect.left) * (viewBox.width / rect.width / viewBox.scale) +
      viewBox.x;
    const y =
      (e.clientY - rect.top) * (viewBox.height / rect.height / viewBox.scale) +
      viewBox.y;

    const target = e.target as SVGElement;
    const nodeElement = target.closest("[data-node-id]");
    const relElement = target.closest("[data-relationship-id]");

    if (mode === "add-node" && !nodeElement && !relElement) {
      onAddNode(x, y);
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
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.nodeId && svgRef.current) {
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
    }
  };

  const handleMouseUp = () => {
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
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / viewBox.scale} ${
          viewBox.height / viewBox.scale
        }`}
        onClick={handleCanvasClick}
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
        </g>

        {/* Nodes */}
        <g>
          {Array.from(nodes.values()).map((node) => {
            const hasPerformance = calculatePerformance(node.id);

            return (
              <g
                key={node.id}
                data-node-id={node.id}
                transform={`translate(${node.position_x}, ${node.position_y})`}
                className="cursor-pointer transition-all"
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
                        : "#fff"
                    }
                    strokeWidth={selectedNodeId === node.id ? 3 : 1}
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
                        : "#fff"
                    }
                    strokeWidth={selectedNodeId === node.id ? 3 : 1}
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
