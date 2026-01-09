/**
 * Utility functions for drag-and-drop coordinate transformation and validation
 *
 * @module DragUtils
 */

import type { Position, DragValidationResult } from "../types/drag";

/**
 * Transform screen coordinates to canvas coordinates
 *
 * Converts mouse/pointer coordinates to SVG canvas coordinates,
 * accounting for zoom level and pan offset.
 *
 * Uses SVG's native coordinate transformation when available,
 * with a manual calculation fallback for robustness.
 *
 * @param screenPosition - Position in screen/viewport coordinates
 * @param canvasElement - SVG canvas element
 * @param viewBox - Current viewBox values [x, y, width, height, scale]
 * @returns Position in canvas coordinates
 */
export function screenToCanvasCoordinates(
  screenPosition: Position,
  canvasElement: SVGSVGElement,
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale?: number;
  }
): Position {
  // Try SVG's native coordinate transformation first (most accurate)
  try {
    const pt = canvasElement.createSVGPoint();
    pt.x = screenPosition.x;
    pt.y = screenPosition.y;
    const ctm = canvasElement.getScreenCTM();
    if (ctm) {
      const svgPoint = pt.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    }
  } catch {
    // SVG native transform failed, use fallback
  }

  // Fallback to manual calculation
  const rect = canvasElement.getBoundingClientRect();
  const scale = viewBox.scale || 1;

  // The actual viewBox dimensions on the SVG (scaled)
  const actualViewBoxWidth = viewBox.width / scale;
  const actualViewBoxHeight = viewBox.height / scale;

  // Transform: screen -> normalized (0-1) -> viewBox coordinates
  const normalizedX = (screenPosition.x - rect.left) / rect.width;
  const normalizedY = (screenPosition.y - rect.top) / rect.height;

  return {
    x: viewBox.x + normalizedX * actualViewBoxWidth,
    y: viewBox.y + normalizedY * actualViewBoxHeight,
  };
}

/**
 * Transform canvas coordinates to screen coordinates
 *
 * Converts SVG canvas coordinates to screen/viewport coordinates,
 * accounting for zoom level and pan offset.
 *
 * @param canvasPosition - Position in canvas coordinates
 * @param canvasElement - SVG canvas element
 * @param viewBox - Current viewBox values [x, y, width, height]
 * @returns Position in screen coordinates
 */
export function canvasToScreenCoordinates(
  canvasPosition: Position,
  canvasElement: SVGSVGElement,
  viewBox: { x: number; y: number; width: number; height: number }
): Position {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = rect.width / viewBox.width;
  const scaleY = rect.height / viewBox.height;

  return {
    x: rect.left + (canvasPosition.x - viewBox.x) * scaleX,
    y: rect.top + (canvasPosition.y - viewBox.y) * scaleY,
  };
}

/**
 * Validate if a position is within a valid drop zone on the canvas
 *
 * Checks if the drop position is within the canvas bounds.
 *
 * @param canvasPosition - Position in canvas coordinates
 * @param viewBox - Current viewBox values [x, y, width, height]
 * @returns Validation result with error message if invalid
 */
export function validateNodeDropZone(
  canvasPosition: Position,
  viewBox: { x: number; y: number; width: number; height: number }
): DragValidationResult {
  // Check if position is within canvas bounds
  const isWithinBounds =
    canvasPosition.x >= viewBox.x &&
    canvasPosition.x <= viewBox.x + viewBox.width &&
    canvasPosition.y >= viewBox.y &&
    canvasPosition.y <= viewBox.y + viewBox.height;

  if (!isWithinBounds) {
    return {
      isValid: false,
      errorMessage: "Drop position is outside canvas bounds",
    };
  }

  return { isValid: true };
}

/**
 * Validate if a target node is valid for relationship creation
 *
 * Checks if the relationship can be created between source and target nodes.
 *
 * @param sourceNodeId - ID of the source node
 * @param targetNodeId - ID of the target node
 * @param existingRelationships - Array of existing relationships
 * @param relationshipType - Type of relationship being created
 * @returns Validation result with error message if invalid
 */
export function validateRelationshipTarget(
  sourceNodeId: string,
  targetNodeId: string,
  existingRelationships: Array<{
    source_id: string;
    target_id: string;
    relationship_type: string;
  }>,
  relationshipType: string
): DragValidationResult {
  // Prevent self-relationships (FR-020)
  if (sourceNodeId === targetNodeId) {
    return {
      isValid: false,
      errorMessage: "Cannot create relationship from a node to itself",
    };
  }

  // Prevent duplicate relationships (FR-015)
  const isDuplicate = existingRelationships.some(
    (rel) =>
      rel.source_id === sourceNodeId &&
      rel.target_id === targetNodeId &&
      rel.relationship_type === relationshipType
  );

  if (isDuplicate) {
    return {
      isValid: false,
      errorMessage: "Relationship already exists between these nodes",
    };
  }

  return { isValid: true };
}
