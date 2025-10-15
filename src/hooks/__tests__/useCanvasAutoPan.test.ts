import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useCanvasAutoPan } from "../useCanvasAutoPan";

/**
 * Tests for useCanvasAutoPan hook
 *
 * Verifies auto-pan behavior during drag operations near viewport edges
 */
describe("useCanvasAutoPan", () => {
  let mockCanvasElement: HTMLElement;
  let mockOnPan: ReturnType<typeof vi.fn>;
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock canvas element with getBoundingClientRect
    mockCanvasElement = {
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 800,
        width: 1000,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })),
    } as unknown as HTMLElement;

    mockOnPan = vi.fn();

    // Mock requestAnimationFrame - don't call callback immediately
    // Store callbacks for manual control
    let frameId = 0;
    mockRequestAnimationFrame = vi.fn((callback) => {
      frameId++;
      // Call callback once, then stop to prevent infinite loop
      if (frameId === 1) {
        callback(0);
      }
      return frameId;
    });
    mockCancelAnimationFrame = vi.fn();

    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not pan when not dragging", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 10 }); // Near left edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: false,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).not.toHaveBeenCalled();
  });

  it("should not pan when canvas element is null", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 10 });
      return useCanvasAutoPan({
        canvasElement: null,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).not.toHaveBeenCalled();
  });

  it("should pan left when cursor is near left edge", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 400 }); // 10px from left edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [deltaX] = mockOnPan.mock.calls[0];
    expect(deltaX).toBeLessThan(0); // Negative = pan left
  });

  it("should pan right when cursor is near right edge", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 990, y: 400 }); // 10px from right edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [deltaX] = mockOnPan.mock.calls[0];
    expect(deltaX).toBeGreaterThan(0); // Positive = pan right
  });

  it("should pan up when cursor is near top edge", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 500, y: 10 }); // 10px from top edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [, deltaY] = mockOnPan.mock.calls[0];
    expect(deltaY).toBeLessThan(0); // Negative = pan up
  });

  it("should pan down when cursor is near bottom edge", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 500, y: 790 }); // 10px from bottom edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [, deltaY] = mockOnPan.mock.calls[0];
    expect(deltaY).toBeGreaterThan(0); // Positive = pan down
  });

  it("should not pan when cursor is in center of viewport", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 500, y: 400 }); // Center
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    // Should call requestAnimationFrame but not onPan (no velocity)
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it("should respect custom edge threshold", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 60, y: 400 }); // 60px from left edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
        config: { edgeThreshold: 100 }, // Custom 100px threshold
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [deltaX] = mockOnPan.mock.calls[0];
    expect(deltaX).toBeLessThan(0); // Should pan left
  });

  it("should respect custom max speed", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 5, y: 400 }); // Very close to edge
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
        config: { maxSpeed: 5 }, // Custom max speed
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [deltaX] = mockOnPan.mock.calls[0];
    expect(Math.abs(deltaX)).toBeLessThanOrEqual(5); // Should not exceed max speed
  });

  it("should account for viewBox scale in pan calculation", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 400 });
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 2 }, // 2x zoom
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    // At 2x scale, pan should be divided by 2
  });

  it("should cancel animation frame on unmount", () => {
    const { unmount } = renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 400 });
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it("should handle diagonal panning (near corner)", () => {
    renderHook(() => {
      const cursorPositionRef = useRef({ x: 10, y: 10 }); // Near top-left corner
      return useCanvasAutoPan({
        canvasElement: mockCanvasElement,
        isDragging: true,
        cursorPositionRef,
        onPan: mockOnPan,
        viewBox: { x: 0, y: 0, width: 1200, height: 800, scale: 1 },
      });
    });

    expect(mockOnPan).toHaveBeenCalled();
    const [deltaX, deltaY] = mockOnPan.mock.calls[0];
    expect(deltaX).toBeLessThan(0); // Pan left
    expect(deltaY).toBeLessThan(0); // Pan up
  });
});
