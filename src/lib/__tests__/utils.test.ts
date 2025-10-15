import { describe, it, expect } from "vitest";
import { cn } from "../utils";

/**
 * Tests for the cn() utility function
 *
 * This utility merges Tailwind CSS classes intelligently,
 * preventing conflicts and ensuring consistent styling.
 */
describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conflicting Tailwind classes", () => {
    // Later class should take precedence
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should filter out falsy values", () => {
    const shouldHide = false;
    const result = cn(
      "base-class",
      shouldHide && "hidden-class",
      null,
      undefined,
      ""
    );
    expect(result).toBe("base-class");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["text-red-500", "bg-blue-500"], "p-4");
    expect(result).toBe("text-red-500 bg-blue-500 p-4");
  });

  it("should handle objects with conditional classes", () => {
    const result = cn({
      "text-red-500": true,
      "bg-blue-500": false,
      "p-4": true,
    });
    expect(result).toBe("text-red-500 p-4");
  });

  it("should merge multiple sources correctly", () => {
    const result = cn(
      "base-class",
      ["array-class-1", "array-class-2"],
      { "object-class": true, hidden: false },
      "final-class"
    );
    expect(result).toContain("base-class");
    expect(result).toContain("array-class-1");
    expect(result).toContain("array-class-2");
    expect(result).toContain("object-class");
    expect(result).toContain("final-class");
    expect(result).not.toContain("hidden");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should return empty string for all falsy values", () => {
    const result = cn(false, null, undefined, "");
    expect(result).toBe("");
  });
});
