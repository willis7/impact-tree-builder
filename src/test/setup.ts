import * as React from "react";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Radix Tooltip uses async state updates that can emit noisy React act() warnings
// in unit tests. We don't need Tooltip behavior in unit tests, so mock to
// synchronous pass-through components.
vi.mock("@/components/ui/tooltip", () => {
  const Passthrough = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children;

  return {
    TooltipProvider: Passthrough,
    Tooltip: Passthrough,
    TooltipTrigger: Passthrough,
    TooltipContent: () => null,
  };
});
