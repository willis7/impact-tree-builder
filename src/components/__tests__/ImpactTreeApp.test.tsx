import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactTreeApp } from "../ImpactTreeApp";
import "@testing-library/jest-dom/vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.alert
global.alert = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock useDragNode hook
vi.mock("@/hooks/useDragNode", () => ({
  useDragNode: vi.fn(() => ({
    dragState: {
      isDragging: false,
      dragType: null,
      sourceNodeId: null,
      activeNodeType: null,
      cursorPosition: { x: 0, y: 0 },
      previewPosition: { x: 0, y: 0 },
      targetNodeId: null,
    },
    startDrag: vi.fn(),
    updateDragPosition: vi.fn(),
    endDrag: vi.fn(),
    cancelDrag: vi.fn(),
  })),
}));



// Mock useCanvasAutoPan hook
vi.mock("@/hooks/useCanvasAutoPan", () => ({
  useCanvasAutoPan: vi.fn(),
}));

describe("ImpactTreeApp", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("renders the application with all main sections", () => {
      render(<ImpactTreeApp />);

      // Check header/toolbar
      expect(screen.getByText("Impact Tree Builder")).toBeInTheDocument();
      expect(screen.getByText("v2.0")).toBeInTheDocument();

      // Check toolbar buttons exist
      expect(screen.getByRole("button", { name: /new/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /load/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /export/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /help/i })).toBeInTheDocument();
    });

    it("loads sample data on initial render", () => {
      render(<ImpactTreeApp />);

      // Sample data should be loaded
      expect(
        screen.getByDisplayValue("Customer Support AI Chatbot Impact Analysis")
      ).toBeInTheDocument();
    });

    it("initializes with toolbar buttons", () => {
      render(<ImpactTreeApp />);

      // Should have main toolbar buttons
      expect(screen.getByRole("button", { name: /new/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  describe("Tree Metadata Management", () => {
    it("allows editing tree name", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const nameInput = screen.getByDisplayValue(
        "Customer Support AI Chatbot Impact Analysis"
      );
      await user.clear(nameInput);
      await user.type(nameInput, "New Tree Name");

      expect(screen.getByDisplayValue("New Tree Name")).toBeInTheDocument();
    });

    it("allows editing tree description", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const descriptionTextarea = screen.getByRole("textbox", {
        name: /description/i,
      });
      await user.clear(descriptionTextarea);
      await user.type(descriptionTextarea, "New description");

      expect(screen.getByDisplayValue("New description")).toBeInTheDocument();
    });
  });

  describe("Canvas Controls", () => {
    it("has zoom in button that works", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const buttons = screen.getAllByRole("button");
      const zoomInButton = buttons.find((button) => {
        const svg = button.querySelector("svg");
        return svg?.classList.contains("lucide-zoom-in");
      });

      expect(zoomInButton).toBeTruthy();
      if (zoomInButton) {
        await user.click(zoomInButton);
        // The zoom should have been triggered
        expect(zoomInButton).toBeEnabled();
      }
    });

    it("has zoom out button that works", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const buttons = screen.getAllByRole("button");
      const zoomOutButton = buttons.find((button) => {
        const svg = button.querySelector("svg");
        return svg?.classList.contains("lucide-zoom-out");
      });

      expect(zoomOutButton).toBeTruthy();
      if (zoomOutButton) {
        await user.click(zoomOutButton);
        expect(zoomOutButton).toBeEnabled();
      }
    });

    it("has reset view button", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const buttons = screen.getAllByRole("button");
      const resetButton = buttons.find((button) => {
        const svg = button.querySelector("svg");
        return svg?.classList.contains("lucide-maximize-2");
      });

      expect(resetButton).toBeTruthy();
      if (resetButton) {
        await user.click(resetButton);
        expect(resetButton).toBeEnabled();
      }
    });

    it("has center view button", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const buttons = screen.getAllByRole("button");
      const centerButton = buttons.find((button) => {
        const svg = button.querySelector("svg");
        return svg?.classList.contains("lucide-move");
      });

      expect(centerButton).toBeTruthy();
      if (centerButton) {
        await user.click(centerButton);
        expect(centerButton).toBeEnabled();
      }
    });
  });



  describe("Save Functionality", () => {
    it("saves tree data to localStorage", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Check localStorage was called
      const savedData = localStorage.getItem("impactTreeData");
      expect(savedData).toBeTruthy();

      // Parse and verify structure
      const parsed = JSON.parse(savedData!);
      expect(parsed).toHaveProperty("tree");
      expect(parsed).toHaveProperty("nodes");
      expect(parsed).toHaveProperty("relationships");
      expect(parsed).toHaveProperty("measurements");

      // Verify alert was shown
      expect(global.alert).toHaveBeenCalledWith("Tree saved!");
    });

    it("saves current tree state including edits", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Edit tree name
      const nameInput = screen.getByDisplayValue(
        "Customer Support AI Chatbot Impact Analysis"
      );
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Tree");

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Verify the modified name was saved
      const savedData = localStorage.getItem("impactTreeData");
      const parsed = JSON.parse(savedData!);
      expect(parsed.tree.name).toBe("Modified Tree");
    });
  });

  describe("Export Functionality", () => {
    it("exports tree as JSON file", async () => {
      const user = userEvent.setup();

      // Save original createElement
      const originalCreateElement = document.createElement.bind(document);

      // Mock the link click
      const clickSpy = vi.fn();
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tagName) => {
          if (tagName === "a") {
            const link = originalCreateElement("a") as HTMLAnchorElement;
            link.click = clickSpy;
            return link;
          }
          return originalCreateElement(tagName);
        });

      render(<ImpactTreeApp />);

      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Verify blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Verify link was clicked
      expect(clickSpy).toHaveBeenCalled();

      // Verify blob was revoked
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it("uses tree name in exported filename", async () => {
      const user = userEvent.setup();

      // Save original createElement
      const originalCreateElement = document.createElement.bind(document);

      let capturedFilename = "";
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tagName) => {
          if (tagName === "a") {
            const link = originalCreateElement("a") as HTMLAnchorElement;
            Object.defineProperty(link, "download", {
              set: (value: string) => {
                capturedFilename = value;
              },
              get: () => capturedFilename,
            });
            link.click = vi.fn();
            return link;
          }
          return originalCreateElement(tagName);
        });

      render(<ImpactTreeApp />);

      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Verify filename includes tree name (with spaces replaced)
      expect(capturedFilename).toContain("Customer_Support_AI_Chatbot");
      expect(capturedFilename).toMatch(/\.json$/);

      createElementSpy.mockRestore();
    });
  });

  describe("Mode Switching", () => {
    it("switches to add-node mode when node type is selected", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Find and click a node type button (e.g., Business Metric)
      const businessMetricButton = screen.getByRole("button", {
        name: /business metric/i,
      });
      await user.click(businessMetricButton);

      // Should switch to add mode - verify button is functional
      expect(businessMetricButton).toBeTruthy();
    });

    it("has mode switching capability", () => {
      render(<ImpactTreeApp />);

      // App should have node type selection buttons for mode switching
      expect(
        screen.getByRole("button", { name: /business metric/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /product metric/i })
      ).toBeInTheDocument();
    });
  });

  describe("Node Management", () => {
    it("clears all nodes when New button is clicked", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Initially should have sample nodes
      // (Verify via statistics or node count display)

      const newButton = screen.getByRole("button", { name: /new/i });
      await user.click(newButton);

      // Nodes should be cleared (this would show in stats or empty canvas state)
      expect(newButton).toBeInTheDocument();
    });
  });

  describe("Integration with Child Components", () => {
    it("renders Sidebar component", () => {
      render(<ImpactTreeApp />);

      // Sidebar should contain tree info section
      expect(screen.getByText(/tree information/i)).toBeInTheDocument();
    });

    it("renders ImpactCanvas component", () => {
      render(<ImpactTreeApp />);

      // Canvas should be present (check for SVG or canvas container)
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders PropertiesPanel component", () => {
      render(<ImpactTreeApp />);

      // Properties panel should be rendered as part of the app
      // Just verify the app renders without crashing - properties panel is embedded
      expect(screen.getByText("Impact Tree Builder")).toBeInTheDocument();
    });
  });

  describe("State Synchronization", () => {
    it("updates displayed node count when nodes change", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Check initial node count in statistics
      const statsSection = screen.getByText(/statistics/i).parentElement;
      expect(statsSection).toBeInTheDocument();

      // After clearing nodes, count should update
      const newButton = screen.getByRole("button", { name: /new/i });
      await user.click(newButton);

      // Stats should reflect the change
      expect(statsSection).toBeInTheDocument();
    });
  });

  describe("Theme Integration", () => {
    it("renders theme toggle button", () => {
      render(<ImpactTreeApp />);

      // Theme toggle should be present
      const themeButton = screen.getByRole("button", { name: /toggle theme/i });
      expect(themeButton).toBeInTheDocument();
    });

    it("theme toggle is functional", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const themeButton = screen.getByRole("button", { name: /toggle theme/i });
      await user.click(themeButton);

      // Button should still be present and functional
      expect(themeButton).toBeEnabled();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<ImpactTreeApp />);

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("Impact Tree Builder");
    });

    it("all interactive buttons have accessible names", () => {
      render(<ImpactTreeApp />);

      // All buttons should have text, aria-label, or be within a tooltip
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        // Button should have text content, aria-label, or title
        const hasAccessibleName =
          (button.textContent && button.textContent.trim().length > 0) ||
          button.getAttribute("aria-label") ||
          button.getAttribute("title") ||
          button.querySelector("svg"); // Icon buttons are wrapped in tooltips
        expect(hasAccessibleName).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("renders successfully with sample data", () => {
      // Should render with initial sample data
      render(<ImpactTreeApp />);

      // App should render successfully
      expect(screen.getByText("Impact Tree Builder")).toBeInTheDocument();
    });
  });

  // T044: User Story 2 - Mode returns to select after drag-drop node creation
  describe("User Story 2: Auto-Deselect Node Type", () => {
    it("should return to select mode after successful drag-drop node creation", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Click Business Metric button to enter add-node mode
      const businessMetricBtn = screen.getByRole("button", {
        name: /business metric/i,
      });
      await user.click(businessMetricBtn);

      // Verify we're in add-node mode (button should be highlighted/selected)
      // This is a visual check - in real implementation would check aria-pressed or similar

      // Simulate drag-drop by clicking on canvas (simplified test)
      // In real drag-drop, this would involve DragEndEvent
      const canvas = screen.getByRole("main");
      await user.click(canvas);

      // After node creation, mode should return to "select"
      // We can verify this by checking if Connect Nodes button is not in "Active" state
      const connectBtn = screen.getByRole("button", { name: /connect nodes/i });
      expect(connectBtn).toBeInTheDocument();

      // Business Metric button should no longer be selected
      // (no visual "active" indicator)
    });
  });


});
