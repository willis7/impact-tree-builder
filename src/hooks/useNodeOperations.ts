import { useRef } from "react";
import type { Node, Relationship, Measurement } from "@/types";

export interface NodeOperationsState {
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
  selectedNodeId: string | null;
  mode: "select" | "add-node" | "connect";
  selectedNodeType: string | null;
  connectSourceNodeId: string | null;
}

export interface NodeOperationsActions {
  setNodes: React.Dispatch<React.SetStateAction<Map<string, Node>>>;
  setRelationships: React.Dispatch<React.SetStateAction<Map<string, Relationship>>>;
  setMeasurements: React.Dispatch<React.SetStateAction<Map<string, Measurement>>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setMode: React.Dispatch<React.SetStateAction<"select" | "add-node" | "connect">>;
  setSelectedNodeType: React.Dispatch<React.SetStateAction<string | null>>;
  setConnectSourceNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseNodeOperationsReturn {
  addNode: (x: number, y: number, nodeType?: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  createRelationshipDirect: (sourceNodeId: string, targetNodeId: string) => void;
  handleNodeClickForConnect: (nodeId: string) => void;
}

/**
 * Custom hook for managing node operations in the Impact Tree
 */
export function useNodeOperations(
  state: NodeOperationsState,
  actions: NodeOperationsActions
): UseNodeOperationsReturn {
  const lastCreatedNodeRef = useRef<{
    x: number;
    y: number;
    type: string;
    timestamp: number;
  } | null>(null);

  /**
   * Maps node type string to visual properties
   */
  const getNodeProperties = (nodeType: string) => {
    switch (nodeType) {
      case "business_metric":
        return {
          color: "#2E7D32",
          shape: "rectangle" as const,
          level: 1,
        };
      case "product_metric":
        return {
          color: "#1976D2",
          shape: "rectangle" as const,
          level: 2,
        };
      case "initiative_positive":
        return {
          color: "#FF6F00",
          shape: "ellipse" as const,
          level: 3,
        };
      case "initiative_negative":
        return {
          color: "#D32F2F",
          shape: "ellipse" as const,
          level: 3,
        };
      default:
        return {
          color: "#1976D2",
          shape: "rectangle" as const,
          level: 2,
        };
    }
  };

  /**
   * Creates a new node at the specified position
   */
  const addNode = (x: number, y: number, nodeType?: string) => {
    const typeToUse = nodeType || state.selectedNodeType;
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

    const { color, shape, level } = getNodeProperties(typeToUse);

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

    actions.setNodes(new Map(state.nodes.set(nodeId, newNode)));
    actions.setSelectedNodeId(nodeId);
    actions.setMode("select");
    actions.setSelectedNodeType(null); // T047: Auto-deselect node type after placement
  };

  /**
   * Updates properties of an existing node
   */
  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    const updatedNode = { ...node, ...updates };
    actions.setNodes(new Map(state.nodes.set(nodeId, updatedNode)));
  };

  /**
   * Deletes a node and all related relationships and measurements
   */
  const deleteNode = (nodeId: string) => {
    const newNodes = new Map(state.nodes);
    newNodes.delete(nodeId);
    actions.setNodes(newNodes);

    // Delete related relationships
    const newRelationships = new Map(state.relationships);
    Array.from(newRelationships.entries()).forEach(([id, rel]) => {
      if (rel.source_node_id === nodeId || rel.target_node_id === nodeId) {
        newRelationships.delete(id);
      }
    });
    actions.setRelationships(newRelationships);

    // Delete related measurements
    const newMeasurements = new Map(state.measurements);
    Array.from(newMeasurements.entries()).forEach(([id, meas]) => {
      if (meas.node_id === nodeId) {
        newMeasurements.delete(id);
      }
    });
    actions.setMeasurements(newMeasurements);

    actions.setSelectedNodeId(null);
  };

  /**
   * Creates a relationship directly between two nodes (used by drag-to-connect)
   */
  const createRelationshipDirect = (sourceNodeId: string, targetNodeId: string) => {
    if (state.mode !== "connect") return;

    const sourceNode = state.nodes.get(sourceNodeId);
    const targetNode = state.nodes.get(targetNodeId);

    if (sourceNode && targetNode) {
      // FR-020: Prevent self-relationships
      if (sourceNodeId === targetNodeId) {
        console.warn("Cannot create relationship from node to itself");
        return;
      }

      // FR-015: Check for duplicate relationships
      const existingRel = Array.from(state.relationships.values()).find(
        (rel) =>
          rel.source_node_id === sourceNodeId &&
          rel.target_node_id === targetNodeId
      );
      if (existingRel) {
        console.warn("Relationship already exists");
        return;
      }

      // Determine relationship type and color based on source node
      const { relationshipType, color } = getRelationshipTypeAndColor(sourceNode);

      // Create complete relationship matching the Relationship type
      const newRelationship: Relationship = {
        id: `rel-${Date.now()}`,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        relationship_type: relationshipType,
        color,
        strength: 1,
      };

      actions.setRelationships(
        new Map(state.relationships.set(newRelationship.id, newRelationship))
      );

      // T082-T084: User Story 4 - Auto-deselect after relationship creation
      actions.setMode("select");
      actions.setConnectSourceNodeId(null);
    }
  };

  /**
   * Handles node click for relationship creation in connect mode
   */
  const handleNodeClickForConnect = (nodeId: string) => {
    if (state.mode !== "connect") return;

    if (!state.connectSourceNodeId) {
      // First click - set source node
      actions.setConnectSourceNodeId(nodeId);
      actions.setSelectedNodeId(nodeId);
    } else if (state.connectSourceNodeId === nodeId) {
      // Clicking same node - deselect
      actions.setConnectSourceNodeId(null);
      actions.setSelectedNodeId(null);
    } else {
      // Second click - create relationship
      createRelationshipDirect(state.connectSourceNodeId, nodeId);
    }
  };

  return {
    addNode,
    updateNode,
    deleteNode,
    createRelationshipDirect,
    handleNodeClickForConnect,
  };
}

/**
 * Determines relationship type and color based on source node
 * This is a pure utility function that can be tested independently
 */
export function getRelationshipTypeAndColor(sourceNode: Node): {
  relationshipType: Relationship["relationship_type"];
  color: string;
} {
  const sourceColor = sourceNode.color;

  let relationshipType: Relationship["relationship_type"];
  let color: string;

  // Determine relationship type based on source node level
  switch (sourceNode.level) {
    case 1: // Business metrics drive product metrics
      relationshipType = "desirable_effect";
      color = "#4CAF50"; // Green for positive effect
      break;
    case 2: // Product metrics drive initiatives
      relationshipType = "desirable_effect";
      color = "#2196F3"; // Blue for product to initiative
      break;
    case 3: // Initiatives can have both effects
      relationshipType = "rollup";
      color = sourceColor; // Use source node color
      break;
    default:
      relationshipType = "desirable_effect";
      color = "#9E9E9E"; // Gray fallback
  }

  return { relationshipType, color };
}