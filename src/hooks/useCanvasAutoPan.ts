import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Configuration for auto-pan behavior
 */
interface AutoPanConfig {
  /** Distance from edge (in pixels) to trigger auto-pan */
  edgeThreshold: number;
  /** Maximum pan speed in pixels per frame */
  maxSpeed: number;
  /** Whether auto-pan is currently enabled */
  enabled: boolean;
}

/**
 * Default auto-pan configuration
 */
const DEFAULT_CONFIG: AutoPanConfig = {
  edgeThreshold: 50, // Trigger within 50px of edge
  maxSpeed: 10, // Max 10px per frame
  enabled: false,
};

/**
 * Custom hook for canvas auto-pan during drag operations
 *
 * Automatically pans the canvas when dragging near viewport edges,
 * with smooth acceleration/deceleration based on distance from edge.
 *
 * @param options - Hook configuration
 * @param options.canvasElement - The canvas element to pan
 * @param options.isDragging - Whether a drag operation is active
 * @param options.cursorPositionRef - Ref to current cursor position {x, y}
 * @param options.onPan - Callback to update viewBox position
 * @param options.viewBox - Current viewBox state
 * @param options.config - Optional auto-pan configuration
 *
 * @example
 * ```tsx
 * const mousePositionRef = useRef({ x: 0, y: 0 });
 *
 * useCanvasAutoPan({
 *   canvasElement: svgRef.current,
 *   isDragging: dragState.isDragging,
 *   cursorPositionRef: mousePositionRef,
 *   onPan: (deltaX, deltaY) => {
 *     setViewBox(prev => ({
 *       ...prev,
 *       x: prev.x + deltaX,
 *       y: prev.y + deltaY
 *     }));
 *   },
 *   viewBox,
 * });
 * ```
 */
export function useCanvasAutoPan({
  canvasElement,
  isDragging,
  cursorPositionRef,
  onPan,
  viewBox,
  config = DEFAULT_CONFIG,
}: {
  canvasElement: HTMLElement | SVGSVGElement | null;
  isDragging: boolean;
  cursorPositionRef: MutableRefObject<{ x: number; y: number }>;
  onPan: (deltaX: number, deltaY: number) => void;
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  config?: Partial<AutoPanConfig>;
}) {
  const animationFrameRef = useRef<number | null>(null);
  const fullConfig = { ...DEFAULT_CONFIG, ...config, enabled: isDragging };

  useEffect(() => {
    // Only run auto-pan when dragging is active
    if (!fullConfig.enabled || !canvasElement) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    /**
     * Calculates pan velocity based on cursor distance from edge
     * @param distance - Distance from edge (positive = inside viewport)
     * @returns Pan velocity in pixels per frame (negative = pan away from edge)
     */
    const calculateVelocity = (distance: number): number => {
      if (distance > fullConfig.edgeThreshold) {
        return 0; // Not near edge
      }

      // Linear interpolation from 0 to maxSpeed as distance decreases
      const ratio = 1 - distance / fullConfig.edgeThreshold;
      return ratio * fullConfig.maxSpeed;
    };

    /**
     * Auto-pan animation loop
     * Checks cursor position relative to viewport edges and pans accordingly
     */
    const autoPanLoop = () => {
      // Recalculate rect on each frame in case canvas has moved
      const rect = canvasElement.getBoundingClientRect();

      // Read fresh cursor position from ref
      const cursorPosition = cursorPositionRef.current;

      // Calculate distances from each edge
      const distanceFromLeft = cursorPosition.x - rect.left;
      const distanceFromRight = rect.right - cursorPosition.x;
      const distanceFromTop = cursorPosition.y - rect.top;
      const distanceFromBottom = rect.bottom - cursorPosition.y;

      // Calculate pan velocities for each direction
      let panX = 0;
      let panY = 0;

      // Horizontal panning
      if (
        distanceFromLeft < fullConfig.edgeThreshold &&
        distanceFromLeft >= 0
      ) {
        panX = -calculateVelocity(distanceFromLeft); // Pan left (move viewBox left)
      } else if (
        distanceFromRight < fullConfig.edgeThreshold &&
        distanceFromRight >= 0
      ) {
        panX = calculateVelocity(distanceFromRight); // Pan right (move viewBox right)
      }

      // Vertical panning
      if (distanceFromTop < fullConfig.edgeThreshold && distanceFromTop >= 0) {
        panY = -calculateVelocity(distanceFromTop); // Pan up (move viewBox up)
      } else if (
        distanceFromBottom < fullConfig.edgeThreshold &&
        distanceFromBottom >= 0
      ) {
        panY = calculateVelocity(distanceFromBottom); // Pan down (move viewBox down)
      }

      // Apply panning if any velocity detected
      if (panX !== 0 || panY !== 0) {
        // Convert screen space pan to canvas space
        const canvasPanX = panX / viewBox.scale;
        const canvasPanY = panY / viewBox.scale;
        onPan(canvasPanX, canvasPanY);
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(autoPanLoop);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(autoPanLoop);

    // Cleanup on unmount or when dragging stops
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    fullConfig.enabled,
    fullConfig.edgeThreshold,
    fullConfig.maxSpeed,
    canvasElement,
    onPan,
    viewBox.scale,
    cursorPositionRef,
  ]);
}
