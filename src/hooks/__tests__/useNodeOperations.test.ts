import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNodeOperations, getRelationshipTypeAndColor } from "../useNodeOperations";
import type { Node, Relationship, Measurement } from "@/types";
import type { NodeType } from "@/types/drag";

describe("useNodeOperations", () => {
  let mockState: {
    nodes: Map<string, Node>;
    relationships: Map<string, Relationship>;
    measurements: Map<string, Measurement>;
    selectedNodeId: string | null;
    mode: "select" | "add-node" | "connect";
    selectedNodeType: NodeType | null;
    connectSourceNodeId: string | null;
  };
  let mockActions: {
    setNodes: ReturnType<typeof vi.fn>;
    setRelationships: ReturnType<typeof vi.fn>;
    setMeasurements: ReturnType<typeof vi.fn>;
    setSelectedNodeId: ReturnType<typeof vi.fn>;
    setMode: ReturnType<typeof vi.fn>;
    setSelectedNodeType: ReturnType<typeof vi.fn>;
    setConnectSourceNodeId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockState = {
      nodes: new Map<string, Node>(),
      relationships: new Map<string, Relationship>(),
      measurements: new Map<string, Measurement>(),
      selectedNodeId: null,
      mode: "select" as const,
      selectedNodeType: null,
      connectSourceNodeId: null,
    };

    mockActions = {
      setNodes: vi.fn(),
      setRelationships: vi.fn(),
      setMeasurements: vi.fn(),
      setSelectedNodeId: vi.fn(),
      setMode: vi.fn(),
      setSelectedNodeType: vi.fn(),
      setConnectSourceNodeId: vi.fn(),
    };

    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe("addNode", () => {
    it("creates a business metric node", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(100, 200, "business_metric");
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const newNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      expect(newNodesMap).toBeInstanceOf(Map);
      expect(newNodesMap.size).toBe(1);

      const node = Array.from(newNodesMap.values())[0] as Node;
      expect(node.node_type).toBe("business_metric");
      expect(node.level).toBe(1);
      expect(node.color).toBe("#2E7D32");
      expect(node.shape).toBe("rectangle");
      expect(node.position_x).toBe(100);
      expect(node.position_y).toBe(200);
    });

    it("creates a product metric node", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(150, 250, "product_metric");
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const newNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      const node = Array.from(newNodesMap.values())[0] as Node;

      expect(node.node_type).toBe("product_metric");
      expect(node.level).toBe(2);
      expect(node.color).toBe("#1976D2");
      expect(node.shape).toBe("rectangle");
    });

    it("creates positive initiative nodes", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(200, 300, "initiative_positive");
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const newNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      const node = Array.from(newNodesMap.values())[0] as Node;

      expect(node.node_type).toBe("initiative_positive");
      expect(node.level).toBe(3);
      expect(node.color).toBe("#FF6F00");
      expect(node.shape).toBe("ellipse");
    });

    it("creates negative initiative nodes", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(250, 350, "initiative_negative");
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const newNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      const node = Array.from(newNodesMap.values())[0] as Node;

      expect(node.node_type).toBe("initiative_negative");
      expect(node.level).toBe(3);
      expect(node.color).toBe("#D32F2F");
      expect(node.shape).toBe("ellipse");
    });

    it("uses selectedNodeType when no type provided", () => {
      mockState.selectedNodeType = "business_metric";

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(100, 200);
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const newNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      const node = Array.from(newNodesMap.values())[0] as Node;

      expect(node.node_type).toBe("business_metric");
    });

    it("does nothing when no type is available", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(100, 200);
      });

      expect(mockActions.setNodes).not.toHaveBeenCalled();
    });

    it("prevents duplicate node creation", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      // First node creation
      act(() => {
        result.current.addNode(100, 200, "business_metric");
      });

      expect(mockActions.setNodes).toHaveBeenCalledTimes(1);

      // Try to create duplicate immediately
      act(() => {
        result.current.addNode(100, 200, "business_metric");
      });

      // Should not create second node
      expect(mockActions.setNodes).toHaveBeenCalledTimes(1);
    });

    it("updates state correctly after node creation", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.addNode(100, 200, "business_metric");
      });

      expect(mockActions.setSelectedNodeId).toHaveBeenCalled();
      expect(mockActions.setMode).toHaveBeenCalledWith("select");
      expect(mockActions.setSelectedNodeType).toHaveBeenCalledWith(null);
    });
  });

  describe("updateNode", () => {
    it("updates an existing node", () => {
      const existingNode: Node = {
        id: "node1",
        name: "Old Name",
        description: "Old Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      mockState.nodes = new Map([["node1", existingNode]]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.updateNode("node1", { name: "New Name", description: "New Description" });
      });

      expect(mockActions.setNodes).toHaveBeenCalled();
      const updatedNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      const updatedNode = updatedNodesMap.get("node1");

      expect(updatedNode?.name).toBe("New Name");
      expect(updatedNode?.description).toBe("New Description");
      expect(updatedNode?.node_type).toBe("business_metric"); // Unchanged
    });

    it("does nothing for non-existent node", () => {
      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.updateNode("nonexistent", { name: "New Name" });
      });

      expect(mockActions.setNodes).not.toHaveBeenCalled();
    });
  });

  describe("deleteNode", () => {
    it("deletes a node and related data", () => {
      const nodeToDelete: Node = {
        id: "node1",
        name: "Node to Delete",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      const relatedRelationship: Relationship = {
        id: "rel1",
        source_node_id: "node1",
        target_node_id: "node2",
        relationship_type: "desirable_effect",
        color: "#4CAF50",
        strength: 1,
      };

      const relatedMeasurement: Measurement = {
        id: "meas1",
        node_id: "node1",
        metric_name: "Test Metric",
        expected_value: 100,
        actual_value: 95,
        measurement_date: "2024-01-01",
        impact_type: "proximate",
      };

      mockState.nodes = new Map([["node1", nodeToDelete]]);
      mockState.relationships = new Map([["rel1", relatedRelationship]]);
      mockState.measurements = new Map([["meas1", relatedMeasurement]]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.deleteNode("node1");
      });

      // Check nodes deletion
      expect(mockActions.setNodes).toHaveBeenCalled();
      const resultNodesMap = mockActions.setNodes.mock.calls[0][0] as Map<string, Node>;
      expect(resultNodesMap.has("node1")).toBe(false);

      // Check relationships deletion
      expect(mockActions.setRelationships).toHaveBeenCalled();
      const resultRelationshipsMap = mockActions.setRelationships.mock.calls[0][0] as Map<string, Relationship>;
      expect(resultRelationshipsMap.has("rel1")).toBe(false);

      // Check measurements deletion
      expect(mockActions.setMeasurements).toHaveBeenCalled();
      const resultMeasurementsMap = mockActions.setMeasurements.mock.calls[0][0] as Map<string, Measurement>;
      expect(resultMeasurementsMap.has("meas1")).toBe(false);

      // Check selected node deselection
      expect(mockActions.setSelectedNodeId).toHaveBeenCalledWith(null);
    });
  });

  describe("createRelationshipDirect", () => {
    it("creates a relationship between two nodes", () => {
      mockState.mode = "connect";

      const sourceNode: Node = {
        id: "node1",
        name: "Source Node",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      const targetNode: Node = {
        id: "node2",
        name: "Target Node",
        description: "Description",
        node_type: "product_metric",
        level: 2,
        position_x: 200,
        position_y: 300,
        color: "#1976D2",
        shape: "rectangle",
      };

      mockState.nodes = new Map([
        ["node1", sourceNode],
        ["node2", targetNode]
      ]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.createRelationshipDirect("node1", "node2");
      });

      expect(mockActions.setRelationships).toHaveBeenCalled();
      expect(mockActions.setMode).toHaveBeenCalledWith("select");
      expect(mockActions.setConnectSourceNodeId).toHaveBeenCalledWith(null);
    });

    it("prevents self-relationships", () => {
      mockState.mode = "connect";

      const node: Node = {
        id: "node1",
        name: "Node",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      mockState.nodes = new Map([["node1", node]]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.createRelationshipDirect("node1", "node1");
      });

      expect(mockActions.setRelationships).not.toHaveBeenCalled();
    });

    it("prevents duplicate relationships", () => {
      mockState.mode = "connect";

      const sourceNode: Node = {
        id: "node1",
        name: "Source Node",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      const targetNode: Node = {
        id: "node2",
        name: "Target Node",
        description: "Description",
        node_type: "product_metric",
        level: 2,
        position_x: 200,
        position_y: 300,
        color: "#1976D2",
        shape: "rectangle",
      };

      const existingRelationship: Relationship = {
        id: "rel1",
        source_node_id: "node1",
        target_node_id: "node2",
        relationship_type: "desirable_effect",
        color: "#4CAF50",
        strength: 1,
      };

      mockState.nodes = new Map([
        ["node1", sourceNode],
        ["node2", targetNode]
      ]);
      mockState.relationships = new Map([["rel1", existingRelationship]]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.createRelationshipDirect("node1", "node2");
      });

      expect(mockActions.setRelationships).not.toHaveBeenCalled();
    });

    it("does nothing when not in connect mode", () => {
      mockState.mode = "select";

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.createRelationshipDirect("node1", "node2");
      });

      expect(mockActions.setRelationships).not.toHaveBeenCalled();
    });
  });

  describe("handleNodeClickForConnect", () => {
    it("sets source node on first click", () => {
      mockState.mode = "connect";

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleNodeClickForConnect("node1");
      });

      expect(mockActions.setConnectSourceNodeId).toHaveBeenCalledWith("node1");
      expect(mockActions.setSelectedNodeId).toHaveBeenCalledWith("node1");
    });

    it("creates relationship on second click", () => {
      mockState.mode = "connect";
      mockState.connectSourceNodeId = "node1";

      const sourceNode: Node = {
        id: "node1",
        name: "Source Node",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      const targetNode: Node = {
        id: "node2",
        name: "Target Node",
        description: "Description",
        node_type: "product_metric",
        level: 2,
        position_x: 200,
        position_y: 300,
        color: "#1976D2",
        shape: "rectangle",
      };

      mockState.nodes = new Map([
        ["node1", sourceNode],
        ["node2", targetNode]
      ]);

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleNodeClickForConnect("node2");
      });

      expect(mockActions.setRelationships).toHaveBeenCalled();
    });

    it("deselects source node when clicking same node", () => {
      mockState.mode = "connect";
      mockState.connectSourceNodeId = "node1";

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleNodeClickForConnect("node1");
      });

      expect(mockActions.setConnectSourceNodeId).toHaveBeenCalledWith(null);
      expect(mockActions.setSelectedNodeId).toHaveBeenCalledWith(null);
    });

    it("does nothing when not in connect mode", () => {
      mockState.mode = "select";

      const { result } = renderHook(() =>
        useNodeOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleNodeClickForConnect("node1");
      });

      expect(mockActions.setConnectSourceNodeId).not.toHaveBeenCalled();
    });
  });

  describe("getRelationshipTypeAndColor", () => {
    it("returns correct properties for business metric (level 1)", () => {
      const node: Node = {
        id: "node1",
        name: "Business Metric",
        description: "Description",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 200,
        color: "#2E7D32",
        shape: "rectangle",
      };

      const result = getRelationshipTypeAndColor(node);
      expect(result.relationshipType).toBe("desirable_effect");
      expect(result.color).toBe("#4CAF50");
    });

    it("returns correct properties for product metric (level 2)", () => {
      const node: Node = {
        id: "node1",
        name: "Product Metric",
        description: "Description",
        node_type: "product_metric",
        level: 2,
        position_x: 100,
        position_y: 200,
        color: "#1976D2",
        shape: "rectangle",
      };

      const result = getRelationshipTypeAndColor(node);
      expect(result.relationshipType).toBe("desirable_effect");
      expect(result.color).toBe("#2196F3");
    });

    it("returns correct properties for initiative (level 3)", () => {
      const node: Node = {
        id: "node1",
        name: "Initiative",
        description: "Description",
        node_type: "initiative",
        level: 3,
        position_x: 100,
        position_y: 200,
        color: "#FF6F00",
        shape: "ellipse",
      };

      const result = getRelationshipTypeAndColor(node);
      expect(result.relationshipType).toBe("rollup");
      expect(result.color).toBe("#FF6F00"); // Uses source node color
    });

    it("returns fallback properties for unknown level", () => {
      const node: Node = {
        id: "node1",
        name: "Unknown",
        description: "Description",
        node_type: "business_metric",
        level: 99,
        position_x: 100,
        position_y: 200,
        color: "#000000",
        shape: "rectangle",
      };

      const result = getRelationshipTypeAndColor(node);
      expect(result.relationshipType).toBe("desirable_effect");
      expect(result.color).toBe("#9E9E9E");
    });
  });
});