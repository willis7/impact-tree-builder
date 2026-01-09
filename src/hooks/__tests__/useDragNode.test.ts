import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDragNode } from "../useDragNode";

/**
 * Unit tests for useDragNode custom hook
 * Tests drag-and-drop node creation workflow from sidebar to canvas
 *
 * Test Coverage:
 * - T016: Initial state validation
 * - T017: Drag start handler
 * - T018: Drag end handler
 * - T019: Cancel handler (Escape key)
 */

describe("useDragNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("T016: Initial state", () => {
    it("should initialize with inactive drag state", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.activeNodeType).toBeNull();
      expect(result.current.dragState.dragType).toBeNull();
      expect(result.current.dragState.cursorPosition).toEqual({ x: 0, y: 0 });
      expect(result.current.dragState.previewPosition).toEqual({ x: 0, y: 0 });
    });

    it("should return all required hook functions", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      expect(result.current.startDrag).toBeDefined();
      expect(result.current.endDrag).toBeDefined();
      expect(result.current.cancelDrag).toBeDefined();
      expect(typeof result.current.startDrag).toBe("function");
      expect(typeof result.current.endDrag).toBe("function");
      expect(typeof result.current.cancelDrag).toBe("function");
    });

    it("should have correct initial state properties matching DragState interface", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      const { dragState } = result.current;

      expect(dragState).toHaveProperty("isDragging");
      expect(dragState).toHaveProperty("dragType");
      expect(dragState).toHaveProperty("activeNodeType");
      expect(dragState).toHaveProperty("cursorPosition");
      expect(dragState).toHaveProperty("previewPosition");
      expect(dragState).toHaveProperty("sourceNodeId");
      expect(dragState).toHaveProperty("targetNodeId");

      // Node drag should set dragType to null when inactive
      expect(dragState.isDragging).toBe(false);
      expect(dragState.dragType).toBeNull();
      expect(dragState.activeNodeType).toBeNull();
      expect(dragState.sourceNodeId).toBeNull();
      expect(dragState.targetNodeId).toBeNull();
    });
  });

  describe("T017: Drag start handler", () => {
    it("should activate drag state when starting drag with business_metric", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe("business_metric");
      expect(result.current.dragState.cursorPosition).toEqual({
        x: 100,
        y: 200,
      });
      expect(result.current.dragState.previewPosition).toEqual({
        x: 100,
        y: 200,
      });
    });

    it("should activate drag state when starting drag with product_metric", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("product_metric", { x: 150, y: 250 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe("product_metric");
      expect(result.current.dragState.cursorPosition).toEqual({
        x: 150,
        y: 250,
      });
    });

    it("should activate drag state when starting drag with initiative_positive", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_positive", { x: 200, y: 300 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe(
        "initiative_positive"
      );
    });

    it("should activate drag state when starting drag with initiative_negative", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_negative", { x: 250, y: 350 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe(
        "initiative_negative"
      );
    });

    it("should not call onNodeCreate when starting drag", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
      });

      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should update current position to match start position", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      const position = { x: 123, y: 456 };
      act(() => {
        result.current.startDrag("business_metric", position);
      });

      expect(result.current.dragState.cursorPosition).toEqual(position);
    });

    it("should activate drag state when starting drag with product_metric", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("product_metric", { x: 150, y: 250 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe("product_metric");
      expect(result.current.dragState.cursorPosition).toEqual({
        x: 150,
        y: 250,
      });
    });

    it("should activate drag state when starting drag with initiative_positive", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_positive", { x: 200, y: 300 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe(
        "initiative_positive"
      );
    });

    it("should activate drag state when starting drag with initiative_negative", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_negative", { x: 250, y: 350 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe(
        "initiative_negative"
      );
    });

    it("should not call onNodeCreate when starting drag", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
      });

      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should update current position to match start position", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      const position = { x: 123, y: 456 };
      act(() => {
        result.current.startDrag("business_metric", position);
      });

      expect(result.current.dragState.cursorPosition).toEqual(position);
    });
  });

  describe("T018: Drag end handler", () => {
    it("should call onNodeCreate with correct parameters on successful drop", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      // Start drag
      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
      });

      // End drag at drop position
      act(() => {
        result.current.endDrag({ x: 300, y: 400 });
      });

      expect(onNodeCreate).toHaveBeenCalledWith("business_metric", {
        x: 300,
        y: 400,
      });
      expect(onNodeCreate).toHaveBeenCalledTimes(1);
    });

    it("should reset drag state after successful drop", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      // Start and end drag
      act(() => {
        result.current.startDrag("product_metric", { x: 100, y: 200 });
        result.current.endDrag({ x: 300, y: 400 });
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.activeNodeType).toBeNull();
      expect(result.current.dragState.dragType).toBeNull();
      expect(result.current.dragState.cursorPosition).toEqual({ x: 0, y: 0 });
      expect(result.current.dragState.previewPosition).toEqual({ x: 0, y: 0 });
    });

    it("should not call onNodeCreate if drag was never started", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.endDrag({ x: 300, y: 400 });
      });

      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should handle drop at different coordinates than start", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_positive", { x: 50, y: 50 });
        result.current.endDrag({ x: 500, y: 600 });
      });

      expect(onNodeCreate).toHaveBeenCalledWith("initiative_positive", {
        x: 500,
        y: 600,
      });
    });

    it("should handle drop at same coordinates as start", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      const position = { x: 200, y: 300 };
      act(() => {
        result.current.startDrag("initiative_negative", position);
        result.current.endDrag(position);
      });

      expect(onNodeCreate).toHaveBeenCalledWith(
        "initiative_negative",
        position
      );
    });
  });

  describe("T019: Cancel handler (Escape key)", () => {
    it("should reset drag state when cancel is called", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      // Start drag
      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
      });

      expect(result.current.dragState.isDragging).toBe(true);

      // Cancel drag
      act(() => {
        result.current.cancelDrag();
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.activeNodeType).toBeNull();
      expect(result.current.dragState.dragType).toBeNull();
      expect(result.current.dragState.cursorPosition).toEqual({ x: 0, y: 0 });
      expect(result.current.dragState.previewPosition).toEqual({ x: 0, y: 0 });
    });

    it("should not call onNodeCreate when drag is cancelled", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("product_metric", { x: 100, y: 200 });
        result.current.cancelDrag();
      });

      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should handle cancel when drag was never started", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.cancelDrag();
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should handle cancel after drag started", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_positive", { x: 100, y: 200 });
        result.current.cancelDrag();
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(onNodeCreate).not.toHaveBeenCalled();
    });

    it("should allow starting new drag after cancellation", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      // First drag - cancelled
      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
        result.current.cancelDrag();
      });

      // Second drag - should work normally
      act(() => {
        result.current.startDrag("product_metric", { x: 300, y: 400 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.activeNodeType).toBe("product_metric");
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid drag start/end cycles", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("business_metric", { x: 100, y: 200 });
        result.current.endDrag({ x: 100, y: 200 });
        result.current.startDrag("product_metric", { x: 200, y: 300 });
        result.current.endDrag({ x: 200, y: 300 });
      });

      expect(onNodeCreate).toHaveBeenCalledTimes(2);
      expect(result.current.dragState.isDragging).toBe(false);
    });

    it("should handle zero coordinates", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_positive", { x: 0, y: 0 });
        result.current.endDrag({ x: 0, y: 0 });
      });

      expect(onNodeCreate).toHaveBeenCalledWith("initiative_positive", {
        x: 0,
        y: 0,
      });
    });

    it("should handle negative coordinates", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("initiative_negative", { x: -50, y: -100 });
        result.current.endDrag({ x: -50, y: -100 });
      });

      expect(onNodeCreate).toHaveBeenCalledWith("initiative_negative", {
        x: -50,
        y: -100,
      });
    });

    it("should handle very large coordinates", () => {
      const onNodeCreate = vi.fn();
      const { result } = renderHook(() => useDragNode({ onNodeCreate }));

      act(() => {
        result.current.startDrag("business_metric", { x: 10000, y: 10000 });
        result.current.endDrag({ x: 10000, y: 10000 });
      });

      expect(onNodeCreate).toHaveBeenCalledWith("business_metric", {
        x: 10000,
        y: 10000,
      });
    });
  });
});
