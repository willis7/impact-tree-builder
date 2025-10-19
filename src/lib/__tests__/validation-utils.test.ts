import { describe, it, expect } from "vitest";
import { validateImportedData } from "../validation-utils";

describe("Validation Utils", () => {
  describe("validateImportedData", () => {
    it("validates correct complete data structure", () => {
      const validData = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [{
          id: "node1",
          name: "Test Node",
          description: "Test Node Description",
          node_type: "business_metric",
          level: 1,
          position_x: 100,
          position_y: 100,
          color: "#ff0000",
          shape: "rectangle"
        }],
        relationships: [{
          id: "rel1",
          source_node_id: "node1",
          target_node_id: "node2",
          relationship_type: "desirable_effect",
          color: "#00ff00",
          strength: 1.0
        }],
        measurements: [{
          id: "meas1",
          node_id: "node1",
          metric_name: "Test Metric",
          expected_value: 100,
          actual_value: 95,
          measurement_date: "2024-01-01",
          impact_type: "proximate"
        }]
      };

      const result = validateImportedData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects non-object data", () => {
      const result = validateImportedData("invalid");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid data format: expected an object');
    });

    it("rejects null data", () => {
      const result = validateImportedData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid data format: expected an object');
    });

    it("rejects undefined data", () => {
      const result = validateImportedData(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid data format: expected an object');
    });

    it("validates tree structure", () => {
      const dataWithoutTree = {
        nodes: [],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithoutTree);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid tree data');
    });

    it("validates required tree fields", () => {
      const dataWithIncompleteTree = {
        tree: {
          id: "test-tree",
          name: "Test Tree"
          // missing description, created_date, updated_date, owner
        },
        nodes: [],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithIncompleteTree);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tree missing required field: description');
      expect(result.errors).toContain('Tree missing required field: created_date');
      expect(result.errors).toContain('Tree missing required field: updated_date');
      expect(result.errors).toContain('Tree missing required field: owner');
    });

    it("validates nodes array", () => {
      const dataWithoutNodes = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithoutNodes);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid nodes array');
    });

    it("validates node objects", () => {
      const dataWithInvalidNode = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: ["invalid node"],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithInvalidNode);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Node 0 is not a valid object');
    });

    it("validates required node fields", () => {
      const dataWithIncompleteNode = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [{
          id: "node1",
          name: "Test Node"
          // missing description, node_type, level, position_x, position_y, color, shape
        }],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithIncompleteNode);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Node 0 missing required field: description');
      expect(result.errors).toContain('Node 0 missing required field: node_type');
      expect(result.errors).toContain('Node 0 missing required field: level');
      expect(result.errors).toContain('Node 0 missing required field: position_x');
      expect(result.errors).toContain('Node 0 missing required field: position_y');
      expect(result.errors).toContain('Node 0 missing required field: color');
      expect(result.errors).toContain('Node 0 missing required field: shape');
    });

    it("validates node_type values", () => {
      const dataWithInvalidNodeType = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [{
          id: "node1",
          name: "Test Node",
          description: "Test Description",
          node_type: "invalid_type",
          level: 1,
          position_x: 100,
          position_y: 100,
          color: "#ff0000",
          shape: "rectangle"
        }],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithInvalidNodeType);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Node 0 has invalid node_type: invalid_type');
    });

    it("validates shape values", () => {
      const dataWithInvalidShape = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [{
          id: "node1",
          name: "Test Node",
          description: "Test Description",
          node_type: "business_metric",
          level: 1,
          position_x: 100,
          position_y: 100,
          color: "#ff0000",
          shape: "invalid_shape"
        }],
        relationships: [],
        measurements: []
      };

      const result = validateImportedData(dataWithInvalidShape);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Node 0 has invalid shape: invalid_shape');
    });

    it("validates relationships array", () => {
      const dataWithoutRelationships = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        measurements: []
      };

      const result = validateImportedData(dataWithoutRelationships);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid relationships array');
    });

    it("validates relationship objects", () => {
      const dataWithInvalidRelationship = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: ["invalid relationship"],
        measurements: []
      };

      const result = validateImportedData(dataWithInvalidRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Relationship 0 is not a valid object');
    });

    it("validates required relationship fields", () => {
      const dataWithIncompleteRelationship = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: [{
          id: "rel1",
          source_node_id: "node1"
          // missing target_node_id, relationship_type, color, strength
        }],
        measurements: []
      };

      const result = validateImportedData(dataWithIncompleteRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Relationship 0 missing required field: target_node_id');
      expect(result.errors).toContain('Relationship 0 missing required field: relationship_type');
      expect(result.errors).toContain('Relationship 0 missing required field: color');
      expect(result.errors).toContain('Relationship 0 missing required field: strength');
    });

    it("validates relationship_type values", () => {
      const dataWithInvalidRelationshipType = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: [{
          id: "rel1",
          source_node_id: "node1",
          target_node_id: "node2",
          relationship_type: "invalid_type",
          color: "#00ff00",
          strength: 1.0
        }],
        measurements: []
      };

      const result = validateImportedData(dataWithInvalidRelationshipType);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Relationship 0 has invalid relationship_type: invalid_type');
    });

    it("validates measurements array", () => {
      const dataWithoutMeasurements = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: []
      };

      const result = validateImportedData(dataWithoutMeasurements);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid measurements array');
    });

    it("validates measurement objects", () => {
      const dataWithInvalidMeasurement = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: [],
        measurements: ["invalid measurement"]
      };

      const result = validateImportedData(dataWithInvalidMeasurement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Measurement 0 is not a valid object');
    });

    it("validates required measurement fields", () => {
      const dataWithIncompleteMeasurement = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: [],
        measurements: [{
          id: "meas1",
          node_id: "node1"
          // missing metric_name, expected_value, actual_value, measurement_date, impact_type
        }]
      };

      const result = validateImportedData(dataWithIncompleteMeasurement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Measurement 0 missing required field: metric_name');
      expect(result.errors).toContain('Measurement 0 missing required field: expected_value');
      expect(result.errors).toContain('Measurement 0 missing required field: actual_value');
      expect(result.errors).toContain('Measurement 0 missing required field: measurement_date');
      expect(result.errors).toContain('Measurement 0 missing required field: impact_type');
    });

    it("validates impact_type values", () => {
      const dataWithInvalidImpactType = {
        tree: {
          id: "test-tree",
          name: "Test Tree",
          description: "Test Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [],
        relationships: [],
        measurements: [{
          id: "meas1",
          node_id: "node1",
          metric_name: "Test Metric",
          expected_value: 100,
          actual_value: 95,
          measurement_date: "2024-01-01",
          impact_type: "invalid_type"
        }]
      };

      const result = validateImportedData(dataWithInvalidImpactType);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Measurement 0 has invalid impact_type: invalid_type');
    });

    it("accumulates multiple validation errors", () => {
      const invalidData = {
        tree: { id: "test" }, // missing required fields
        nodes: [null], // invalid node
        relationships: [null], // invalid relationship
        measurements: [null] // invalid measurement
      };

      const result = validateImportedData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});