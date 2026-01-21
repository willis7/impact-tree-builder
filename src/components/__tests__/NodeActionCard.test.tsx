import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeActionCard } from "../NodeActionCard";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Node, Measurement } from "@/types";
import "@testing-library/jest-dom/vitest";

/**
 * Tests for NodeActionCard component
 *
 * Verifies floating action card behavior, performance display,
 * and division by zero handling.
 */
describe("NodeActionCard", () => {
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

  const defaultProps = {
    node: mockNode,
    measurements: new Map<string, Measurement>(),
    nodePosition: { x: 100, y: 100 },
    onDelete: vi.fn(),
    onStartConnect: vi.fn(),
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>);
  };

  it("should display action buttons", () => {
    renderWithProviders(<NodeActionCard {...defaultProps} />);

    // Check for aria-labels of action buttons
    expect(screen.getByLabelText(/delete/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/connect/i)).toBeInTheDocument();
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
        renderWithProviders(
          <NodeActionCard {...defaultProps} measurements={measurementsWithZero} />
        );
      }).not.toThrow();
    });

    it("should display valid performance percentage when measurements are valid", () => {
      const validMeasurements = new Map<string, Measurement>([
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
      ]);

      renderWithProviders(
        <NodeActionCard {...defaultProps} measurements={validMeasurements} />
      );

      // Should display 80% performance
      expect(screen.getByText(/80%/)).toBeInTheDocument();
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
        renderWithProviders(
          <NodeActionCard
            {...defaultProps}
            measurements={measurementsAllZero}
          />
        );
      }).not.toThrow();
    });

    it("should calculate average performance correctly with mixed measurements", () => {
      const mixedMeasurements = new Map<string, Measurement>([
        [
          "meas-1",
          {
            id: "meas-1",
            node_id: "node-1",
            metric_name: "Valid Metric 1",
            actual_value: 80,
            expected_value: 100, // 80% performance
            impact_type: "proximate",
            measurement_date: "2026-01-20",
          },
        ],
        [
          "meas-2",
          {
            id: "meas-2",
            node_id: "node-1",
            metric_name: "Valid Metric 2",
            actual_value: 100,
            expected_value: 100, // 100% performance
            impact_type: "proximate",
            measurement_date: "2026-01-20",
          },
        ],
        [
          "meas-3",
          {
            id: "meas-3",
            node_id: "node-1",
            metric_name: "Invalid Metric",
            actual_value: 100,
            expected_value: 0, // Should be filtered out
            impact_type: "downstream",
            measurement_date: "2026-01-20",
          },
        ],
      ]);

      renderWithProviders(
        <NodeActionCard {...defaultProps} measurements={mixedMeasurements} />
      );

      // Average should be (80 + 100) / 2 = 90% (excluding the zero expected_value)
      expect(screen.getByText(/90%/)).toBeInTheDocument();
    });

    it("should not display performance when no measurements exist", () => {
      renderWithProviders(<NodeActionCard {...defaultProps} measurements={new Map()} />);

      // Should not display percentage when no measurements
      const percentageElements = screen.queryAllByText(/%/);
      // Performance percentage should not be displayed
      expect(percentageElements.length).toBe(0);
    });
  });
});
