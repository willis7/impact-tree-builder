/**
 * Centralized numeric constants to avoid magic numbers.
 *
 * Keep these values stable; changing them impacts rendering/export behavior.
 */

/** Default view box dimensions for the canvas. */
export const DEFAULT_VIEW_BOX = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
  scale: 1,
} as const;

/** Node rendering dimensions (SVG circle-based nodes). */
export const NODE_DIMENSIONS = {
  radius: 28,
  ringWidth: 4,
  /** Extra radius used for the animated selection ring. */
  selectionRingPadding: 4,
  /** Extra radius used for the hover/connect glow. */
  hoverGlowPadding: 6,
  /** Performance indicator (small dot) radius. */
  performanceIndicatorRadius: 6,
  /** Performance indicator stroke width. */
  performanceIndicatorStrokeWidth: 2,
  /** Performance indicator placement offsets from the node radius. */
  performanceIndicatorOffset: 4,
} as const;

/** Relationship rendering constants. */
export const RELATIONSHIP_RENDERING = {
  /** Invisible hit area stroke width for easier selection. */
  hitAreaStrokeWidth: 16,
  /** Bezier line dash pattern for connect-drag preview. */
  previewDashArray: "8,4",
  /** Selection ring stroke dash pattern. */
  selectionDashArray: "4,4",
} as const;

/** Canvas background/grid constants. */
export const CANVAS_BACKGROUND = {
  /** Grid pattern tile size in SVG user units. */
  gridSize: 40,
  /** Grid dot radius. */
  gridDotRadius: 1,
  /** Grid dot placement offset within the tile. */
  gridDotOffset: 20,
  /** Background rect extents for the infinite-canvas effect. */
  backgroundPadding: 5000,
  backgroundSize: 10000,
} as const;

/** Empty-state illustration size (Tailwind w-16/h-16). */
export const EMPTY_STATE = {
  iconSize: 16,
} as const;

/** Input handling constants for canvas interactions. */
export const CANVAS_INTERACTION = {
  /** Ignore clicks immediately after drag end to prevent accidental selection. */
  clickAfterDragIgnoreMs: 150,
  /** Mouse wheel zoom factors. */
  zoomOutFactor: 0.9,
  zoomInFactor: 1.1,
} as const;

/** Connection line bezier curve tuning. */
export const CONNECTION_CURVE = {
  /** Offset multiplier relative to line length. */
  controlPointDistanceFactor: 0.3,
  /** Clamp the control point offset to avoid overly-curvy short lines. */
  maxControlPointOffset: 100,
} as const;

/** Export-related constants. */
export const EXPORT = {
  /** Fallback canvas sizes if SVG has no client dimensions. */
  pngFallbackClientWidth: 800,
  pngFallbackClientHeight: 600,
  /** Canvas scale multiplier to improve PNG resolution. */
  pngScale: 2,
  /** Exported SVG node dimensions (legacy rectangle/ellipse representation). */
  svgNodeWidth: 150,
  svgNodeHeight: 50,
  svgNodeCornerRadius: 5,
  /** Padding around exported SVG bounds. */
  svgPadding: 50,
  /** Approximate node center used for relationship endpoints in exports. */
  svgNodeCenterX: 75,
  svgNodeCenterY: 25,
  /** Default stroke width for relationship lines in exports. */
  svgRelationshipStrokeWidth: 2,
} as const;
