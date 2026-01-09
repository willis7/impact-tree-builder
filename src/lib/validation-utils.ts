/**
 * Validation utilities for Impact Tree data structures
 */

import type { ImpactTree, Node, Relationship, Measurement, TreeData } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Type guard to check if a value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard to check if a value has all required string properties
 */
function hasRequiredStringFields(
  obj: Record<string, unknown>,
  fields: string[]
): boolean {
  return fields.every((field) => field in obj);
}

/**
 * Type guard to validate ImpactTree structure
 */
export function isValidTree(value: unknown): value is ImpactTree {
  if (!isObject(value)) return false;
  const requiredFields = ["id", "name", "description", "created_date", "updated_date", "owner"];
  return hasRequiredStringFields(value, requiredFields);
}

/**
 * Type guard to validate Node structure
 */
export function isValidNode(value: unknown): value is Node {
  if (!isObject(value)) return false;
  const requiredFields = ["id", "name", "description", "node_type", "level", "position_x", "position_y", "color", "shape"];
  if (!hasRequiredStringFields(value, requiredFields)) return false;

  const nodeType = value.node_type;
  if (typeof nodeType !== "string") return false;
  // Note: 'initiative' is for backward compat with older files, new types include initiative_positive/negative
  if (!["business_metric", "product_metric", "initiative", "initiative_positive", "initiative_negative"].includes(nodeType)) {
    return false;
  }

  const shape = value.shape;
  if (typeof shape !== "string" || !["rectangle", "ellipse"].includes(shape)) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate Relationship structure
 */
export function isValidRelationship(value: unknown): value is Relationship {
  if (!isObject(value)) return false;
  const requiredFields = ["id", "source_node_id", "target_node_id", "relationship_type", "color", "strength"];
  if (!hasRequiredStringFields(value, requiredFields)) return false;

  const relType = value.relationship_type;
  if (typeof relType !== "string" || !["desirable_effect", "undesirable_effect", "rollup"].includes(relType)) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate Measurement structure
 */
export function isValidMeasurement(value: unknown): value is Measurement {
  if (!isObject(value)) return false;
  const requiredFields = ["id", "node_id", "metric_name", "expected_value", "actual_value", "measurement_date", "impact_type"];
  if (!hasRequiredStringFields(value, requiredFields)) return false;

  const impactType = value.impact_type;
  if (typeof impactType !== "string" || !["proximate", "downstream"].includes(impactType)) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate complete TreeData structure
 */
export function isValidTreeData(value: unknown): value is TreeData {
  if (!isObject(value)) return false;

  if (!isValidTree(value.tree)) return false;
  if (!Array.isArray(value.nodes)) return false;
  if (!Array.isArray(value.relationships)) return false;
  if (!Array.isArray(value.measurements)) return false;

  return true;
}

/**
 * Validates imported tree data structure
 * @param data - The parsed JSON data to validate
 * @returns Validation result with errors if any
 */
export function validateImportedData(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected an object');
    return { isValid: false, errors };
  }

  const treeData = data as Record<string, unknown>;

  // Validate tree
  if (!treeData.tree || typeof treeData.tree !== 'object') {
    errors.push('Missing or invalid tree data');
  } else {
    const tree = treeData.tree as Record<string, unknown>;
    const requiredTreeFields = ['id', 'name', 'description', 'created_date', 'updated_date', 'owner'];
    requiredTreeFields.forEach(field => {
      if (!(field in tree)) {
        errors.push(`Tree missing required field: ${field}`);
      }
    });
  }

  // Validate nodes array
  if (!Array.isArray(treeData.nodes)) {
    errors.push('Missing or invalid nodes array');
  } else {
    treeData.nodes.forEach((node: unknown, index: number) => {
      if (typeof node !== 'object' || node === null) {
        errors.push(`Node ${index} is not a valid object`);
        return;
      }
      const nodeObj = node as Record<string, unknown>;
      const requiredNodeFields = ['id', 'name', 'description', 'node_type', 'level', 'position_x', 'position_y', 'color', 'shape'];
      requiredNodeFields.forEach(field => {
        if (!(field in nodeObj)) {
          errors.push(`Node ${index} missing required field: ${field}`);
        }
      });
      if (nodeObj.node_type && typeof nodeObj.node_type === 'string' && !['business_metric', 'product_metric', 'initiative'].includes(nodeObj.node_type)) {
        errors.push(`Node ${index} has invalid node_type: ${nodeObj.node_type}`);
      }
      if (nodeObj.shape && typeof nodeObj.shape === 'string' && !['rectangle', 'ellipse'].includes(nodeObj.shape)) {
        errors.push(`Node ${index} has invalid shape: ${nodeObj.shape}`);
      }
    });
  }

  // Validate relationships array
  if (!Array.isArray(treeData.relationships)) {
    errors.push('Missing or invalid relationships array');
  } else {
    treeData.relationships.forEach((rel: unknown, index: number) => {
      if (typeof rel !== 'object' || rel === null) {
        errors.push(`Relationship ${index} is not a valid object`);
        return;
      }
      const relObj = rel as Record<string, unknown>;
      const requiredRelFields = ['id', 'source_node_id', 'target_node_id', 'relationship_type', 'color', 'strength'];
      requiredRelFields.forEach(field => {
        if (!(field in relObj)) {
          errors.push(`Relationship ${index} missing required field: ${field}`);
        }
      });
      if (relObj.relationship_type && typeof relObj.relationship_type === 'string' && !['desirable_effect', 'undesirable_effect', 'rollup'].includes(relObj.relationship_type)) {
        errors.push(`Relationship ${index} has invalid relationship_type: ${relObj.relationship_type}`);
      }
    });
  }

  // Validate measurements array
  if (!Array.isArray(treeData.measurements)) {
    errors.push('Missing or invalid measurements array');
  } else {
    treeData.measurements.forEach((meas: unknown, index: number) => {
      if (typeof meas !== 'object' || meas === null) {
        errors.push(`Measurement ${index} is not a valid object`);
        return;
      }
      const measObj = meas as Record<string, unknown>;
      const requiredMeasFields = ['id', 'node_id', 'metric_name', 'expected_value', 'actual_value', 'measurement_date', 'impact_type'];
      requiredMeasFields.forEach(field => {
        if (!(field in measObj)) {
          errors.push(`Measurement ${index} missing required field: ${field}`);
        }
      });
      if (measObj.impact_type && typeof measObj.impact_type === 'string' && !['proximate', 'downstream'].includes(measObj.impact_type)) {
        errors.push(`Measurement ${index} has invalid impact_type: ${measObj.impact_type}`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}