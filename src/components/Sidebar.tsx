import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useCallback, memo } from "react";
import { Link2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { ImpactTree, Node, Relationship, Measurement } from "@/types";
import type { NodeType } from "@/types/drag";
import { sanitizeInput, sanitizeDescription } from "@/lib/sanitize";

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** The current impact tree data */
  tree: ImpactTree;
  /** Callback to update tree information (name, description) */
  onTreeUpdate: (tree: ImpactTree) => void;
  /** Current interaction mode: select (default), add-node, or connect (relationship) */
  mode: "select" | "add-node" | "connect";
  /** Callback to change the interaction mode */
  onModeChange: (mode: "select" | "add-node" | "connect") => void;
  /** Currently selected node type for adding */
  selectedNodeType: NodeType | null;
  /** Callback when a node type is selected */
  onNodeTypeSelect: (type: NodeType) => void;
  /** Map of all nodes in the tree by ID */
  nodes: Map<string, Node>;
  /** Map of all relationships in the tree by ID */
  relationships: Map<string, Relationship>;
  /** Map of all measurements in the tree by ID */
  measurements: Map<string, Measurement>;
}

/**
 * Props for the DraggableNodeButton component
 */
interface DraggableNodeButtonProps {
  /** Node type identifier */
  nodeType: NodeType;
  /** Display label for the button */
  label: string;
  /** Background color for the node type indicator */
  colorClass: string;
  /** Border radius class (rounded for rectangles, rounded-full for circles) */
  shapeClass: string;
  /** Tooltip description */
  tooltipText: string;
  /** Whether this button is currently selected */
  isSelected: boolean;
  /** Click handler for the button */
  onClick: () => void;
}

/**
 * Draggable node type button component
 * Supports both click-to-add and drag-to-add workflows (FR-014)
 * Wrapped with React.memo to prevent unnecessary re-renders
 *
 * @param props - Component props
 * @returns A draggable button element
 */
const DraggableNodeButton = memo(function DraggableNodeButton({
  nodeType,
  label,
  colorClass,
  shapeClass,
  tooltipText,
  isSelected,
  onClick,
}: DraggableNodeButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `node-type-${nodeType}`,
    data: {
      nodeType,
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={setNodeRef}
          variant={isSelected ? "default" : "outline"}
          className={`w-full justify-start transition-all duration-200 ${
            isDragging
              ? "opacity-50 cursor-grabbing"
              : "cursor-grab hover:scale-[1.02]"
          }`}
          onClick={onClick}
          {...listeners}
          {...attributes}
        >
          <div className={`w-6 h-4 ${shapeClass} ${colorClass} mr-3`} />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click or drag to canvas
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

/**
 * Sidebar component for impact tree management
 *
 * Provides controls for:
 * - Editing tree information (name and description)
 * - Adding nodes by type (Business Metric, Product Metric, Initiative)
 * - Managing relationships between nodes
 * - Viewing tree statistics (node counts, relationship counts, measurement coverage)
 *
 * All user inputs are sanitized to prevent XSS attacks using DOMPurify.
 *
 * @param props - Component props
 * @returns The sidebar UI element
 */
export function Sidebar({
  tree,
  onTreeUpdate,
  mode,
  onModeChange,
  selectedNodeType,
  onNodeTypeSelect,
  nodes,
  relationships,
  measurements,
}: SidebarProps) {
  /**
   * Handles node type button clicks
   * Activates add-node mode with the selected type
   * Memoized with useCallback to prevent child re-renders
   * @param type - The node type identifier
   */
  const handleNodeTypeClick = useCallback((type: NodeType) => {
    onNodeTypeSelect(type);
    onModeChange("add-node");
  }, [onNodeTypeSelect, onModeChange]);

  // Memoized click handlers for each node type to prevent re-renders
  const handleBusinessMetricClick = useCallback(() => handleNodeTypeClick("business_metric"), [handleNodeTypeClick]);
  const handleProductMetricClick = useCallback(() => handleNodeTypeClick("product_metric"), [handleNodeTypeClick]);
  const handlePositiveInitiativeClick = useCallback(() => handleNodeTypeClick("initiative_positive"), [handleNodeTypeClick]);
  const handleNegativeInitiativeClick = useCallback(() => handleNodeTypeClick("initiative_negative"), [handleNodeTypeClick]);

  // Track which nodes have measurements for statistics
  const measuredNodes = useMemo(() => {
    const nodeSet = new Set<string>();
    measurements.forEach(measurement => {
      nodeSet.add(measurement.node_id);
    });
    return nodeSet;
  }, [measurements]);

  return (
    <aside className="w-80 border-r bg-card flex flex-col h-full">
      <ScrollArea className="flex-1">
        <TooltipProvider>
          {/* Tree Information */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Tree Information</h3>
              <Badge variant="outline">{nodes.size} nodes</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="treeName" className="text-xs">
                  Name
                </Label>
                <Input
                  id="treeName"
                  value={tree.name}
                  onChange={(e) =>
                    onTreeUpdate({
                      ...tree,
                      name: sanitizeInput(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="treeDescription" className="text-xs">
                  Description
                </Label>
                <Textarea
                  id="treeDescription"
                  value={tree.description}
                  onChange={(e) =>
                    onTreeUpdate({
                      ...tree,
                      description: sanitizeDescription(e.target.value),
                    })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Add Nodes */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Add Nodes</h3>
            <div className="space-y-2">
              <DraggableNodeButton
                nodeType="business_metric"
                label="Business Metric"
                colorClass="bg-[#2E7D32]"
                shapeClass="rounded"
                tooltipText="Add a business outcome or goal metric"
                isSelected={
                  mode === "add-node" && selectedNodeType === "business_metric"
                }
                onClick={handleBusinessMetricClick}
              />

              <DraggableNodeButton
                nodeType="product_metric"
                label="Product Metric"
                colorClass="bg-[#1976D2]"
                shapeClass="rounded"
                tooltipText="Add a product or feature metric"
                isSelected={
                  mode === "add-node" && selectedNodeType === "product_metric"
                }
                onClick={handleProductMetricClick}
              />

              <DraggableNodeButton
                nodeType="initiative_positive"
                label="Positive Initiative"
                colorClass="bg-[#FF6F00]"
                shapeClass="rounded-full"
                tooltipText="Add an initiative with positive impact"
                isSelected={
                  mode === "add-node" &&
                  selectedNodeType === "initiative_positive"
                }
                onClick={handlePositiveInitiativeClick}
              />

              <DraggableNodeButton
                nodeType="initiative_negative"
                label="Negative Initiative"
                colorClass="bg-[#D32F2F]"
                shapeClass="rounded-full"
                tooltipText="Add an initiative with negative impact"
                isSelected={
                  mode === "add-node" &&
                  selectedNodeType === "initiative_negative"
                }
                onClick={handleNegativeInitiativeClick}
              />
            </div>
          </div>

          <Separator />

          {/* Relationship Tools */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Relationship Tools</h3>
            <Button
              variant={mode === "connect" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => onModeChange("connect")}
            >
              <Link2 className="h-4 w-4 mr-3" />
              Connect Nodes
              {mode === "connect" && (
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              )}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Click two nodes to connect them. Relationship type is determined automatically based on node types.
            </p>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Statistics</h3>
            <div className="space-y-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Nodes
                    </span>
                    <Badge variant="default">{nodes.size}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Relationships
                    </span>
                    <Badge variant="default">{relationships.size}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Measured Nodes
                    </span>
                    <Badge variant="default">{measuredNodes.size}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TooltipProvider>
      </ScrollArea>
    </aside>
  );
}
