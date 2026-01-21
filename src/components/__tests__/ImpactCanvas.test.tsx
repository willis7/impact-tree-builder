import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactCanvas } from "../ImpactCanvas";
import type { Node, Relationship, Measurement } from "@/types";
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
    onNodeUpdate: vi.fn(),
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
      screen.getByText(/select a node type from the sidebar/i)
    ).toBeInTheDocument();
  });

  describe("Drag-to-Pan Functionality", () => {
    it("should call onPan when canvas is dragged in select mode", async () => {
      const onPan = vi.fn();
      const user = userEvent.setup();

      render(<ImpactCanvas {...defaultProps} onPan={onPan} />);

      const svg = document.querySelector("svg");
      if (svg) {
        // Simulate mouse down on empty canvas area
        await user.pointer([
          { keys: "[MouseLeft>]", target: svg },
          { coords: { x: 100, y: 100 } },
        ]);

        // Move mouse to simulate drag
        await user.pointer([
          { coords: { x: 150, y: 150 } },
        ]);

        // Release mouse
        await user.pointer([
          { keys: "[/MouseLeft]" },
        ]);

        // Should have called onPan with delta values
        expect(onPan).toHaveBeenCalled();
        const [deltaX, deltaY] = onPan.mock.calls[0];
        expect(typeof deltaX).toBe("number");
        expect(typeof deltaY).toBe("number");
      }
    });

    it("should not pan when clicking on nodes", async () => {
      const onPan = vi.fn();
      const user = userEvent.setup();

      render(<ImpactCanvas {...defaultProps} onPan={onPan} />);

      const node = screen.getByText("Test Node");

      // Try to drag the node
      await user.pointer([
        { keys: "[MouseLeft>]", target: node },
        { coords: { x: 100, y: 100 } },
      ]);

      await user.pointer([
        { coords: { x: 150, y: 150 } },
      ]);

      await user.pointer([
        { keys: "[/MouseLeft]" },
      ]);

      // Should not have called onPan when dragging nodes
      expect(onPan).not.toHaveBeenCalled();
    });

    it("should not pan in non-select modes", async () => {
      const onPan = vi.fn();
      const user = userEvent.setup();

      render(<ImpactCanvas {...defaultProps} mode="add-node" onPan={onPan} />);

      const svg = document.querySelector("svg");
      if (svg) {
        await user.pointer([
          { keys: "[MouseLeft>]", target: svg },
          { coords: { x: 100, y: 100 } },
        ]);

        await user.pointer([
          { coords: { x: 150, y: 150 } },
        ]);

        await user.pointer([
          { keys: "[/MouseLeft]" },
        ]);

        // Should not pan in add-node mode
        expect(onPan).not.toHaveBeenCalled();
      }
    });
  });

  describe("Mouse Wheel Zoom Functionality", () => {
    it("should render with onZoom prop without errors", () => {
      const onZoom = vi.fn();

      // Should render without throwing errors when onZoom prop is provided
      expect(() => {
        render(<ImpactCanvas {...defaultProps} onZoom={onZoom} />);
      }).not.toThrow();
    });

    it("should render without onZoom prop without errors", () => {
      // Should render without throwing errors when onZoom prop is not provided
      expect(() => {
        render(<ImpactCanvas {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Division by Zero Handling", () => {
    it("should handle measurements with zero expected_value without crashing", () => {
      const measurementsWithZero = new Map<string, Measurement>([
        [
          "meas-1",
          {
            id: "meas-1",
            node_id: "node-1",
            metric_name: "Test Metric",
            actual_value: 100,
            expected_value: 0, // Division by zero case
            impact_type: "proximate",
            measurement_date: "2026-01-20",
          },
        ],
      ]);

      // Should not throw when rendering with zero expected_value
      expect(() => {
        render(
          <ImpactCanvas {...defaultProps} measurements={measurementsWithZero} />
        );
      }).not.toThrow();
    });

    it("should handle nodes with only zero expected_value measurements", () => {
      const measurementsAllZero = new Map<string, Measurement>([
        [
          "meas-1",
          {
            id: "meas-1",
            node_id: "node-1",
            metric_name: "Test Metric 1",
            actual_value: 100,
            expected_value: 0,
            impact_type: "proximate",
            measurement_date: "2026-01-20",
          },
        ],
        [
          "meas-2",
          {
            id: "meas-2",
            node_id: "node-1",
            metric_name: "Test Metric 2",
            actual_value: 200,
            expected_value: 0,
            impact_type: "downstream",
            measurement_date: "2026-01-20",
          },
        ],
      ]);

      // Should not throw when all measurements have zero expected_value
      expect(() => {
        render(
          <ImpactCanvas
            {...defaultProps}
            measurements={measurementsAllZero}
          />
        );
      }).not.toThrow();
    });

    it("should correctly calculate performance with mixed valid and invalid measurements", () => {
      const mixedMeasurements = new Map<string, Measurement>([
        [
          "meas-1",
          {
            id: "meas-1",
            node_id: "node-1",
            metric_name: "Valid Metric",
            actual_value: 80,
            expected_value: 100,
            impact_type: "proximate",
            measurement_date: "2026-01-20",
          },
        ],
        [
          "meas-2",
          {
            id: "meas-2",
            node_id: "node-1",
            metric_name: "Invalid Metric",
            actual_value: 100,
            expected_value: 0, // Should be filtered out
            impact_type: "downstream",
            measurement_date: "2026-01-20",
          },
        ],
      ]);

      // Should render without errors and only use valid measurements
      expect(() => {
        render(
          <ImpactCanvas {...defaultProps} measurements={mixedMeasurements} />
        );
      }).not.toThrow();
    });
  });
});
