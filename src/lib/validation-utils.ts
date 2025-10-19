/**
 * Validation utilities for Impact Tree data structures
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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