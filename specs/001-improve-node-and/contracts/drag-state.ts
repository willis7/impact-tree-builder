/**
 * TypeScript Type Definitions for Drag-and-Drop Feature
 *
 * This file defines the contracts/interfaces for drag-and-drop state management.
 * These types should be imported into src/types/drag.ts when implementing the feature.
 *
 * @module DragStateContracts
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
 * Type of drag operation currently active
 */
export type DragType = "node" | "relationship";

/**
 * 2D position in screen or canvas coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Edge proximity measurements for auto-pan calculation
 */
export interface EdgeProximity {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Pan velocity vector
 */
export interface PanVelocity {
  x: number; // px per frame, range [-10, 10]
  y: number; // px per frame, range [-10, 10]
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
  dragType: DragType | null;
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
 * Auto-pan state for canvas panning during drag near edges
 *
 * @property isAutoPanning - Whether auto-pan is currently active
 * @property panVelocity - Current pan velocity in px per frame
 * @property edgeProximity - Distance from each viewport edge in pixels
 */
export interface AutoPanState {
  isAutoPanning: boolean;
  panVelocity: PanVelocity;
  edgeProximity: EdgeProximity;
}

/**
 * Initial auto-pan state (inactive)
 */
export const INITIAL_AUTO_PAN_STATE: AutoPanState = {
  isAutoPanning: false,
  panVelocity: { x: 0, y: 0 },
  edgeProximity: { left: 0, right: 0, top: 0, bottom: 0 },
};

/**
 * Keyboard mode state for keyboard-based node placement
 *
 * @property virtualCursorPosition - Cursor position controlled by arrow keys
 * @property keyboardMode - Whether keyboard mode is active
 * @property selectedNodeType - Node type selected via keyboard shortcut
 */
export interface KeyboardState {
  virtualCursorPosition: Position;
  keyboardMode: boolean;
  selectedNodeType: NodeType | null;
}

/**
 * Initial keyboard state (inactive)
 */
export const INITIAL_KEYBOARD_STATE: KeyboardState = {
  virtualCursorPosition: { x: 600, y: 400 }, // Center of default viewBox
  keyboardMode: false,
  selectedNodeType: null,
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
   * Update drag position as cursor moves
   * @param position - New cursor position
   */
  updateDragPosition: (position: Position) => void;

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
 * Custom hook return type for relationship drag operations
 */
export interface UseDragRelationshipReturn {
  /**
   * Start dragging from a source node
   * @param sourceNodeId - ID of the source node
   * @param position - Initial cursor position
   */
  startDrag: (sourceNodeId: string, position: Position) => void;

  /**
   * Update drag position as cursor moves
   * @param position - New cursor position
   */
  updateDragPosition: (position: Position) => void;

  /**
   * Set the target node for relationship (hover state)
   * @param targetNodeId - ID of potential target node, null if not over any node
   */
  setTargetNode: (targetNodeId: string | null) => void;

  /**
   * End drag operation and create relationship
   * @param targetNodeId - ID of target node, null to cancel
   */
  endDrag: (targetNodeId: string | null) => void;

  /**
   * Cancel drag operation without creating relationship
   */
  cancelDrag: () => void;

  /**
   * Current drag state
   */
  dragState: DragState;
}

/**
 * Custom hook return type for canvas auto-pan
 */
export interface UseCanvasAutoPanReturn {
  /**
   * Whether auto-pan is currently active
   */
  isAutoPanning: boolean;

  /**
   * Start auto-pan behavior
   * @param cursorPosition - Current cursor position in screen coordinates
   * @param canvasRect - Canvas bounding rectangle
   */
  startAutoPan: (cursorPosition: Position, canvasRect: DOMRect) => void;

  /**
   * Stop auto-pan behavior
   */
  stopAutoPan: () => void;
}

/**
 * Validation result for drag operations
 */
export interface DragValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Constants for drag-and-drop behavior
 */
export const DRAG_CONSTANTS = {
  /** Distance from viewport edge to trigger auto-pan (px) */
  EDGE_THRESHOLD: 50,

  /** Maximum pan speed (px per frame) */
  MAX_PAN_SPEED: 10,

  /** Acceleration factor for pan velocity calculation */
  ACCELERATION_FACTOR: 0.2,

  /** Arrow key movement increment (px) */
  KEYBOARD_MOVE_INCREMENT: 10,

  /** Debounce delay for cursor position updates (ms) */
  CURSOR_UPDATE_DELAY: 16, // ~60fps

  /** Toast message duration (ms) */
  ERROR_MESSAGE_DURATION: 3000,
} as const;

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
  Enter: "place_node",
  ArrowUp: "move_cursor_up",
  ArrowDown: "move_cursor_down",
  ArrowLeft: "move_cursor_left",
  ArrowRight: "move_cursor_right",

  // Modes
  c: "connect_mode",
  s: "select_mode",
} as const;

/**
 * Utility type for keyboard action handlers
 */
export type KeyboardAction =
  (typeof KEYBOARD_SHORTCUTS)[keyof typeof KEYBOARD_SHORTCUTS];

/**
 * Props for drag preview component
 */
export interface DragPreviewProps {
  nodeType: NodeType;
  position: Position;
  opacity?: number;
}

/**
 * Props for relationship line preview component
 */
export interface RelationshipPreviewProps {
  startPosition: Position;
  endPosition: Position;
  isValid: boolean;
}
