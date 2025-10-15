import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactCanvas } from "../ImpactCanvas";
import type { Node, Relationship } from "@/types";
import "@testing-library/jest-dom/vitest";

/**
 * Tests for ImpactCanvas component
 *
 * Verifies canvas rendering, node interactions, and drag-drop behavior
 */
describe("ImpactCanvas", () => {
  const mockNodes = new Map<string, Node>([
    [
      "node-1",
      {
        id: "node-1",
        name: "Test Node",
        description: "Test",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 100,
        color: "#2E7D32",
        shape: "rectangle" as const,
      },
    ],
  ]);

  const mockRelationships = new Map<string, Relationship>();

  const defaultProps = {
    nodes: mockNodes,
    relationships: mockRelationships,
    measurements: new Map(),
    selectedNodeId: null,
    selectedRelationshipId: null,
    onNodeSelect: vi.fn(),
    onRelationshipSelect: vi.fn(),
    onNodeMove: vi.fn(),
    onAddNode: vi.fn(),
    mode: "select" as const,
    viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
  };

  it("should render canvas with nodes", () => {
    render(<ImpactCanvas {...defaultProps} />);

    // SVG should be rendered
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Node should be rendered
    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should call onNodeSelect when node is clicked in select mode", async () => {
    const onNodeSelect = vi.fn();
    const user = userEvent.setup();

    render(<ImpactCanvas {...defaultProps} onNodeSelect={onNodeSelect} />);

    const node = screen.getByText("Test Node");
    await user.click(node);

    expect(onNodeSelect).toHaveBeenCalledWith("node-1");
  });

  it("should call onAddNode when canvas is clicked in add-node mode", async () => {
    const onAddNode = vi.fn();
    const user = userEvent.setup();

    render(
      <ImpactCanvas {...defaultProps} mode="add-node" onAddNode={onAddNode} />
    );

    const svg = document.querySelector("svg");
    if (svg) {
      await user.click(svg);
      expect(onAddNode).toHaveBeenCalled();
    }
  });

  // T045: User Story 2 - No node creation on subsequent canvas click after drag-drop
  describe("User Story 2: Auto-Deselect After Drop", () => {
    it("should not create node on canvas click after drag-drop completion", async () => {
      const onAddNode = vi.fn();
      const user = userEvent.setup();

      // Render in add-node mode initially
      const { rerender } = render(
        <ImpactCanvas {...defaultProps} mode="add-node" onAddNode={onAddNode} />
      );

      // Simulate that a drag-drop just completed and mode switched back to select
      rerender(
        <ImpactCanvas {...defaultProps} mode="select" onAddNode={onAddNode} />
      );

      // Click on canvas - should NOT create a node because mode is "select"
      const svg = document.querySelector("svg");
      if (svg) {
        await user.click(svg);
      }

      // onAddNode should not be called when in select mode
      expect(onAddNode).not.toHaveBeenCalled();
    });

    it("should not create duplicate nodes when drag completes", async () => {
      const onAddNode = vi.fn();

      // Pass isDraggingNode prop to simulate active drag
      render(
        <ImpactCanvas
          {...defaultProps}
          mode="add-node"
          onAddNode={onAddNode}
          isDraggingNode={true}
        />
      );

      // Canvas click should be blocked during drag
      const svg = document.querySelector("svg");
      if (svg) {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        svg.dispatchEvent(clickEvent);
      }

      // Should not call onAddNode during drag
      expect(onAddNode).not.toHaveBeenCalled();
    });
  });

  it("should render empty state when no nodes exist", () => {
    render(<ImpactCanvas {...defaultProps} nodes={new Map()} />);

    // Should show empty state message
    expect(
      screen.getByText(/select a node type from the left sidebar/i)
    ).toBeInTheDocument();
  });
});
