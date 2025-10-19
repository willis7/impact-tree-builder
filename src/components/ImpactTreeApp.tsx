import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useDragNode } from "@/hooks/useDragNode";
import { useCanvasAutoPan } from "@/hooks/useCanvasAutoPan";
import { useNodeOperations } from "@/hooks/useNodeOperations";
import { useCanvasOperations } from "@/hooks/useCanvasOperations";
import { useDragOperations } from "@/hooks/useDragOperations";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
} from "lucide-react";
import { exportAsJSON, exportAsPNG, exportAsHTML } from "@/lib/export-utils";
import { validateImportedData } from "@/lib/validation-utils";
import { ThemeToggle } from "./theme-toggle";
import { ImpactCanvas } from "./ImpactCanvas";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import type { ImpactTree, Node, Relationship, Measurement } from "@/types";
import type { NodeType } from "@/types/drag";
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
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(
    null
  );
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    scale: 1,
  });

  // Canvas ref for coordinate transformation
  const [canvasElement, setCanvasElement] = useState<SVGSVGElement | null>(
    null
  );



  // Track real-time mouse position for accurate drop coordinates
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track the last processed drag event to prevent duplicates
  const lastDragIdRef = useRef<string | null>(null);

  // Track when last drag ended to prevent click events from firing immediately after
  const lastDragEndTimeRef = useRef<number>(0);

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Creates a new tree with current date and default metadata
   */
  const createNewTree = (): ImpactTree => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    return {
      id: `tree_${Date.now()}`,
      name: "New Impact Tree",
      description: "A new impact analysis tree",
      created_date: dateString,
      updated_date: dateString,
      owner: "User",
    };
  };

  /**
   * Creates a completely new tree, resetting all state
   */
  const handleNewTree = () => {
    setTree(createNewTree());
    setNodes(new Map());
    setRelationships(new Map());
    setMeasurements(new Map());
    setSelectedNodeId(null);
    setSelectedRelationshipId(null);
    setMode("select");
    setSelectedNodeType(null);
    setConnectSourceNodeId(null);
    setViewBox({ x: 0, y: 0, width: 1200, height: 800, scale: 1 });
  };

  // Update mouse position on every move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

   // Node operations hook
   const nodeOperations = useNodeOperations(
     {
       nodes,
       relationships,
       measurements,
       selectedNodeId,
       mode,
       selectedNodeType,
       connectSourceNodeId,
     },
     {
       setNodes,
       setRelationships,
       setMeasurements,
       setSelectedNodeId,
       setMode,
       setSelectedNodeType,
       setConnectSourceNodeId,
     }
   );

   // Drag-and-drop hook for node creation
   const { dragState, startDrag, endDrag, cancelDrag } = useDragNode({
     onNodeCreate: (nodeType, position) => {
       // Pass nodeType directly to handleAddNode to avoid async setState issues
       nodeOperations.addNode(position.x, position.y, nodeType);
     },
   });

   // Canvas operations hook
   const canvasOperations = useCanvasOperations(
     { viewBox, nodes },
     { setViewBox }
   );

   // Drag operations hook
   const dragOperations = useDragOperations(
     { viewBox, dragState },
     {
       startDrag,
       endDrag,
       cancelDrag,
       setLastDragEndTime: (time: number) => {
         lastDragEndTimeRef.current = time;
       },
     },
     canvasElement,
     mousePositionRef,
     lastDragIdRef
   );

   // Auto-pan when dragging near viewport edges
   useCanvasAutoPan({
     canvasElement,
     isDragging: dragState.isDragging,
     cursorPositionRef: mousePositionRef,
     viewBox,
     onPan: (deltaX, deltaY) => {
       setViewBox((prev) => ({
         ...prev,
         x: prev.x + deltaX,
         y: prev.y + deltaY,
       }));
     },
   });

   // Keyboard navigation hook
   useKeyboardNavigation(
     { mode, dragState },
     {
       cancelDrag,
       setMode,
       setSelectedNodeType,
       setConnectSourceNodeId,
       setHelpDialogOpen,
     }
   );

  // Configure drag sensors for @dnd-kit
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Require 5px movement to activate drag
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, keyboardSensor);



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
   */
  const handleExportJSON = () => {
    exportAsJSON(tree, nodes, relationships, measurements);
  };

  /**
   * Exports the tree visualization as a PNG image
   */
  const handleExportPNG = async () => {
    try {
      await exportAsPNG(tree, canvasElement);
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Failed to export as PNG. Please try again.');
    }
  };

  /**
   * Exports the tree as an HTML page
   */
  const handleExportHTML = () => {
    exportAsHTML(tree, nodes, relationships, measurements);
  };

  /**
   * Triggers file picker for importing JSON data
   */
  const handleImport = () => {
    fileInputRef.current?.click();
  };



  /**
   * Processes the selected file and imports the tree data
   * @param event - File input change event
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please select a valid JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the data
        const validation = validateImportedData(data);
        if (!validation.isValid) {
          alert(`Import failed:\n${validation.errors.join('\n')}`);
          return;
        }

        // Import the data
        setTree(data.tree);
        setNodes(new Map(data.nodes.map((n: Node) => [n.id, n])));
        setRelationships(new Map(data.relationships.map((r: Relationship) => [r.id, r])));
        setMeasurements(new Map(data.measurements.map((m: Measurement) => [m.id, m])));

        // Reset UI state
        setSelectedNodeId(null);
        setSelectedRelationshipId(null);
        setMode('select');
        setSelectedNodeType(null);
        setConnectSourceNodeId(null);
        setViewBox({ x: 0, y: 0, width: 1200, height: 800, scale: 1 });

        alert('Tree imported successfully!');
      } catch (error) {
        alert(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      alert('Failed to read the file');
    };

    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };













  /**
   * Gets the display label for a node type
   */
  const getNodeTypeLabel = (nodeType: NodeType): string => {
    switch (nodeType) {
      case "business_metric":
        return "Business Metric";
      case "product_metric":
        return "Product Metric";
      case "initiative_positive":
        return "Initiative +";
      case "initiative_negative":
        return "Initiative -";
      default:
        return nodeType;
    }
  };

  /**
   * Gets the variant for a node type badge
   */
  const getNodeTypeVariant = (
    nodeType: NodeType
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (nodeType) {
      case "business_metric":
        return "default";
      case "product_metric":
        return "secondary";
      case "initiative_positive":
        return "outline";
      case "initiative_negative":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={dragOperations.handleDragStart}
      onDragEnd={dragOperations.handleDragEnd}
      onDragCancel={dragOperations.handleDragCancel}
    >
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
                     onClick={handleNewTree}
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
                  <Button variant="outline" size="sm" onClick={handleImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load tree from file</TooltipContent>
              </Tooltip>

               <DropdownMenu>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="sm">
                         <Download className="h-4 w-4 mr-2" />
                         Export
                         <ChevronDown className="h-3 w-3 ml-1" />
                       </Button>
                     </DropdownMenuTrigger>
                   </TooltipTrigger>
                   <TooltipContent>Export tree in different formats</TooltipContent>
                 </Tooltip>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={handleExportJSON}>
                     <Download className="h-4 w-4 mr-2" />
                     Export as JSON
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={handleExportPNG}>
                     <Download className="h-4 w-4 mr-2" />
                     Export as PNG
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={handleExportHTML}>
                     <Download className="h-4 w-4 mr-2" />
                     Export as HTML
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHelpDialogOpen(true)}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Show help and keyboard shortcuts (F1)
                </TooltipContent>
              </Tooltip>

              <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>

                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Impact Tree Builder Help
                    </DialogTitle>
                    <DialogDescription>
                      Learn how to use the Impact Tree Builder to create and analyze impact networks.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Getting Started */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          The Impact Tree Builder helps you create visual impact networks to analyze cause-and-effect relationships
                          in your projects and initiatives. Impact trees show how different factors (initiatives, metrics, and outcomes)
                          are connected and influence each other.
                        </p>
                        <p>
                          <strong>Key Concepts:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Business Metrics</strong> (green rectangles): Top-level outcomes you want to achieve</li>
                          <li><strong>Product Metrics</strong> (blue rectangles): Measurable indicators of progress</li>
                          <li><strong>Initiatives</strong> (orange ellipses): Actions, projects, or changes you can implement</li>
                          <li><strong>Relationships</strong>: Arrows showing how elements influence each other</li>
                          <li><strong>Measurements</strong>: Data points tracking actual vs. expected performance</li>
                        </ul>
                      </div>
                    </section>

                    {/* Interface Overview */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Interface Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Toolbar (Top)</h4>
                          <ul className="space-y-1">
                            <li><strong>New:</strong> Clear the canvas for a new impact tree</li>
                            <li><strong>Save:</strong> Save current tree to browser storage</li>
                            <li><strong>Load:</strong> Import tree from JSON file</li>
                            <li><strong>Export:</strong> Download tree as JSON file</li>
                            <li><strong>Help:</strong> Show this help dialog</li>
                            <li><strong>Theme:</strong> Toggle between light and dark mode</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Main Areas</h4>
                          <ul className="space-y-1">
                            <li><strong>Sidebar (Left):</strong> Tree info, node creation tools</li>
                            <li><strong>Canvas (Center):</strong> Visual impact tree workspace</li>
                            <li><strong>Properties (Right):</strong> Edit selected items</li>
                            <li><strong>Canvas Controls:</strong> Zoom and pan the view</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Creating Content */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Creating Your Impact Tree</h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Adding Nodes</h4>
                          <p className="mb-2">Use the sidebar tools or keyboard shortcuts to add nodes:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Click and drag node type buttons from the sidebar to the canvas</li>
                            <li>Use keyboard shortcuts to select node types, then click on canvas</li>
                            <li>Edit node properties in the right panel after selection</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Creating Relationships</h4>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Enter "Connect" mode using the sidebar button or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd></li>
                            <li>Click on source node, then click on target node</li>
                            <li>Relationships are automatically typed based on node colors</li>
                            <li>Green arrows: desirable effects, Red arrows: undesirable effects</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Adding Measurements</h4>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Select a node in the canvas</li>
                            <li>Use the "Add Measurement" button in the properties panel</li>
                            <li>Enter metric name, expected/actual values, and dates</li>
                            <li>Choose impact type: proximate (direct) or downstream (indirect)</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Keyboard Shortcuts */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Node Creation</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Business Metric</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">B</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Product Metric</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">P</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Initiative (Positive)</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">I</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Initiative (Negative)</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">N</kbd>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Modes & Actions</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Select Mode</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">S</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Connect Mode</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Cancel/Exit Mode</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                            </div>
                            <div className="flex justify-between">
                              <span>Open Help</span>
                              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">F1</kbd>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Tips */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Tips & Best Practices</h3>
                      <div className="space-y-2 text-sm">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Start with business metrics (outcomes) at the top, then work downwards</li>
                          <li>Use consistent naming conventions for related nodes</li>
                          <li>Add measurements to track progress and validate your impact assumptions</li>
                          <li>Use different relationship types to show positive vs. negative impacts</li>
                          <li>Regularly save your work and export backups</li>
                          <li>Use the zoom and pan controls to navigate large impact trees</li>
                        </ul>
                      </div>
                    </section>
                  </div>
                </DialogContent>
              </Dialog>

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
              measurements={measurements}
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
                  onNodeMove={nodeOperations.updateNode}
                  onAddNode={nodeOperations.addNode}
                 mode={mode}
                 viewBox={viewBox}
                 onCanvasReady={setCanvasElement}
                  onNodeClickForConnect={nodeOperations.handleNodeClickForConnect}
                 connectSourceNodeId={connectSourceNodeId}
                 isDraggingNode={dragState.isDragging}
                 lastDragEndTime={lastDragEndTimeRef.current}
                  onCreateRelationship={nodeOperations.createRelationshipDirect}
                 onPan={(deltaX, deltaY) => {
                   setViewBox((prev) => ({
                     ...prev,
                     x: prev.x + deltaX,
                     y: prev.y + deltaY,
                   }));
                 }}
                  onZoom={canvasOperations.handleZoom}
               />

               {/* Canvas Controls */}
               <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                 <Button
                   variant="secondary"
                   size="icon"
                    onClick={() => canvasOperations.handleZoom(1.2)}
                   className="shadow-lg"
                   aria-label="Zoom in"
                 >
                   <ZoomIn className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="secondary"
                   size="icon"
                    onClick={() => canvasOperations.handleZoom(0.8)}
                   className="shadow-lg"
                   aria-label="Zoom out"
                 >
                   <ZoomOut className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="secondary"
                   size="icon"
                    onClick={canvasOperations.handleResetView}
                   className="shadow-lg"
                   aria-label="Reset view"
                 >
                   <Maximize2 className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="secondary"
                   size="icon"
                    onClick={canvasOperations.handleCenterView}
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
                onUpdateNode={nodeOperations.updateNode}
                onDeleteNode={nodeOperations.deleteNode}
               onAddMeasurement={(measurement: Measurement) => {
                 setMeasurements(
                   new Map(measurements.set(measurement.id, measurement))
                 );
               }}
             />
           </div>
         </TooltipProvider>
      </div>

      {/* Drag Overlay for node preview during drag */}
      <DragOverlay dropAnimation={null}>
        {dragState.isDragging && dragState.activeNodeType ? (
          <div className="opacity-70 cursor-grabbing animate-pulse">
            <Badge
              variant={getNodeTypeVariant(dragState.activeNodeType)}
              className="shadow-lg transition-transform duration-150"
            >
              {getNodeTypeLabel(dragState.activeNodeType)}
            </Badge>
          </div>
        ) : null}
      </DragOverlay>

      {/* Hidden file input for import functionality */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </DndContext>
  );
}
