import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { DragState as ActualDragState, NodeType } from "@/types/drag";
import type { ViewBox } from "./useCanvasOperations";

export interface UseDragOperationsState {
  viewBox: ViewBox;
  dragState: ActualDragState;
}

export interface UseDragOperationsActions {
  startDrag: (nodeType: NodeType, position: { x: number; y: number }) => void;
  endDrag: (position: { x: number; y: number } | null) => void;
  cancelDrag: () => void;
  setLastDragEndTime: (time: number) => void;
}

export interface UseDragOperationsReturn {
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

/**
 * Custom hook for managing drag operations
 */
export function useDragOperations(
  state: UseDragOperationsState,
  actions: UseDragOperationsActions,
  canvasElement: SVGSVGElement | null,
  mousePositionRef: React.MutableRefObject<{ x: number; y: number }>,
  lastDragIdRef: React.MutableRefObject<string | null>
): UseDragOperationsReturn {
  /**
   * Handles drag start event from DndContext
   * Initiates drag with useDragNode hook
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Reset the last drag ID for new drag operation
    lastDragIdRef.current = null;

    if (active?.data?.current?.nodeType) {
      const nodeType = active.data.current.nodeType as NodeType;
      // Start drag with initial cursor position (will be updated by DndContext)
      actions.startDrag(nodeType, { x: 0, y: 0 });
    }
  };

  /**
   * Handles the end of a drag operation
   * Transforms coordinates and creates node at drop position
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active, delta, activatorEvent } = event;

    // Create a unique ID for this drag event to prevent duplicate processing
    const dragEventId = `${active.id}-${Date.now()}`;

    // Check if we've already processed this exact drag event
    if (lastDragIdRef.current === dragEventId) {
      return;
    }

    lastDragIdRef.current = dragEventId;

    // Only create node if dropped over canvas and we have canvas element
    if (
      over?.id === "canvas-drop-zone" &&
      canvasElement &&
      state.dragState.isDragging
    ) {
      // Get mouse position - try activator + delta first, then fall back to ref
      let screenX = mousePositionRef.current.x;
      let screenY = mousePositionRef.current.y;

      if (
        activatorEvent &&
        "clientX" in activatorEvent &&
        "clientY" in activatorEvent &&
        delta
      ) {
        // Use clientX/clientY (viewport coordinates) not screenX/screenY (monitor coordinates)
        screenX = (activatorEvent.clientX as number) + delta.x;
        screenY = (activatorEvent.clientY as number) + delta.y;
      }

      // Convert screen coordinates to canvas coordinates
      // Try using SVG's native coordinate transformation first
      let canvasX, canvasY;

      if (canvasElement instanceof SVGSVGElement) {
        try {
          const pt = canvasElement.createSVGPoint();
          pt.x = screenX;
          pt.y = screenY;
          const ctm = canvasElement.getScreenCTM();
          if (ctm) {
            const svgPoint = pt.matrixTransform(ctm.inverse());
            canvasX = svgPoint.x;
            canvasY = svgPoint.y;
          }
        } catch {
          // SVG native transform failed, will use fallback
        }
      }

      // Fallback to manual calculation if native transform failed
      if (canvasX === undefined || canvasY === undefined) {
        const rect = canvasElement.getBoundingClientRect();

        // The actual viewBox dimensions on the SVG (scaled)
        const actualViewBoxWidth = state.viewBox.width / state.viewBox.scale;
        const actualViewBoxHeight = state.viewBox.height / state.viewBox.scale;

        // Transform: screen -> normalized (0-1) -> viewBox coordinates
        const normalizedX = (screenX - rect.left) / rect.width;
        const normalizedY = (screenY - rect.top) / rect.height;

        canvasX = state.viewBox.x + normalizedX * actualViewBoxWidth;
        canvasY = state.viewBox.y + normalizedY * actualViewBoxHeight;
      }

      actions.endDrag({ x: canvasX, y: canvasY });
      // Set timestamp to prevent click events immediately after drag
      actions.setLastDragEndTime(Date.now());
    } else {
      // Cancelled - dropped outside canvas
      actions.endDrag(null);
      actions.setLastDragEndTime(Date.now());
    }
  };

  /**
   * Handles drag cancellation (Escape key or invalid drop)
   * Calls hook's cancelDrag to reset state
   */
  const handleDragCancel = () => {
    actions.cancelDrag();
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}