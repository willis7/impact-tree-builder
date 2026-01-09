/**
 * Utility functions and configuration for node types
 *
 * @module NodeUtils
 */

import type { NodeType } from "@/types/drag";

/**
 * Configuration for a node type including visual and metadata properties
 */
export interface NodeTypeConfig {
  /** Display label for the node type */
  label: string;
  /** CSS color value for the node */
  color: string;
  /** Tailwind background color class */
  bgClass: string;
  /** Shape of the node: rounded rectangle or ellipse */
  shape: "rounded" | "rounded-full";
  /** SVG shape type for canvas rendering */
  svgShape: "rectangle" | "ellipse";
  /** Hierarchy level (1 = business, 2 = product, 3 = initiative) */
  level: number;
  /** Keyboard shortcut for this node type */
  shortcut: string;
  /** Tooltip description */
  tooltip: string;
}

/**
 * Centralized configuration for all node types
 *
 * Single source of truth for node styling and metadata.
 * Used by Sidebar, useNodeOperations, and other components.
 */
export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  business_metric: {
    label: "Business Metric",
    color: "#2E7D32",
    bgClass: "bg-[#2E7D32]",
    shape: "rounded",
    svgShape: "rectangle",
    level: 1,
    shortcut: "B",
    tooltip: "Add a business outcome or goal metric",
  },
  product_metric: {
    label: "Product Metric",
    color: "#1976D2",
    bgClass: "bg-[#1976D2]",
    shape: "rounded",
    svgShape: "rectangle",
    level: 2,
    shortcut: "P",
    tooltip: "Add a product or feature metric",
  },
  initiative_positive: {
    label: "Positive Initiative",
    color: "#FF6F00",
    bgClass: "bg-[#FF6F00]",
    shape: "rounded-full",
    svgShape: "ellipse",
    level: 3,
    shortcut: "I",
    tooltip: "Add an initiative with positive impact",
  },
  initiative_negative: {
    label: "Negative Initiative",
    color: "#D32F2F",
    bgClass: "bg-[#D32F2F]",
    shape: "rounded-full",
    svgShape: "ellipse",
    level: 3,
    shortcut: "N",
    tooltip: "Add an initiative with negative impact",
  },
} as const;

/**
 * Get the display label for a node type
 *
 * Handles both full NodeType values and the simplified "initiative" type
 * stored in Node.node_type.
 *
 * @param nodeType - The node type identifier
 * @returns Human-readable label for the node type
 */
export function getNodeTypeLabel(nodeType: string): string {
  // Handle NodeType values
  if (nodeType in NODE_TYPE_CONFIG) {
    return NODE_TYPE_CONFIG[nodeType as NodeType].label;
  }

  // Handle simplified node_type values (stored in Node interface)
  switch (nodeType) {
    case "business_metric":
      return "Business Metric";
    case "product_metric":
      return "Product Metric";
    case "initiative":
      return "Initiative";
    default:
      return nodeType;
  }
}

/**
 * Get visual properties for a node type
 *
 * @param nodeType - The node type identifier
 * @returns Object with color, shape, and level properties
 */
export function getNodeProperties(nodeType: string): {
  color: string;
  shape: "rectangle" | "ellipse";
  level: number;
} {
  if (nodeType in NODE_TYPE_CONFIG) {
    const config = NODE_TYPE_CONFIG[nodeType as NodeType];
    return {
      color: config.color,
      shape: config.svgShape,
      level: config.level,
    };
  }

  // Default fallback
  return {
    color: "#1976D2",
    shape: "rectangle",
    level: 2,
  };
}
