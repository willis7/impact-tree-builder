import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Save,
  Download,
  Upload,
  HelpCircle,
  Plus,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ImpactCanvas } from "./ImpactCanvas";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import type { ImpactTree, Node, Relationship, Measurement } from "@/types";
import { sampleData } from "@/data/sampleData";

/**
 * Main Impact Tree application component
 *
 * Manages the complete state and interactions for the impact tree visualization:
 * - Tree metadata (name, description, dates)
 * - Nodes (metrics and initiatives) with positions and properties
 * - Relationships (links between nodes showing impact flow)
 * - Measurements (data points tracking node performance)
 * - Canvas view controls (zoom, pan, center)
 * - Interaction modes (select, add nodes, create relationships)
 * - File operations (save, load, export)
 *
 * The component coordinates three main sections:
 * 1. Sidebar - tree info, node tools, relationship tools, statistics
 * 2. Canvas - visual representation and interaction area
 * 3. Properties Panel - detailed editing of selected items
 *
 * @returns The complete impact tree application UI
 */
export function ImpactTreeApp() {
  const [tree, setTree] = useState<ImpactTree>(sampleData.tree);
  const [nodes, setNodes] = useState<Map<string, Node>>(
    new Map(sampleData.nodes.map((n) => [n.id, n]))
  );
  const [relationships, setRelationships] = useState<Map<string, Relationship>>(
    new Map(sampleData.relationships.map((r) => [r.id, r]))
  );
  const [measurements, setMeasurements] = useState<Map<string, Measurement>>(
    new Map(sampleData.measurements.map((m) => [m.id, m]))
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);
  const [mode, setMode] = useState<"select" | "add-node" | "connect">("select");
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    scale: 1,
  });

  /**
   * Adjusts the canvas zoom level
   * @param factor - Multiplier for the current scale (e.g., 1.2 to zoom in, 0.8 to zoom out)
   */
  const handleZoom = (factor: number) => {
    setViewBox((prev) => ({
      ...prev,
      scale: prev.scale * factor,
    }));
  };

  /**
   * Resets the canvas view to default position and zoom
   */
  const handleResetView = () => {
    setViewBox({ x: 0, y: 0, width: 1200, height: 800, scale: 1 });
  };

  /**
   * Centers the view on all nodes in the tree
   * Calculates the bounding box of all nodes and centers the viewBox
   */
  const handleCenterView = () => {
    if (nodes.size === 0) return;

    const nodeArray = Array.from(nodes.values());
    const minX = Math.min(...nodeArray.map((n) => n.position_x));
    const maxX = Math.max(...nodeArray.map((n) => n.position_x));
    const minY = Math.min(...nodeArray.map((n) => n.position_y));
    const maxY = Math.max(...nodeArray.map((n) => n.position_y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setViewBox((prev) => ({
      ...prev,
      x: centerX - prev.width / 2,
      y: centerY - prev.height / 2,
    }));
  };

  /**
   * Saves the current tree state to localStorage
   * Includes tree metadata, nodes, relationships, and measurements
   */
  const handleSave = () => {
    const data = {
      tree,
      nodes: Array.from(nodes.values()),
      relationships: Array.from(relationships.values()),
      measurements: Array.from(measurements.values()),
    };
    localStorage.setItem("impactTreeData", JSON.stringify(data));
    alert("Tree saved!");
  };

  /**
   * Exports the tree as a JSON file
   * Downloads a file containing all tree data for backup or sharing
   */
  const handleExport = () => {
    const data = {
      tree,
      nodes: Array.from(nodes.values()),
      relationships: Array.from(relationships.values()),
      measurements: Array.from(measurements.values()),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${tree.name.replace(/\s+/g, "_")}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * Adds a new node to the tree at the specified canvas coordinates
   * Automatically assigns color and shape based on node type
   * @param x - Canvas X coordinate for node position
   * @param y - Canvas Y coordinate for node position
   */
  const handleAddNode = (x: number, y: number) => {
    if (!selectedNodeType) return;

    const nodeId = "node_" + Date.now();
    let color, shape, level;

    switch (selectedNodeType) {
      case "business_metric":
        color = "#2E7D32";
        shape = "rectangle" as const;
        level = 1;
        break;
      case "product_metric":
        color = "#1976D2";
        shape = "rectangle" as const;
        level = 2;
        break;
      case "initiative_positive":
        color = "#FF6F00";
        shape = "ellipse" as const;
        level = 3;
        break;
      case "initiative_negative":
        color = "#D32F2F";
        shape = "ellipse" as const;
        level = 3;
        break;
      default:
        color = "#1976D2";
        shape = "rectangle" as const;
        level = 2;
    }

    const newNode: Node = {
      id: nodeId,
      name: "New Node",
      description: "",
      node_type: selectedNodeType
        .replace("_positive", "")
        .replace("_negative", "") as Node["node_type"],
      level,
      position_x: x,
      position_y: y,
      color,
      shape,
    };

    setNodes(new Map(nodes.set(nodeId, newNode)));
    setSelectedNodeId(nodeId);
    setMode("select");
  };

  /**
   * Updates properties of an existing node
   * @param nodeId - ID of the node to update
   * @param updates - Partial node object with properties to update
   */
  const handleUpdateNode = (nodeId: string, updates: Partial<Node>) => {
    const node = nodes.get(nodeId);
    if (!node) return;

    const updatedNode = { ...node, ...updates };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
  };

  const handleDeleteNode = (nodeId: string) => {
    const newNodes = new Map(nodes);
    newNodes.delete(nodeId);
    setNodes(newNodes);

    // Delete related relationships
    const newRelationships = new Map(relationships);
    Array.from(newRelationships.entries()).forEach(([id, rel]) => {
      if (rel.source_node_id === nodeId || rel.target_node_id === nodeId) {
        newRelationships.delete(id);
      }
    });
    setRelationships(newRelationships);

    // Delete related measurements
    const newMeasurements = new Map(measurements);
    Array.from(newMeasurements.entries()).forEach(([id, meas]) => {
      if (meas.node_id === nodeId) {
        newMeasurements.delete(id);
      }
    });
    setMeasurements(newMeasurements);

    setSelectedNodeId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TooltipProvider>
        {/* Toolbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              Impact Tree Builder
              <Badge variant="secondary">v2.0</Badge>
            </h1>
            <span className="text-sm text-muted-foreground">
              Impact Intelligence Visualization
            </span>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNodes(new Map())}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create a new impact tree</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save current tree to file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Load
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load tree from file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export tree as JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show help and keyboard shortcuts</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-8" />

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            tree={tree}
            onTreeUpdate={setTree}
            mode={mode}
            onModeChange={setMode}
            selectedNodeType={selectedNodeType}
            onNodeTypeSelect={setSelectedNodeType}
            nodes={nodes}
            relationships={relationships}
          />

          {/* Canvas */}
          <main className="flex-1 relative bg-muted/20 border-x">
            <ImpactCanvas
              nodes={nodes}
              relationships={relationships}
              measurements={measurements}
              selectedNodeId={selectedNodeId}
              selectedRelationshipId={selectedRelationshipId}
              onNodeSelect={setSelectedNodeId}
              onRelationshipSelect={setSelectedRelationshipId}
              onNodeMove={handleUpdateNode}
              onAddNode={handleAddNode}
              mode={mode}
              viewBox={viewBox}
            />

            {/* Canvas Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleZoom(1.2)}
                className="shadow-lg"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleZoom(0.8)}
                className="shadow-lg"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleResetView}
                className="shadow-lg"
                aria-label="Reset view"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCenterView}
                className="shadow-lg"
                aria-label="Center view on all nodes"
              >
                <Move className="h-4 w-4" />
              </Button>
            </div>
          </main>

          {/* Right Panel */}
          <PropertiesPanel
            selectedNode={selectedNodeId ? nodes.get(selectedNodeId) : null}
            selectedRelationship={
              selectedRelationshipId
                ? relationships.get(selectedRelationshipId)
                : null
            }
            measurements={measurements}
            nodes={nodes}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onAddMeasurement={(measurement: Measurement) => {
              setMeasurements(
                new Map(measurements.set(measurement.id, measurement))
              );
            }}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}
