import { useState } from "react";
import type {
  DragState,
  Position,
  NodeType,
  UseDragNodeReturn,
} from "@/types/drag";
import { INITIAL_DRAG_STATE } from "@/types/drag";

/**
 * Custom hook for managing node drag-and-drop operations
 * Handles dragging node type buttons from sidebar to canvas for node creation
 *
 * @param options - Hook configuration
 * @param options.onNodeCreate - Callback function to create node at drop position
 * @returns Object containing drag state and control functions
 *
 * @example
 * ```tsx
 * const { dragState, startDrag, endDrag, cancelDrag } = useDragNode({
 *   onNodeCreate: (nodeType, position) => {
 *     createNode(nodeType, position);
 *   }
 * });
 * ```
 */
export function useDragNode(options: {
  onNodeCreate: (nodeType: NodeType, position: Position) => void;
}): UseDragNodeReturn {
  const { onNodeCreate } = options;
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  /**
   * Initiates a node drag operation
   * Called when user starts dragging a node type button from sidebar
   *
   * @param nodeType - Type of node being dragged (business_metric, product_metric, etc.)
   * @param position - Starting screen position of the drag
   */
  const startDrag = (nodeType: NodeType, position: Position): void => {
    setDragState({
      isDragging: true,
      dragType: "node",
      sourceNodeId: null,
      activeNodeType: nodeType,
      cursorPosition: position,
      previewPosition: position,
      targetNodeId: null,
    });
  };

  /**
   * Updates the current drag position during drag movement
   * Called continuously as the user moves the cursor while dragging
   *
   * @param position - Current cursor position
   */
  const updateDragPosition = (position: Position): void => {
    setDragState((prev) => {
      if (!prev.isDragging) {
        return prev;
      }

      return {
        ...prev,
        cursorPosition: position,
        previewPosition: position,
      };
    });
  };

  /**
   * Completes the drag operation and creates the node
   * Called when user drops the node on the canvas
   *
   * @param dropPosition - Final drop position (canvas coordinates), or null to cancel
   */
  const endDrag = (dropPosition: Position | null): void => {
    setDragState((prev) => {
      if (prev.isDragging && dropPosition && prev.activeNodeType) {
        onNodeCreate(prev.activeNodeType, dropPosition);
      }
      return INITIAL_DRAG_STATE;
    });
  };

  /**
   * Cancels the current drag operation without creating a node
   * Called when user presses Escape or drops outside valid zone
   */
  const cancelDrag = (): void => {
    setDragState(INITIAL_DRAG_STATE);
  };

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
  };
}
