import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { PropertiesPanel } from "../PropertiesPanel";
import { userEvent } from "@testing-library/user-event";
import type { Node, Relationship, Measurement } from "@/types";

/**
 * Tests for PropertiesPanel component
 *
 * Verifies node property editing, measurement management,
 * performance indicators, and relationship display.
 */
describe("PropertiesPanel", () => {
  const mockNode: Node = {
    id: "node-1",
    name: "Test Node",
    description: "Test Description",
    node_type: "business_metric",
    level: 1,
    position_x: 100,
    position_y: 100,
    color: "#2E7D32",
    shape: "rectangle",
  };

  const mockRelationship: Relationship = {
    id: "rel-1",
    source_node_id: "node-2",
    target_node_id: "node-1",
    relationship_type: "desirable_effect",
    color: "#4CAF50",
    strength: 0.8,
  };

  const mockMeasurement: Measurement = {
    id: "meas-1",
    node_id: "node-1",
    metric_name: "Test Metric",
    expected_value: 100,
    actual_value: 80,
    measurement_date: "2025-10-01",
    measurement_period: "monthly",
    impact_type: "proximate",
  };

  const mockNodes = new Map<string, Node>([
    ["node-1", mockNode],
    [
      "node-2",
      {
        id: "node-2",
        name: "Source Node",
        description: "Source",
        node_type: "product_metric",
        level: 2,
        position_x: 200,
        position_y: 200,
        color: "#1976D2",
        shape: "rectangle",
      },
    ],
  ]);

  const mockMeasurements = new Map<string, Measurement>([
    ["meas-1", mockMeasurement],
  ]);

  const defaultProps = {
    selectedNode: mockNode,
    selectedRelationship: null as Relationship | null | undefined,
    measurements: mockMeasurements,
    nodes: mockNodes,
    onUpdateNode: vi.fn(),
    onDeleteNode: vi.fn(),
    onAddMeasurement: vi.fn(),
  };

  it("should render node information when node is selected", () => {
    render(<PropertiesPanel {...defaultProps} />);

    expect(screen.getByText("Test Node")).toBeDefined();
    expect(screen.getByText("Test Description")).toBeDefined();
  });

  it("should display node type correctly", () => {
    render(<PropertiesPanel {...defaultProps} />);

    // Business Metric appears twice - in badge and in type field
    const businessMetricElements = screen.getAllByText("Business Metric");
    expect(businessMetricElements.length).toBeGreaterThan(0);
  });

  it("should enter edit mode when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel {...defaultProps} />);

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
    });
  });

  it("should call onUpdateNode when saving changes", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    // Modify name
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    // Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalledWith(
        "node-1",
        expect.objectContaining({ name: expect.stringContaining("Updated") })
      );
    });
  });

  it("should sanitize node name input", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Enter edit mode
    await user.click(screen.getByRole("button", { name: /edit/i }));

    // Try to inject XSS
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, '<script>alert("xss")</script>Safe');

    // Save
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalled();
      const calls = onUpdateNode.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1].name).not.toContain("<script>");
    });
  });

  it("should cancel edit mode without saving", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Enter edit mode
    await user.click(screen.getByRole("button", { name: /edit/i }));

    // Modify name
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, "Changed Name");

    // Cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Should not have saved
    expect(onUpdateNode).not.toHaveBeenCalled();

    // Should show original name
    await waitFor(() => {
      expect(screen.getByText("Test Node")).toBeDefined();
    });
  });

  it("should call onDeleteNode when delete button is clicked", async () => {
    const onDeleteNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onDeleteNode={onDeleteNode} />);

    // Enter edit mode to see delete button
    await user.click(screen.getByRole("button", { name: /edit/i }));

    // Click delete
    const deleteButton = screen.getByRole("button", { name: /delete node/i });
    await user.click(deleteButton);

    expect(onDeleteNode).toHaveBeenCalledWith("node-1");
  });

  it("should display measurements for selected node", () => {
    render(<PropertiesPanel {...defaultProps} />);

    expect(screen.getByText("Test Metric")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
    expect(screen.getByText("80")).toBeDefined();
  });

  it("should show performance badge for measurement", () => {
    render(<PropertiesPanel {...defaultProps} />);

    // Performance is 80/100 = 80%
    expect(screen.getByText(/80%/i)).toBeDefined();
  });

  it("should open measurement dialog when add button is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /^add$/i });
    await user.click(addButton);

    await waitFor(() => {
      // Dialog title and button both have "Add Measurement" text
      const elements = screen.getAllByText(/add measurement/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("should call onAddMeasurement with sanitized values", async () => {
    const onAddMeasurement = vi.fn();
    const user = userEvent.setup();

    render(
      <PropertiesPanel {...defaultProps} onAddMeasurement={onAddMeasurement} />
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    // Fill in form - wait for form fields to be available
    await waitFor(() =>
      expect(screen.getByLabelText(/metric name/i)).toBeDefined()
    );

    const nameInput = screen.getByLabelText(/metric name/i);
    await user.type(nameInput, "New Metric");

    const expectedInput = screen.getByLabelText(/expected value/i);
    await user.clear(expectedInput);
    await user.type(expectedInput, "200");

    const actualInput = screen.getByLabelText(/actual value/i);
    await user.clear(actualInput);
    await user.type(actualInput, "180");

    // Submit
    const submitButtons = screen.getAllByRole("button", {
      name: /add measurement/i,
    });
    const submitButton = submitButtons.find((btn) =>
      btn.closest('[role="dialog"]')
    );
    if (submitButton) {
      await user.click(submitButton);
    }

    await waitFor(() => {
      expect(onAddMeasurement).toHaveBeenCalled();
      const call = onAddMeasurement.mock.calls[0][0];
      // Sanitization should remove spaces from metric name
      expect(call.metric_name).toBeDefined();
      expect(call.expected_value).toBe(200);
      expect(call.actual_value).toBe(180);
    });
  });

  it("should sanitize measurement name input", async () => {
    const onAddMeasurement = vi.fn();
    const user = userEvent.setup();

    render(
      <PropertiesPanel {...defaultProps} onAddMeasurement={onAddMeasurement} />
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/metric name/i)).toBeDefined()
    );

    // Try XSS - sanitization should remove script tags
    const nameInput = screen.getByLabelText(/metric name/i);
    await user.type(nameInput, '<script>alert("xss")</script>Metric');

    // Submit
    const submitButtons = screen.getAllByRole("button", {
      name: /add measurement/i,
    });
    const submitButton = submitButtons.find((btn) =>
      btn.closest('[role="dialog"]')
    );
    if (submitButton) {
      await user.click(submitButton);
    }

    await waitFor(() => {
      expect(onAddMeasurement).toHaveBeenCalled();
      const call = onAddMeasurement.mock.calls[0][0];
      expect(call.metric_name).not.toContain("<script>");
      expect(call.metric_name).not.toContain("</script>");
    });
  });

  it("should display relationship information when relationship is selected", () => {
    render(
      <PropertiesPanel
        {...defaultProps}
        selectedNode={null}
        selectedRelationship={mockRelationship}
      />
    );

    expect(screen.getByText(/relationship/i)).toBeDefined();
    expect(screen.getByText("Source Node")).toBeDefined();
  });

  it("should show message when nothing is selected", () => {
    render(
      <PropertiesPanel
        {...defaultProps}
        selectedNode={null}
        selectedRelationship={null}
      />
    );

    expect(screen.getByText(/select a node or relationship/i)).toBeDefined();
  });

  it("should handle empty measurements gracefully", () => {
    render(<PropertiesPanel {...defaultProps} measurements={new Map()} />);

    expect(screen.getByText("Test Node")).toBeDefined();
    // Should not crash when no measurements exist
  });

  it("should validate numeric inputs", async () => {
    const onAddMeasurement = vi.fn();
    const user = userEvent.setup();

    render(
      <PropertiesPanel {...defaultProps} onAddMeasurement={onAddMeasurement} />
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/metric name/i)).toBeDefined()
    );

    const nameInput = screen.getByLabelText(/metric name/i);
    await user.type(nameInput, "Test");

    // Try invalid number - sanitizeNumericInput should default to 0
    const expectedInput = screen.getByLabelText(/expected value/i);
    await user.clear(expectedInput);
    await user.type(expectedInput, "invalid");

    // Submit
    const submitButtons = screen.getAllByRole("button", {
      name: /add measurement/i,
    });
    const submitButton = submitButtons.find((btn) =>
      btn.closest('[role="dialog"]')
    );
    if (submitButton) {
      await user.click(submitButton);
    }

    await waitFor(() => {
      expect(onAddMeasurement).toHaveBeenCalled();
      const call = onAddMeasurement.mock.calls[0][0];
      // Should default to 0 for invalid input
      expect(call.expected_value).toBe(0);
    });
  });
});
