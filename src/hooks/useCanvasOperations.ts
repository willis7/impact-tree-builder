import type { Node } from "@/types";

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface UseCanvasOperationsState {
  viewBox: ViewBox;
  nodes: Map<string, Node>;
}

export interface UseCanvasOperationsActions {
  setViewBox: React.Dispatch<React.SetStateAction<ViewBox>>;
}

export interface UseCanvasOperationsReturn {
  handleZoom: (factor: number, centerX?: number, centerY?: number) => void;
  handleResetView: () => void;
  handleCenterView: () => void;
}

const MIN_ZOOM = 0.1; // 10% of original size
const MAX_ZOOM = 5.0; // 500% of original size

/**
 * Custom hook for managing canvas operations (zoom, pan, center)
 */
export function useCanvasOperations(
  state: UseCanvasOperationsState,
  actions: UseCanvasOperationsActions
): UseCanvasOperationsReturn {
  /**
   * Adjusts the canvas zoom level
   * @param factor - Multiplier for the current scale (e.g., 1.2 to zoom in, 0.8 to zoom out)
   */
  const handleZoom = (factor: number, centerX?: number, centerY?: number) => {
    actions.setViewBox((prev) => {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.scale * factor));

      // If center coordinates provided, adjust viewBox position to zoom toward center
      if (centerX !== undefined && centerY !== undefined) {
        const scaleChange = newScale / prev.scale;
        const newX = centerX - (centerX - prev.x) * scaleChange;
        const newY = centerY - (centerY - prev.y) * scaleChange;

        return {
          ...prev,
          x: newX,
          y: newY,
          scale: newScale,
        };
      }

      return {
        ...prev,
        scale: newScale,
      };
    });
  };

  /**
   * Resets the canvas view to default position and zoom
   */
  const handleResetView = () => {
    actions.setViewBox({ x: 0, y: 0, width: 1200, height: 800, scale: 1 });
  };

  /**
   * Centers the view on all nodes in the tree
   * Calculates the bounding box of all nodes and centers the viewBox
   */
  const handleCenterView = () => {
    if (state.nodes.size === 0) return;

    const nodeArray = Array.from(state.nodes.values());
    const minX = Math.min(...nodeArray.map((n) => n.position_x));
    const maxX = Math.max(...nodeArray.map((n) => n.position_x));
    const minY = Math.min(...nodeArray.map((n) => n.position_y));
    const maxY = Math.max(...nodeArray.map((n) => n.position_y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    actions.setViewBox((prev) => ({
      ...prev,
      x: centerX - prev.width / 2,
      y: centerY - prev.height / 2,
    }));
  };

  return {
    handleZoom,
    handleResetView,
    handleCenterView,
  };
}