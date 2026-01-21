import { useState, useRef, useCallback } from "react";
import type { ImpactTree, Node, Relationship, Measurement, ViewBox } from "@/types";
import type { NodeType } from "@/types/drag";
import { exportAsJSON, exportAsPNG, exportAsHTML } from "@/lib/export-utils";
import { DEFAULT_VIEW_BOX as DEFAULT_VIEW_BOX_CONSTANT } from "@/lib/constants";
import { validateImportedData } from "@/lib/validation-utils";
import { sampleData } from "@/data/sampleData";
import { toast } from "@/hooks/use-toast";

// Re-export ViewBox for backwards compatibility
export type { ViewBox } from "@/types";

export interface ImpactTreeState {
  tree: ImpactTree;
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
  selectedNodeId: string | null;
  selectedRelationshipId: string | null;
  mode: "select" | "add-node" | "connect";
  selectedNodeType: NodeType | null;
  connectSourceNodeId: string | null;
  viewBox: ViewBox;
}

export interface ImpactTreeActions {
  setTree: React.Dispatch<React.SetStateAction<ImpactTree>>;
  setNodes: React.Dispatch<React.SetStateAction<Map<string, Node>>>;
  setRelationships: React.Dispatch<React.SetStateAction<Map<string, Relationship>>>;
  setMeasurements: React.Dispatch<React.SetStateAction<Map<string, Measurement>>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedRelationshipId: React.Dispatch<React.SetStateAction<string | null>>;
  setMode: React.Dispatch<React.SetStateAction<"select" | "add-node" | "connect">>;
  setSelectedNodeType: React.Dispatch<React.SetStateAction<NodeType | null>>;
  setConnectSourceNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewBox: React.Dispatch<React.SetStateAction<ViewBox>>;
}

export interface ImpactTreeOperations {
  handleNewTree: () => void;
  handleSave: () => void;
  handleExportJSON: () => void;
  handleExportPNG: (canvasElement: SVGSVGElement | null) => Promise<void>;
  handleExportHTML: () => void;
  handleImport: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isExporting: boolean;
  isImporting: boolean;
}

export interface UseImpactTreeStateReturn {
  state: ImpactTreeState;
  actions: ImpactTreeActions;
  operations: ImpactTreeOperations;
}

const DEFAULT_VIEW_BOX: ViewBox = DEFAULT_VIEW_BOX_CONSTANT;

/**
 * Creates a new tree with current date and default metadata
 */
function createNewTree(): ImpactTree {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];

  return {
    id: `tree_${Date.now()}`,
    name: "New Impact Tree",
    description: "A new impact analysis tree",
    created_date: dateString,
    updated_date: dateString,
    owner: "User",
  };
}

/**
 * Custom hook for managing Impact Tree state
 *
 * Centralizes all state management for the Impact Tree application:
 * - Data state (tree, nodes, relationships, measurements)
 * - Selection state (selectedNodeId, selectedRelationshipId)
 * - Mode state (mode, selectedNodeType, connectSourceNodeId)
 * - View state (viewBox)
 * - File operations (save, load, export, import)
 */
export function useImpactTreeState(): UseImpactTreeStateReturn {
  // Core data state
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

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  // Mode state
  const [mode, setMode] = useState<"select" | "add-node" | "connect">("select");
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);

  // View state
  const [viewBox, setViewBox] = useState<ViewBox>(DEFAULT_VIEW_BOX);

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Resets all state for a new tree
   */
  const resetState = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedRelationshipId(null);
    setMode("select");
    setSelectedNodeType(null);
    setConnectSourceNodeId(null);
    setViewBox(DEFAULT_VIEW_BOX);
  }, []);

  /**
   * Creates a completely new tree, resetting all state
   */
  const handleNewTree = useCallback(() => {
    setTree(createNewTree());
    setNodes(new Map());
    setRelationships(new Map());
    setMeasurements(new Map());
    resetState();
  }, [resetState]);

  /**
   * Saves the current tree state to localStorage
   */
  const handleSave = useCallback(() => {
    const data = {
      tree,
      nodes: Array.from(nodes.values()),
      relationships: Array.from(relationships.values()),
      measurements: Array.from(measurements.values()),
    };
    localStorage.setItem("impactTreeData", JSON.stringify(data));
    toast({
      title: "Tree saved",
      description: "Your impact tree has been saved to browser storage.",
      variant: "success",
    });
  }, [tree, nodes, relationships, measurements]);

  /**
   * Exports the tree as a JSON file
   */
  const handleExportJSON = useCallback(() => {
    exportAsJSON({ tree, nodes, relationships, measurements });
  }, [tree, nodes, relationships, measurements]);

  /**
   * Exports the tree visualization as a PNG image
   */
  const handleExportPNG = useCallback(
    async (canvasElement: SVGSVGElement | null) => {
      setIsExporting(true);
      try {
        await exportAsPNG(tree, canvasElement);
      } catch (error) {
        console.error("PNG export failed:", error);
        toast({
          title: "Export failed",
          description: "Failed to export as PNG. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [tree]
  );

  /**
   * Exports the tree as an HTML page
   */
  const handleExportHTML = useCallback(() => {
    exportAsHTML({ tree, nodes, relationships, measurements });
  }, [tree, nodes, relationships, measurements]);

  /**
   * Triggers file picker for importing JSON data
   */
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Processes the selected file and imports the tree data
   */
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid JSON file.",
          variant: "destructive",
        });
        return;
      }

      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          const validation = validateImportedData(data);
          if (!validation.isValid) {
            toast({
              title: "Import failed",
              description: validation.errors.join(". "),
              variant: "destructive",
            });
            return;
          }

          setTree(data.tree);
          setNodes(new Map(data.nodes.map((n: Node) => [n.id, n])));
          setRelationships(new Map(data.relationships.map((r: Relationship) => [r.id, r])));
          setMeasurements(new Map(data.measurements.map((m: Measurement) => [m.id, m])));
          resetState();

          toast({
            title: "Import successful",
            description: "Your impact tree has been loaded.",
            variant: "success",
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: `Failed to parse JSON file: ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        setIsImporting(false);
        toast({
          title: "File read error",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
      event.target.value = "";
    },
    [resetState]
  );

  return {
    state: {
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
    },
    actions: {
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
    },
    operations: {
      handleNewTree,
      handleSave,
      handleExportJSON,
      handleExportPNG,
      handleExportHTML,
      handleImport,
      handleFileSelect,
      fileInputRef,
      isExporting,
      isImporting,
    },
  };
}
