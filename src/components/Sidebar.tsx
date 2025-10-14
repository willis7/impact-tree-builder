import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import type { ImpactTree, Node, Relationship } from "@/types";

interface SidebarProps {
  tree: ImpactTree;
  onTreeUpdate: (tree: ImpactTree) => void;
  mode: "select" | "add-node" | "connect";
  onModeChange: (mode: "select" | "add-node" | "connect") => void;
  selectedNodeType: string | null;
  onNodeTypeSelect: (type: string) => void;
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
}

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
  const handleNodeTypeClick = (type: string) => {
    onNodeTypeSelect(type);
    onModeChange("add-node");
  };

  const measuredNodes = new Set();

  return (
    <aside className="w-80 border-r bg-card flex flex-col h-full overflow-y-auto">
      {/* Tree Information */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Tree Information</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="treeName" className="text-xs">
              Name
            </Label>
            <Input
              id="treeName"
              value={tree.name}
              onChange={(e) => onTreeUpdate({ ...tree, name: e.target.value })}
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
                onTreeUpdate({ ...tree, description: e.target.value })
              }
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Add Nodes */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Add Nodes</h3>
        <div className="space-y-2">
          <Button
            variant={
              mode === "add-node" && selectedNodeType === "business_metric"
                ? "default"
                : "outline"
            }
            className="w-full justify-start"
            onClick={() => handleNodeTypeClick("business_metric")}
          >
            <div className="w-6 h-4 rounded bg-[#2E7D32] mr-3" />
            Business Metric
          </Button>
          <Button
            variant={
              mode === "add-node" && selectedNodeType === "product_metric"
                ? "default"
                : "outline"
            }
            className="w-full justify-start"
            onClick={() => handleNodeTypeClick("product_metric")}
          >
            <div className="w-6 h-4 rounded bg-[#1976D2] mr-3" />
            Product Metric
          </Button>
          <Button
            variant={
              mode === "add-node" && selectedNodeType === "initiative_positive"
                ? "default"
                : "outline"
            }
            className="w-full justify-start"
            onClick={() => handleNodeTypeClick("initiative_positive")}
          >
            <div className="w-6 h-4 rounded-full bg-[#FF6F00] mr-3" />
            Positive Initiative
          </Button>
          <Button
            variant={
              mode === "add-node" && selectedNodeType === "initiative_negative"
                ? "default"
                : "outline"
            }
            className="w-full justify-start"
            onClick={() => handleNodeTypeClick("initiative_negative")}
          >
            <div className="w-6 h-4 rounded-full bg-[#D32F2F] mr-3" />
            Negative Initiative
          </Button>
        </div>
      </div>

      {/* Relationship Tools */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Relationship Tools</h3>
        <Button
          variant={mode === "connect" ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onModeChange("connect")}
        >
          <Link2 className="h-4 w-4 mr-3" />
          Connect Nodes
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

      {/* Statistics */}
      <div className="p-4 flex-1">
        <h3 className="font-semibold mb-3">Statistics</h3>
        <div className="space-y-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Nodes
                </span>
                <span className="font-bold text-lg text-primary">
                  {nodes.size}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Relationships
                </span>
                <span className="font-bold text-lg text-primary">
                  {relationships.size}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Measured Nodes
                </span>
                <span className="font-bold text-lg text-primary">
                  {measuredNodes.size}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}
