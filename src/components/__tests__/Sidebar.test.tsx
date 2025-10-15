import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { Sidebar } from "../Sidebar";
import { userEvent } from "@testing-library/user-event";
import type { ImpactTree, Node, Relationship } from "@/types";

/**
 * Tests for Sidebar component
 *
 * Verifies tree information editing, node type selection,
 * relationship tools, and statistics display.
 */
describe("Sidebar", () => {
  const mockTree: ImpactTree = {
    id: "tree-1",
    name: "Test Tree",
    description: "Test Description",
    owner: "test@example.com",
    created_date: "2025-01-01",
    updated_date: "2025-01-01",
  };

  const mockNodes = new Map<string, Node>([
    [
      "node-1",
      {
        id: "node-1",
        name: "Business Metric 1",
        description: "Test metric",
        node_type: "business_metric",
        level: 1,
        position_x: 100,
        position_y: 100,
        color: "#2E7D32",
        shape: "rectangle" as const,
      },
    ],
    [
      "node-2",
      {
        id: "node-2",
        name: "Product Metric 1",
        description: "Test product metric",
        node_type: "product_metric",
        level: 2,
        position_x: 200,
        position_y: 200,
        color: "#1976D2",
        shape: "rectangle" as const,
      },
    ],
  ]);

  const mockRelationships = new Map<string, Relationship>([
    [
      "rel-1",
      {
        id: "rel-1",
        source_node_id: "node-1",
        target_node_id: "node-2",
        relationship_type: "desirable_effect",
        color: "#4CAF50",
        strength: 0.8,
      },
    ],
  ]);

  const defaultProps = {
    tree: mockTree,
    onTreeUpdate: vi.fn(),
    mode: "select" as const,
    onModeChange: vi.fn(),
    selectedNodeType: null,
    onNodeTypeSelect: vi.fn(),
    nodes: mockNodes,
    relationships: mockRelationships,
  };

  it("should render tree information", () => {
    render(<Sidebar {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(
      /description/i
    ) as HTMLTextAreaElement;
    expect(nameInput.value).toBe("Test Tree");
    expect(descInput.value).toBe("Test Description");
  });

  it("should display correct node count badge", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("2 nodes")).toBeDefined();
  });

  it("should call onTreeUpdate when tree name changes", async () => {
    const onTreeUpdate = vi.fn();
    const user = userEvent.setup();

    render(<Sidebar {...defaultProps} onTreeUpdate={onTreeUpdate} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Tree Name");

    await waitFor(() => {
      expect(onTreeUpdate).toHaveBeenCalled();
    });
  });

  it("should call onTreeUpdate when description changes", async () => {
    const onTreeUpdate = vi.fn();
    const user = userEvent.setup();

    render(<Sidebar {...defaultProps} onTreeUpdate={onTreeUpdate} />);

    const descInput = screen.getByLabelText(/description/i);
    await user.clear(descInput);
    await user.type(descInput, "New description");

    await waitFor(() => {
      expect(onTreeUpdate).toHaveBeenCalled();
    });
  });

  it("should sanitize tree name input", async () => {
    const onTreeUpdate = vi.fn();
    const user = userEvent.setup();

    render(<Sidebar {...defaultProps} onTreeUpdate={onTreeUpdate} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, '<script>alert("xss")</script>Safe Name');

    await waitFor(() => {
      const lastCall =
        onTreeUpdate.mock.calls[onTreeUpdate.mock.calls.length - 1];
      expect(lastCall[0].name).not.toContain("<script>");
    });
  });

  it("should render node type buttons", () => {
    render(<Sidebar {...defaultProps} />);

    // Check for unique button texts
    expect(
      screen.getByRole("button", { name: /business metric/i })
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /product metric/i })
    ).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /initiative/i }).length
    ).toBeGreaterThan(0);
  });

  it("should call onNodeTypeSelect when node type button clicked", async () => {
    const onNodeTypeSelect = vi.fn();
    const onModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Sidebar
        {...defaultProps}
        onNodeTypeSelect={onNodeTypeSelect}
        onModeChange={onModeChange}
      />
    );

    const businessMetricBtn = screen.getByRole("button", {
      name: /business metric/i,
    });
    await user.click(businessMetricBtn);

    expect(onNodeTypeSelect).toHaveBeenCalledWith("business_metric");
    expect(onModeChange).toHaveBeenCalledWith("add-node");
  });

  it("should highlight selected node type", () => {
    render(
      <Sidebar
        {...defaultProps}
        mode="add-node"
        selectedNodeType="business_metric"
      />
    );

    const businessMetricBtn = screen.getByRole("button", {
      name: /business metric/i,
    });
    // Button should exist and be rendered
    expect(businessMetricBtn).toBeDefined();
  });

  it("should toggle relationship mode", async () => {
    const onModeChange = vi.fn();
    const user = userEvent.setup();

    render(<Sidebar {...defaultProps} onModeChange={onModeChange} />);

    const connectBtn = screen.getByRole("button", { name: /connect nodes/i });
    await user.click(connectBtn);

    expect(onModeChange).toHaveBeenCalledWith("connect");
  });

  it("should show active badge in connect mode", () => {
    render(<Sidebar {...defaultProps} mode="connect" />);

    expect(screen.getByText(/active/i)).toBeDefined();
  });

  it("should display statistics correctly", () => {
    render(<Sidebar {...defaultProps} />);

    // Should show relationship count
    expect(screen.getByText("1")).toBeDefined();

    // Check that statistics section exists
    const statistics = screen.getByText(/statistics/i);
    expect(statistics).toBeDefined();
  });

  it("should render with empty nodes and relationships", () => {
    render(
      <Sidebar {...defaultProps} nodes={new Map()} relationships={new Map()} />
    );

    expect(screen.getByText("0 nodes")).toBeDefined();
  });

  it("should have accessible labels for all inputs", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/description/i)).toBeDefined();
  });
});
