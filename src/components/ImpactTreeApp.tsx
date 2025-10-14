import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ImpactCanvas } from "./ImpactCanvas";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import type { ImpactTree, Node, Relationship, Measurement } from "@/types";
import { sampleData } from "@/data/sampleData";

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

  const handleZoom = (factor: number) => {
    setViewBox((prev) => ({
      ...prev,
      scale: prev.scale * factor,
    }));
  };

  const handleResetView = () => {
    setViewBox({ x: 0, y: 0, width: 1200, height: 800, scale: 1 });
  };

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

  const handleSave = () => {
    const data = {
      tree,
      nodes: Array.from(nodes.values()),
      relationships: Array.from(relationships.values()),
      measurements: Array.from(measurements.values()),
    };
    localStorage.setItem("impactTreeData", JSON.stringify(data));
    alert("Tree saved successfully!");
  };

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
  };

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
      {/* Toolbar */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">
            Impact Tree Builder
          </h1>
          <span className="text-sm text-muted-foreground">
            Impact Intelligence Visualization
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNodes(new Map())}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
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
        <main className="flex-1 relative">
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
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleZoom(0.8)}
              className="shadow-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleResetView}
              className="shadow-lg"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleCenterView}
              className="shadow-lg"
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
    </div>
  );
}
