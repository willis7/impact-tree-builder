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
    // Description is in textarea
    expect(screen.getByDisplayValue("Test Description")).toBeDefined();
  });

  it("should display node type correctly", () => {
    render(<PropertiesPanel {...defaultProps} />);

    // Business Metric appears in the header area (and in sr-only span)
    const businessMetricElements = screen.getAllByText("Business Metric");
    expect(businessMetricElements.length).toBeGreaterThan(0);
  });

  it("should have editable name input", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Name input should be directly editable
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalled();
    });
  });

  it("should call onUpdateNode when editing name", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Modify name directly - each keystroke triggers an update
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    // The component calls onUpdateNode on each change
    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalled();
      // Check the last call includes some part of the typed name
      const lastCall = onUpdateNode.mock.calls[onUpdateNode.mock.calls.length - 1];
      expect(lastCall[0]).toBe("node-1");
      expect(lastCall[1].name).toBeDefined();
    });
  });

  it("should sanitize node name input", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Try to inject XSS
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, '<script>alert("xss")</script>Safe');

    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalled();
      const calls = onUpdateNode.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1].name).not.toContain("<script>");
    });
  });

  it("should have editable description", async () => {
    const onUpdateNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onUpdateNode={onUpdateNode} />);

    // Modify description
    const descInput = screen.getByDisplayValue("Test Description");
    await user.clear(descInput);
    await user.type(descInput, "New Description");

    await waitFor(() => {
      expect(onUpdateNode).toHaveBeenCalled();
    });
  });

  it("should call onDeleteNode when delete button is clicked", async () => {
    const onDeleteNode = vi.fn();
    const user = userEvent.setup();

    render(<PropertiesPanel {...defaultProps} onDeleteNode={onDeleteNode} />);

    // Delete button is always visible in the Node tab
    const deleteButton = screen.getByRole("button", { name: /delete node/i });
    await user.click(deleteButton);

    expect(onDeleteNode).toHaveBeenCalledWith("node-1");
  });

  it("should display measurements in Metrics tab", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel {...defaultProps} />);

    // Click on Metrics tab
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    await waitFor(() => {
      expect(screen.getByText("Test Metric")).toBeDefined();
      expect(screen.getByText("100")).toBeDefined();
      expect(screen.getByText("80")).toBeDefined();
    });
  });

  it("should show performance badge for measurement", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel {...defaultProps} />);

    // Click on Metrics tab
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    await waitFor(() => {
      // Performance is 80/100 = 80%
      expect(screen.getByText(/80%/i)).toBeDefined();
    });
  });

  it("should open measurement dialog when add button is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel {...defaultProps} />);

    // Click on Metrics tab first
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add measurement/i })).toBeDefined();
    });

    const addButton = screen.getByRole("button", { name: /add measurement/i });
    await user.click(addButton);

    await waitFor(() => {
      // Dialog should have "Add Measurement" title
      expect(screen.getByRole("heading", { name: /add measurement/i })).toBeDefined();
    });
  });

  it("should call onAddMeasurement with sanitized values", async () => {
    const onAddMeasurement = vi.fn();
    const user = userEvent.setup();

    render(
      <PropertiesPanel {...defaultProps} onAddMeasurement={onAddMeasurement} />
    );

    // Click on Metrics tab
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    // Open dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add measurement/i })).toBeDefined();
    });
    await user.click(screen.getByRole("button", { name: /add measurement/i }));

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

    // Submit - find the button in the dialog
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

    // Click on Metrics tab
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    // Open dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add measurement/i })).toBeDefined();
    });
    await user.click(screen.getByRole("button", { name: /add measurement/i }));

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

    // Click on Metrics tab
    const metricsTab = screen.getByRole("tab", { name: /metrics/i });
    await user.click(metricsTab);

    // Open dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add measurement/i })).toBeDefined();
    });
    await user.click(screen.getByRole("button", { name: /add measurement/i }));

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

  describe("Division by Zero Handling", () => {
    it("should render without crashing when measurement has zero expected_value", () => {
      const measurementWithZero: Measurement = {
        id: "meas-zero",
        node_id: "node-1",
        metric_name: "Zero Expected",
        expected_value: 0, // Division by zero case
        actual_value: 100,
        measurement_date: "2026-01-20",
        impact_type: "proximate",
      };

      const measurementsWithZero = new Map<string, Measurement>([
        ["meas-zero", measurementWithZero],
      ]);

      // Should not throw when rendering with zero expected_value
      expect(() => {
        render(
          <PropertiesPanel
            {...defaultProps}
            measurements={measurementsWithZero}
          />
        );
      }).not.toThrow();
    });

    it("should render without crashing when all measurements have zero expected_value", () => {
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
          <PropertiesPanel
            {...defaultProps}
            measurements={measurementsAllZero}
          />
        );
      }).not.toThrow();
    });

    it("should render without crashing with mixed valid and zero expected_value measurements", () => {
      const mixedMeasurements = new Map<string, Measurement>([
        [
          "meas-valid",
          {
            id: "meas-valid",
            node_id: "node-1",
            metric_name: "Valid Metric",
            expected_value: 100,
            actual_value: 90,
            measurement_date: "2026-01-20",
            impact_type: "proximate",
          },
        ],
        [
          "meas-zero",
          {
            id: "meas-zero",
            node_id: "node-1",
            metric_name: "Zero Expected",
            expected_value: 0,
            actual_value: 50,
            measurement_date: "2026-01-20",
            impact_type: "downstream",
          },
        ],
      ]);

      // Should render without errors and handle both valid and invalid measurements
      expect(() => {
        render(
          <PropertiesPanel {...defaultProps} measurements={mixedMeasurements} />
        );
      }).not.toThrow();
    });
  });
});
