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
import { Link2 } from "lucide-react";
import type { ImpactTree, Node, Relationship } from "@/types";
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
  /** Currently selected node type for adding (business_metric, product_metric, initiative) */
  selectedNodeType: string | null;
  /** Callback when a node type is selected */
  onNodeTypeSelect: (type: string) => void;
  /** Map of all nodes in the tree by ID */
  nodes: Map<string, Node>;
  /** Map of all relationships in the tree by ID */
  relationships: Map<string, Relationship>;
}

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
}: SidebarProps) {
  /**
   * Handles node type button clicks
   * Activates add-node mode with the selected type
   * @param type - The node type identifier (business_metric, product_metric, initiative)
   */
  const handleNodeTypeClick = (type: string) => {
    onNodeTypeSelect(type);
    onModeChange("add-node");
  };

  // Track which nodes have measurements for statistics
  const measuredNodes = new Set();

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      mode === "add-node" &&
                      selectedNodeType === "business_metric"
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() => handleNodeTypeClick("business_metric")}
                  >
                    <div className="w-6 h-4 rounded bg-[#2E7D32] mr-3" />
                    Business Metric
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a business outcome or goal metric</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      mode === "add-node" &&
                      selectedNodeType === "product_metric"
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() => handleNodeTypeClick("product_metric")}
                  >
                    <div className="w-6 h-4 rounded bg-[#1976D2] mr-3" />
                    Product Metric
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a product or feature metric</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      mode === "add-node" &&
                      selectedNodeType === "initiative_positive"
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() => handleNodeTypeClick("initiative_positive")}
                  >
                    <div className="w-6 h-4 rounded-full bg-[#FF6F00] mr-3" />
                    Positive Initiative
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add an initiative with positive impact</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      mode === "add-node" &&
                      selectedNodeType === "initiative_negative"
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() => handleNodeTypeClick("initiative_negative")}
                  >
                    <div className="w-6 h-4 rounded-full bg-[#D32F2F] mr-3" />
                    Negative Initiative
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add an initiative with negative impact</p>
                </TooltipContent>
              </Tooltip>
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
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="relationshipType"
                  value="desirable_effect"
                  defaultChecked
                />
                <label>Desirable Effect</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="relationshipType"
                  value="undesirable_effect"
                />
                <label>Undesirable Effect</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="relationshipType" value="rollup" />
                <label>Rollup</label>
              </div>
            </div>
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
