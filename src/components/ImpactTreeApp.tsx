import { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useImpactTreeState } from "@/hooks/useImpactTreeState";
import { useDragNode } from "@/hooks/useDragNode";
import { useCanvasAutoPan } from "@/hooks/useCanvasAutoPan";
import { useNodeOperations } from "@/hooks/useNodeOperations";
import { useCanvasOperations } from "@/hooks/useCanvasOperations";
import { useDragOperations } from "@/hooks/useDragOperations";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HelpDialog } from "./HelpDialog";
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
import { ThemeToggle } from "./theme-toggle";
import { ImpactCanvas } from "./ImpactCanvas";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import type { Measurement } from "@/types";
import type { NodeType } from "@/types/drag";
import { getNodeTypeLabel } from "@/lib/node-utils";

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
  // Centralized state management hook
  const { state, actions, operations } = useImpactTreeState();
  const {
    tree,
    nodes,
    relationships,
    measurements,
    selectedNodeId,
    selectedRelationshipId,
    mode,
    selectedNodeType,
    connectSourceNodeId,
    viewBox,
  } = state;
  const {
    setTree,
    setNodes,
    setRelationships,
    setMeasurements,
    setSelectedNodeId,
    setSelectedRelationshipId,
    setMode,
    setSelectedNodeType,
    setConnectSourceNodeId,
    setViewBox,
  } = actions;

  // UI-specific state (stays in component)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [canvasElement, setCanvasElement] = useState<SVGSVGElement | null>(null);

  // Track real-time mouse position for accurate drop coordinates
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track the last processed drag event to prevent duplicates
  const lastDragIdRef = useRef<string | null>(null);

  // Track when last drag ended to prevent click events from firing immediately after
  const lastDragEndTimeRef = useRef<number>(0);

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

   // Memoized pan handler to prevent unnecessary re-renders
   // Defined before useCanvasAutoPan which depends on it
   const handlePan = useCallback((deltaX: number, deltaY: number) => {
     setViewBox((prev) => ({
       ...prev,
       x: prev.x + deltaX,
       y: prev.y + deltaY,
     }));
   }, [setViewBox]);

   // Auto-pan when dragging near viewport edges
   useCanvasAutoPan({
     canvasElement,
     isDragging: dragState.isDragging,
     cursorPositionRef: mousePositionRef,
     viewBox,
     onPan: handlePan,
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

  // Memoized add measurement handler
  const handleAddMeasurement = useCallback((measurement: Measurement) => {
    setMeasurements(
      new Map(measurements.set(measurement.id, measurement))
    );
  }, [measurements, setMeasurements]);













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
                     onClick={operations.handleNewTree}
                   >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a new impact tree</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={operations.handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save current tree to file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={operations.handleImport}>
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
                   <DropdownMenuItem onClick={operations.handleExportJSON}>
                     <Download className="h-4 w-4 mr-2" />
                     Export as JSON
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => operations.handleExportPNG(canvasElement)}>
                     <Download className="h-4 w-4 mr-2" />
                     Export as PNG
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={operations.handleExportHTML}>
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

              <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />

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
                 onPan={handlePan}
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
               onAddMeasurement={handleAddMeasurement}
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
        ref={operations.fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={operations.handleFileSelect}
        style={{ display: 'none' }}
      />
    </DndContext>
  );
}
