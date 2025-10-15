/**
 * Unit tests for drag-and-drop utility functions
 *
 * @module DragUtilsTests
 */

import { describe, it, expect } from "vitest";
import {
  screenToCanvasCoordinates,
  canvasToScreenCoordinates,
  validateNodeDropZone,
  validateRelationshipTarget,
} from "../drag-utils";
import type { Position } from "../../types/drag";

describe("drag-utils", () => {
  describe("screenToCanvasCoordinates", () => {
    it("should convert screen coordinates to canvas coordinates with no zoom/pan", () => {
      // Create a mock SVG element with getBoundingClientRect
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const screenPos: Position = { x: 600, y: 400 };

      const result = screenToCanvasCoordinates(screenPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 600, y: 400 });
    });

    it("should convert screen coordinates to canvas coordinates with zoom in (scale 2x)", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      // ViewBox is smaller than screen (zoomed in)
      const viewBox = { x: 0, y: 0, width: 600, height: 400 };
      const screenPos: Position = { x: 600, y: 400 };

      const result = screenToCanvasCoordinates(screenPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 300, y: 200 });
    });

    it("should convert screen coordinates to canvas coordinates with zoom out (scale 0.5x)", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      // ViewBox is larger than screen (zoomed out)
      const viewBox = { x: 0, y: 0, width: 2400, height: 1600 };
      const screenPos: Position = { x: 600, y: 400 };

      const result = screenToCanvasCoordinates(screenPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 1200, y: 800 });
    });

    it("should account for canvas offset when converting coordinates", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 100,
          top: 50,
          width: 1200,
          height: 800,
          right: 1300,
          bottom: 850,
          x: 100,
          y: 50,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const screenPos: Position = { x: 700, y: 450 }; // 600px from left edge, 400px from top edge

      const result = screenToCanvasCoordinates(screenPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 600, y: 400 });
    });

    it("should handle panned viewBox (non-zero x, y)", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 200, y: 100, width: 1200, height: 800 };
      const screenPos: Position = { x: 600, y: 400 };

      const result = screenToCanvasCoordinates(screenPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 800, y: 500 });
    });
  });

  describe("canvasToScreenCoordinates", () => {
    it("should convert canvas coordinates to screen coordinates with no zoom/pan", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const canvasPos: Position = { x: 600, y: 400 };

      const result = canvasToScreenCoordinates(canvasPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 600, y: 400 });
    });

    it("should convert canvas coordinates to screen coordinates with zoom in", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 0, y: 0, width: 600, height: 400 };
      const canvasPos: Position = { x: 300, y: 200 };

      const result = canvasToScreenCoordinates(canvasPos, mockSVG, viewBox);

      expect(result).toEqual({ x: 600, y: 400 });
    });

    it("should be inverse of screenToCanvasCoordinates", () => {
      const mockSVG = {
        getBoundingClientRect: () => ({
          left: 100,
          top: 50,
          width: 1200,
          height: 800,
          right: 1300,
          bottom: 850,
          x: 100,
          y: 50,
          toJSON: () => ({}),
        }),
      } as SVGSVGElement;

      const viewBox = { x: 200, y: 100, width: 600, height: 400 };
      const originalScreen: Position = { x: 700, y: 450 };

      const canvasPos = screenToCanvasCoordinates(
        originalScreen,
        mockSVG,
        viewBox
      );
      const backToScreen = canvasToScreenCoordinates(
        canvasPos,
        mockSVG,
        viewBox
      );

      expect(backToScreen.x).toBeCloseTo(originalScreen.x, 5);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y, 5);
    });
  });

  describe("validateNodeDropZone", () => {
    it("should validate position within canvas bounds", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: 600, y: 400 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should invalidate position outside left bound", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: -10, y: 400 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Drop position is outside canvas bounds"
      );
    });

    it("should invalidate position outside right bound", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: 1250, y: 400 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Drop position is outside canvas bounds"
      );
    });

    it("should invalidate position outside top bound", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: 600, y: -10 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Drop position is outside canvas bounds"
      );
    });

    it("should invalidate position outside bottom bound", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: 600, y: 850 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Drop position is outside canvas bounds"
      );
    });

    it("should validate position on viewBox edge (boundary case)", () => {
      const viewBox = { x: 0, y: 0, width: 1200, height: 800 };
      const position: Position = { x: 1200, y: 800 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(true);
    });

    it("should handle panned viewBox correctly", () => {
      const viewBox = { x: 200, y: 100, width: 1200, height: 800 };
      const position: Position = { x: 800, y: 500 };

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(true);
    });

    it("should invalidate position in panned viewBox outside bounds", () => {
      const viewBox = { x: 200, y: 100, width: 1200, height: 800 };
      const position: Position = { x: 100, y: 50 }; // Outside left/top of panned viewBox

      const result = validateNodeDropZone(position, viewBox);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Drop position is outside canvas bounds"
      );
    });
  });

  describe("validateRelationshipTarget", () => {
    const existingRelationships = [
      {
        source_id: "node1",
        target_id: "node2",
        relationship_type: "drives",
      },
      {
        source_id: "node2",
        target_id: "node3",
        relationship_type: "influences",
      },
      {
        source_id: "node1",
        target_id: "node3",
        relationship_type: "drives",
      },
    ];

    it("should validate relationship between different nodes", () => {
      const result = validateRelationshipTarget(
        "node1",
        "node4",
        existingRelationships,
        "drives"
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should prevent self-relationship (FR-020)", () => {
      const result = validateRelationshipTarget(
        "node1",
        "node1",
        existingRelationships,
        "drives"
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Cannot create relationship from a node to itself"
      );
    });

    it("should prevent duplicate relationships (FR-015)", () => {
      const result = validateRelationshipTarget(
        "node1",
        "node2",
        existingRelationships,
        "drives"
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Relationship already exists between these nodes"
      );
    });

    it("should allow same nodes with different relationship types", () => {
      const result = validateRelationshipTarget(
        "node1",
        "node2",
        existingRelationships,
        "influences" // Different type than existing "drives"
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should allow reverse direction relationship", () => {
      const result = validateRelationshipTarget(
        "node2",
        "node1",
        existingRelationships,
        "drives"
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should work with empty relationships array", () => {
      const result = validateRelationshipTarget("node1", "node2", [], "drives");

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should handle case-sensitive node IDs", () => {
      const result = validateRelationshipTarget(
        "Node1",
        "node2",
        existingRelationships,
        "drives"
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle case-sensitive relationship types", () => {
      const result = validateRelationshipTarget(
        "node1",
        "node2",
        existingRelationships,
        "Drives" // Capital D
      );

      expect(result.isValid).toBe(true);
    });
  });
});
