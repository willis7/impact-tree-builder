/**
 * TypeScript Type Definitions for Drag-and-Drop Feature
 *
 * This file defines the contracts/interfaces for drag-and-drop state management.
 *
 * @module DragState
 */

/**
 * Node types available for creation via drag-and-drop
 */
export type NodeType =
  | "business_metric"
  | "product_metric"
  | "initiative_positive"
  | "initiative_negative";

/**
 * 2D position in screen or canvas coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Global drag state tracking active drag operations
 *
 * @property isDragging - Whether a drag operation is currently active
 * @property dragType - Type of drag operation (node or relationship), null when not dragging
 * @property sourceNodeId - Source node ID for relationship drag, null for node drag
 * @property activeNodeType - Node type being dragged, null for relationship drag
 * @property cursorPosition - Current cursor position in screen coordinates
 * @property previewPosition - Preview element position in canvas coordinates
 * @property targetNodeId - Potential drop target node ID (relationship drag only)
 */
export interface DragState {
  isDragging: boolean;
  dragType: "node" | "relationship" | null;
  sourceNodeId: string | null;
  activeNodeType: NodeType | null;
  cursorPosition: Position;
  previewPosition: Position;
  targetNodeId: string | null;
}

/**
 * Initial drag state (no drag active)
 */
export const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  dragType: null,
  sourceNodeId: null,
  activeNodeType: null,
  cursorPosition: { x: 0, y: 0 },
  previewPosition: { x: 0, y: 0 },
  targetNodeId: null,
};

/**
 * Custom hook return type for node drag operations
 */
export interface UseDragNodeReturn {
  /**
   * Start dragging a node type
   * @param nodeType - Type of node to create
   * @param position - Initial cursor position
   */
  startDrag: (nodeType: NodeType, position: Position) => void;

  /**
   * End drag operation and create node
   * @param dropPosition - Canvas coordinates for node creation, null to cancel
   */
  endDrag: (dropPosition: Position | null) => void;

  /**
   * Cancel drag operation without creating node
   */
  cancelDrag: () => void;

  /**
   * Current drag state
   */
  dragState: DragState;
}

/**
 * Validation result for drag operations
 */
export interface DragValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Keyboard shortcuts mapping
 */
export const KEYBOARD_SHORTCUTS = {
  // Node type selection
  b: "business_metric" as NodeType,
  p: "product_metric" as NodeType,
  i: "initiative_positive" as NodeType,
  n: "initiative_negative" as NodeType,

  // Actions
  Escape: "cancel_drag",

  // Modes
  c: "connect_mode",
  s: "select_mode",
} as const;
