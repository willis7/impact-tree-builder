import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDragNode } from "@/hooks/useDragNode";
import { useCanvasAutoPan } from "@/hooks/useCanvasAutoPan";
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

  // Track last created node to prevent exact duplicates
  const lastCreatedNodeRef = useRef<{
    x: number;
    y: number;
    type: string;
    timestamp: number;
  } | null>(null);

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update mouse position on every move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Drag-and-drop hook for node creation
  const { dragState, startDrag, endDrag, cancelDrag } = useDragNode({
    onNodeCreate: (nodeType, position) => {
      // Pass nodeType directly to handleAddNode to avoid async setState issues
      handleAddNode(position.x, position.y, nodeType);
    },
  });

  // Auto-pan when dragging near viewport edges
  useCanvasAutoPan({
    canvasElement,
    isDragging: dragState.isDragging,
    cursorPositionRef: mousePositionRef,
    onPan: (deltaX, deltaY) => {
      setViewBox((prev) => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    },
    viewBox,
  });

  // T109-T118: Keyboard shortcuts for node types and modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // T116: Escape key - cancel current operation
      if (e.key === "Escape") {
        if (dragState.isDragging) {
          cancelDrag();
        } else if (mode === "connect") {
          setMode("select");
          setConnectSourceNodeId(null);
        } else if (mode === "add-node") {
          setMode("select");
          setSelectedNodeType(null);
        }
        return;
      }

      // T110: 'b' key - Business Metric
      if (e.key === "b" || e.key === "B") {
        setSelectedNodeType("business_metric");
        setMode("add-node");
        e.preventDefault();
        return;
      }

      // T111: 'p' key - Product Metric
      if (e.key === "p" || e.key === "P") {
        setSelectedNodeType("product_metric");
        setMode("add-node");
        e.preventDefault();
        return;
      }

      // T112: 'i' key - Initiative (positive)
      if (e.key === "i" || e.key === "I") {
        setSelectedNodeType("initiative_positive");
        setMode("add-node");
        e.preventDefault();
        return;
      }

      // T113: 'n' key - Initiative (negative)
      if (e.key === "n" || e.key === "N") {
        setSelectedNodeType("initiative_negative");
        setMode("add-node");
        e.preventDefault();
        return;
      }

      // T117: 'c' key - Connect Nodes mode
      if (e.key === "c" || e.key === "C") {
        setMode("connect");
        setSelectedNodeType(null);
        e.preventDefault();
        return;
      }

      // T118: 's' key - Select mode
      if (e.key === "s" || e.key === "S") {
        setMode("select");
        setSelectedNodeType(null);
        setConnectSourceNodeId(null);
        e.preventDefault();
        return;
      }

      // F1 key - Open help dialog
      if (e.key === "F1") {
        setHelpDialogOpen(true);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dragState.isDragging, mode, cancelDrag, setHelpDialogOpen]);

  // Configure drag sensors for @dnd-kit
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Require 5px movement to activate drag
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, keyboardSensor);

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
   * Triggers file picker for importing JSON data
   */
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  /**
   * Validates imported tree data structure
   * @param data - The parsed JSON data to validate
   * @returns Validation result with errors if any
   */
  const validateImportedData = (data: unknown): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format: expected an object');
      return { isValid: false, errors };
    }

    const treeData = data as Record<string, unknown>;

    // Validate tree
    if (!treeData.tree || typeof treeData.tree !== 'object') {
      errors.push('Missing or invalid tree data');
    } else {
      const tree = treeData.tree as Record<string, unknown>;
      const requiredTreeFields = ['id', 'name', 'description', 'created_date', 'updated_date', 'owner'];
      requiredTreeFields.forEach(field => {
        if (!(field in tree)) {
          errors.push(`Tree missing required field: ${field}`);
        }
      });
    }

    // Validate nodes array
    if (!Array.isArray(treeData.nodes)) {
      errors.push('Missing or invalid nodes array');
    } else {
      treeData.nodes.forEach((node: unknown, index: number) => {
        if (typeof node !== 'object' || node === null) {
          errors.push(`Node ${index} is not a valid object`);
          return;
        }
        const nodeObj = node as Record<string, unknown>;
        const requiredNodeFields = ['id', 'name', 'description', 'node_type', 'level', 'position_x', 'position_y', 'color', 'shape'];
        requiredNodeFields.forEach(field => {
          if (!(field in nodeObj)) {
            errors.push(`Node ${index} missing required field: ${field}`);
          }
        });
        if (nodeObj.node_type && typeof nodeObj.node_type === 'string' && !['business_metric', 'product_metric', 'initiative'].includes(nodeObj.node_type)) {
          errors.push(`Node ${index} has invalid node_type: ${nodeObj.node_type}`);
        }
        if (nodeObj.shape && typeof nodeObj.shape === 'string' && !['rectangle', 'ellipse'].includes(nodeObj.shape)) {
          errors.push(`Node ${index} has invalid shape: ${nodeObj.shape}`);
        }
      });
    }

    // Validate relationships array
    if (!Array.isArray(treeData.relationships)) {
      errors.push('Missing or invalid relationships array');
    } else {
      treeData.relationships.forEach((rel: unknown, index: number) => {
        if (typeof rel !== 'object' || rel === null) {
          errors.push(`Relationship ${index} is not a valid object`);
          return;
        }
        const relObj = rel as Record<string, unknown>;
        const requiredRelFields = ['id', 'source_node_id', 'target_node_id', 'relationship_type', 'color', 'strength'];
        requiredRelFields.forEach(field => {
          if (!(field in relObj)) {
            errors.push(`Relationship ${index} missing required field: ${field}`);
          }
        });
        if (relObj.relationship_type && typeof relObj.relationship_type === 'string' && !['desirable_effect', 'undesirable_effect', 'rollup'].includes(relObj.relationship_type)) {
          errors.push(`Relationship ${index} has invalid relationship_type: ${relObj.relationship_type}`);
        }
      });
    }

    // Validate measurements array
    if (!Array.isArray(treeData.measurements)) {
      errors.push('Missing or invalid measurements array');
    } else {
      treeData.measurements.forEach((meas: unknown, index: number) => {
        if (typeof meas !== 'object' || meas === null) {
          errors.push(`Measurement ${index} is not a valid object`);
          return;
        }
        const measObj = meas as Record<string, unknown>;
        const requiredMeasFields = ['id', 'node_id', 'metric_name', 'expected_value', 'actual_value', 'measurement_date', 'impact_type'];
        requiredMeasFields.forEach(field => {
          if (!(field in measObj)) {
            errors.push(`Measurement ${index} missing required field: ${field}`);
          }
        });
        if (measObj.impact_type && typeof measObj.impact_type === 'string' && !['proximate', 'downstream'].includes(measObj.impact_type)) {
          errors.push(`Measurement ${index} has invalid impact_type: ${measObj.impact_type}`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
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
   * Adds a new node to the tree at the specified canvas coordinates
   * Automatically assigns color and shape based on node type
   * @param x - Canvas X coordinate for node position
   * @param y - Canvas Y coordinate for node position
   * @param nodeType - Optional node type to use (if not provided, uses selectedNodeType)
   */
  const handleAddNode = (x: number, y: number, nodeType?: string) => {
    const typeToUse = nodeType || selectedNodeType;
    if (!typeToUse) return;

    // Check for duplicate node creation (same position, type, within 500ms)
    const now = Date.now();
    if (lastCreatedNodeRef.current) {
      const timeDiff = now - lastCreatedNodeRef.current.timestamp;
      const xDiff = Math.abs(x - lastCreatedNodeRef.current.x);
      const yDiff = Math.abs(y - lastCreatedNodeRef.current.y);
      const isSameType = typeToUse === lastCreatedNodeRef.current.type;

      // If node is at nearly same position (within 5 units) and same type within 500ms, it's a duplicate
      if (timeDiff < 500 && xDiff < 5 && yDiff < 5 && isSameType) {
        return;
      }
    }

    const nodeId = "node_" + Date.now();

    // Record this node creation
    lastCreatedNodeRef.current = {
      x,
      y,
      type: typeToUse,
      timestamp: now,
    };

    let color, shape, level;

    switch (typeToUse) {
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
      node_type: typeToUse
        .replace("_positive", "")
        .replace("_negative", "") as Node["node_type"],
      level,
      position_x: x,
      position_y: y,
      color,
      shape,
    };

    console.log("Creating node at:", { x, y, nodeId });

    setNodes(new Map(nodes.set(nodeId, newNode)));
    setSelectedNodeId(nodeId);
    setMode("select");
    setSelectedNodeType(null); // T047: Auto-deselect node type after placement
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

  /**
   * Creates a relationship directly between two nodes (used by drag-to-connect)
   * @param sourceNodeId - ID of the source node
   * @param targetNodeId - ID of the target node
   */
  const handleCreateRelationshipDirect = (
    sourceNodeId: string,
    targetNodeId: string
  ) => {
    if (mode !== "connect") return;

    const sourceNode = nodes.get(sourceNodeId);
    const targetNode = nodes.get(targetNodeId);

    if (sourceNode && targetNode) {
      // FR-020: Prevent self-relationships
      if (sourceNodeId === targetNodeId) {
        console.warn("Cannot create relationship from node to itself");
        return;
      }

      // FR-015: Check for duplicate relationships
      const existingRel = Array.from(relationships.values()).find(
        (rel) =>
          rel.source_node_id === sourceNodeId &&
          rel.target_node_id === targetNodeId
      );
      if (existingRel) {
        console.warn("Relationship already exists");
        return;
      }

      // Determine relationship type based on initiative type
      let relationshipType:
        | "desirable_effect"
        | "undesirable_effect"
        | "rollup" = "rollup";

      if (sourceNode.node_type === "initiative") {
        // Check if it's positive or negative initiative
        const sourceColor = sourceNode.color;
        if (sourceColor === "#FF6F00") {
          relationshipType = "desirable_effect";
        } else if (sourceColor === "#D32F2F") {
          relationshipType = "undesirable_effect";
        }
      }

      // Create complete relationship matching the Relationship type
      const newRelationship: Relationship = {
        id: `rel-${Date.now()}`,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        relationship_type: relationshipType,
        color:
          relationshipType === "desirable_effect"
            ? "#4CAF50"
            : relationshipType === "undesirable_effect"
            ? "#F44336"
            : "#9E9E9E",
        strength: 1,
      };

      setRelationships(
        new Map(relationships.set(newRelationship.id, newRelationship))
      );

      // T082-T084: User Story 4 - Auto-deselect after relationship creation
      setMode("select");
      setConnectSourceNodeId(null);
    }
  };

  /**
   * Handles node click for relationship creation in connect mode
   * @param nodeId - ID of the clicked node
   */
  const handleNodeClickForConnect = (nodeId: string) => {
    if (mode !== "connect") return;

    if (!connectSourceNodeId) {
      // First click - set source node
      setConnectSourceNodeId(nodeId);
      setSelectedNodeId(nodeId);
    } else if (connectSourceNodeId === nodeId) {
      // Clicked same node - cancel
      setConnectSourceNodeId(null);
      setSelectedNodeId(null);
    } else {
      // Second click - create relationship
      const sourceNode = nodes.get(connectSourceNodeId);
      const targetNode = nodes.get(nodeId);

      if (sourceNode && targetNode) {
        // Determine relationship type based on initiative type
        let relationshipType:
          | "desirable_effect"
          | "undesirable_effect"
          | "rollup" = "rollup";

        if (sourceNode.node_type === "initiative") {
          // Check if it's positive or negative initiative
          const sourceColor = sourceNode.color;
          if (sourceColor === "#FF6F00") {
            relationshipType = "desirable_effect";
          } else if (sourceColor === "#D32F2F") {
            relationshipType = "undesirable_effect";
          }
        }

        const newRelationship: Relationship = {
          id: "rel_" + Date.now(),
          source_node_id: connectSourceNodeId,
          target_node_id: nodeId,
          relationship_type: relationshipType,
          color:
            relationshipType === "desirable_effect"
              ? "#4CAF50"
              : relationshipType === "undesirable_effect"
              ? "#F44336"
              : "#2196F3",
          strength: 1,
        };

        setRelationships(
          new Map(relationships.set(newRelationship.id, newRelationship))
        );
      }

      // Reset connect mode state
      setConnectSourceNodeId(null);
      setMode("select");
      setSelectedNodeId(nodeId);
    }
  };

  /**
   * Handles drag start event from DndContext
   * Initiates drag with useDragNode hook
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Reset the last drag ID for new drag operation
    lastDragIdRef.current = null;

    if (active?.data?.current?.nodeType) {
      const nodeType = active.data.current.nodeType as NodeType;
      // Start drag with initial cursor position (will be updated by DndContext)
      startDrag(nodeType, { x: 0, y: 0 });
    }
  };

  /**
   * Handles the end of a drag operation
   * Transforms coordinates and creates node at drop position
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active, delta, activatorEvent } = event;

    // Create a unique ID for this drag event to prevent duplicate processing
    const dragEventId = `${active.id}-${Date.now()}`;

    // Check if we've already processed this exact drag event
    if (lastDragIdRef.current === dragEventId) {
      return;
    }

    lastDragIdRef.current = dragEventId;

    // Only create node if dropped over canvas and we have canvas element
    if (
      over?.id === "canvas-drop-zone" &&
      canvasElement &&
      dragState.isDragging
    ) {
      // Get mouse position - try activator + delta first, then fall back to ref
      let screenX = mousePositionRef.current.x;
      let screenY = mousePositionRef.current.y;

      if (
        activatorEvent &&
        "clientX" in activatorEvent &&
        "clientY" in activatorEvent &&
        delta
      ) {
        // Use clientX/clientY (viewport coordinates) not screenX/screenY (monitor coordinates)
        screenX = (activatorEvent.clientX as number) + delta.x;
        screenY = (activatorEvent.clientY as number) + delta.y;
      }

      // Convert screen coordinates to canvas coordinates
      // Try using SVG's native coordinate transformation first
      let canvasX, canvasY;

      if (canvasElement instanceof SVGSVGElement) {
        try {
          const pt = canvasElement.createSVGPoint();
          pt.x = screenX;
          pt.y = screenY;
          const ctm = canvasElement.getScreenCTM();
          if (ctm) {
            const svgPoint = pt.matrixTransform(ctm.inverse());
            canvasX = svgPoint.x;
            canvasY = svgPoint.y;
          }
        } catch {
          // SVG native transform failed, will use fallback
        }
      }

      // Fallback to manual calculation if native transform failed
      if (canvasX === undefined || canvasY === undefined) {
        const rect = canvasElement.getBoundingClientRect();

        // The actual viewBox dimensions on the SVG (scaled)
        const actualViewBoxWidth = viewBox.width / viewBox.scale;
        const actualViewBoxHeight = viewBox.height / viewBox.scale;

        // Transform: screen -> normalized (0-1) -> viewBox coordinates
        const normalizedX = (screenX - rect.left) / rect.width;
        const normalizedY = (screenY - rect.top) / rect.height;

        canvasX = viewBox.x + normalizedX * actualViewBoxWidth;
        canvasY = viewBox.y + normalizedY * actualViewBoxHeight;
      }

      endDrag({ x: canvasX, y: canvasY });
      // Set timestamp to prevent click events immediately after drag
      lastDragEndTimeRef.current = Date.now();
    } else {
      // Cancelled - dropped outside canvas
      endDrag(null);
      lastDragEndTimeRef.current = Date.now();
    }
  };

  /**
   * Handles drag cancellation (Escape key or invalid drop)
   * Calls hook's cancelDrag to reset state
   */
  const handleDragCancel = () => {
    cancelDrag();
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
                  <Button variant="outline" size="sm" onClick={handleImport}>
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
                onCanvasReady={setCanvasElement}
                onNodeClickForConnect={handleNodeClickForConnect}
                connectSourceNodeId={connectSourceNodeId}
                isDraggingNode={dragState.isDragging}
                lastDragEndTime={lastDragEndTimeRef.current}
                onCreateRelationship={handleCreateRelationshipDirect}
              />{" "}
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
