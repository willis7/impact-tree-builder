import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasOperations } from "../useCanvasOperations";
import type { Node } from "@/types";

describe("useCanvasOperations", () => {
  let mockState: {
    viewBox: { x: number; y: number; width: number; height: number; scale: number };
    nodes: Map<string, Node>;
  };
  let mockActions: {
    setViewBox: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockState = {
      viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      nodes: new Map<string, Node>(),
    };

    mockActions = {
      setViewBox: vi.fn(),
    };
  });

  describe("handleZoom", () => {
    it("zooms in by factor", () => {
      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleZoom(1.2);
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      expect(newViewBox.scale).toBe(1.2);
      expect(newViewBox.x).toBe(0);
      expect(newViewBox.y).toBe(0);
    });

    it("zooms out by factor", () => {
      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleZoom(0.8);
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      expect(newViewBox.scale).toBe(0.8);
    });

    it("respects minimum zoom limit", () => {
      mockState.viewBox.scale = 0.05; // Below minimum

      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleZoom(0.5);
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      expect(newViewBox.scale).toBe(0.1); // MIN_ZOOM
    });

    it("respects maximum zoom limit", () => {
      mockState.viewBox.scale = 6.0; // Above maximum

      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleZoom(2.0);
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      expect(newViewBox.scale).toBe(5.0); // MAX_ZOOM
    });

    it("zooms toward center coordinates when provided", () => {
      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleZoom(2.0, 100, 200);
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      expect(newViewBox.scale).toBe(2.0);
      // Position should be adjusted to zoom toward center
      // centerX - (centerX - prev.x) * scaleChange = 100 - (100 - 0) * 2 = 100 - 200 = -100
      expect(newViewBox.x).toBe(-100);
      expect(newViewBox.y).toBe(-200); // Same calculation for y: 200 - (200 - 0) * 2 = 200 - 400 = -200
    });
  });

  describe("handleResetView", () => {
    it("resets viewBox to default values", () => {
      mockState.viewBox = { x: 100, y: 200, width: 1200, height: 800, scale: 2.5 };

      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleResetView();
      });

      expect(mockActions.setViewBox).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
        scale: 1,
      });
    });
  });

  describe("handleCenterView", () => {
    it("centers view on nodes", () => {
      const nodes = new Map([
        ["node1", { id: "node1", position_x: 100, position_y: 200 } as Node],
        ["node2", { id: "node2", position_x: 300, position_y: 400 } as Node],
      ]);
      mockState.nodes = nodes;

      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleCenterView();
      });

      expect(mockActions.setViewBox).toHaveBeenCalled();
      const updateFn = mockActions.setViewBox.mock.calls[0][0];
      const newViewBox = updateFn(mockState.viewBox);

      // Center should be at ((100+300)/2, (200+400)/2) = (200, 300)
      // viewBox should be centered: x = 200 - 1200/2 = 200 - 600 = -400
      // y = 300 - 800/2 = 300 - 400 = -100
      expect(newViewBox.x).toBe(-400);
      expect(newViewBox.y).toBe(-100);
      expect(newViewBox.scale).toBe(1); // Unchanged
    });

    it("does nothing when no nodes exist", () => {
      mockState.nodes = new Map();

      const { result } = renderHook(() =>
        useCanvasOperations(mockState, mockActions)
      );

      act(() => {
        result.current.handleCenterView();
      });

      expect(mockActions.setViewBox).not.toHaveBeenCalled();
    });
  });
});