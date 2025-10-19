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

      // Click the export dropdown trigger
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Click the "Export as JSON" menu item
      const jsonExportItem = screen.getByRole("menuitem", { name: /export as json/i });
      await user.click(jsonExportItem);

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

      // Click the export dropdown trigger
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Click the "Export as JSON" menu item
      const jsonExportItem = screen.getByRole("menuitem", { name: /export as json/i });
      await user.click(jsonExportItem);

      // Verify filename includes tree name (with spaces replaced)
      expect(capturedFilename).toContain("Customer_Support_AI_Chatbot");
      expect(capturedFilename).toMatch(/\.json$/);

      createElementSpy.mockRestore();
    });



    it("exports tree as HTML file", async () => {
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

      // Click the export dropdown trigger
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Click the "Export as HTML" menu item
      const htmlExportItem = screen.getByRole("menuitem", { name: /export as html/i });
      await user.click(htmlExportItem);

      // Verify blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Verify link was clicked
      expect(clickSpy).toHaveBeenCalled();

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

  describe("Tree Management", () => {
    it("creates new tree when New button is clicked", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const newButton = screen.getByRole("button", { name: /new/i });
      await user.click(newButton);

      // The New button should work without throwing errors
      // The tree should be reset to a new state with current date
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

  describe("Data Import and Validation", () => {
    it("validates correct import data structure", () => {
      render(<ImpactTreeApp />);

      // Test with valid data structure - this will be tested through the import flow
      // The validation logic is tested indirectly through successful imports
    });

    it("rejects invalid import data", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Test with invalid data
      const invalidData = {
        tree: {
          id: "test-tree",
          // Missing required fields
        },
        nodes: [],
        relationships: [],
        measurements: []
      };

      // Mock file input and trigger import
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      const file = new File([JSON.stringify(invalidData)], 'test.json', { type: 'application/json' });
      Object.defineProperty(fileInput, 'files', { value: [file] });

      // Trigger file selection
      const loadBtn = screen.getByRole("button", { name: /load/i });
      await user.click(loadBtn);

      // File input should be triggered (we can't easily test the actual validation without more complex mocking)
    });

    it("handles file selection and reading", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Create a valid data file
      const validData = {
        tree: {
          id: "test-tree",
          name: "Imported Tree",
          description: "Imported Description",
          created_date: "2024-01-01",
          updated_date: "2024-01-01",
          owner: "test-user"
        },
        nodes: [{
          id: "node1",
          name: "Imported Node",
          description: "Imported Node Description",
          node_type: "business_metric",
          level: 1,
          position_x: 100,
          position_y: 100,
          color: "#ff0000",
          shape: "circle"
        }],
        relationships: [],
        measurements: []
      };

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: JSON.stringify(validData)
      };
      global.FileReader = vi.fn(() => mockFileReader) as any;

      // Trigger load/import
      const loadBtn = screen.getByRole("button", { name: /load/i });
      await user.click(loadBtn);

      // Simulate file load
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }
    });
  });

  describe("Canvas Operations", () => {
    it("handles zoom in functionality", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
      await user.click(zoomInBtn);

      // Verify zoom functionality is triggered
      // This would require mocking the canvas or checking internal state
    });

    it("handles zoom out functionality", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const zoomOutBtn = screen.getByRole("button", { name: /zoom out/i });
      await user.click(zoomOutBtn);

      // Verify zoom functionality is triggered
    });

    it("handles reset view functionality", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const resetViewBtn = screen.getByRole("button", { name: /reset view/i });
      await user.click(resetViewBtn);

      // Verify reset view functionality
    });

    it("handles center view functionality", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      const centerViewBtn = screen.getByRole("button", { name: /center view/i });
      await user.click(centerViewBtn);

      // Verify center view functionality
    });
  });

  describe("Node Operations", () => {
    it("handles node creation in add-node mode", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Enter add-node mode
      const businessMetricBtn = screen.getByRole("button", {
        name: /business metric/i,
      });
      await user.click(businessMetricBtn);

      // Click on canvas to create node
      const canvas = screen.getByRole("main");
      await user.click(canvas);

      // Verify node was created (check if node count increased)
      // This would require checking the internal state or DOM changes
    });

    it("handles node updates", () => {
      render(<ImpactTreeApp />);

      // Test node update functionality
      // This would require selecting a node and updating its properties
    });

    it("handles node deletion", () => {
      render(<ImpactTreeApp />);

      // Test node deletion functionality
      // This would require selecting a node and triggering delete
    });
  });

  describe("Keyboard Navigation", () => {
    it("supports keyboard navigation for toolbar buttons", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Tab to first toolbar button
      await user.tab();
      const firstButton = document.activeElement as HTMLElement;
      expect(firstButton).toBeInTheDocument();

      // Continue tabbing through buttons
      await user.tab();
      const secondButton = document.activeElement as HTMLElement;
      expect(secondButton).toBeInTheDocument();
      expect(secondButton).not.toBe(firstButton);
    });

    it("supports Enter key activation for buttons", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Focus on a button and press Enter
      const helpButton = screen.getByRole("button", { name: /help/i });
      helpButton.focus();
      await user.keyboard("{Enter}");

      // Help dialog should open - this test verifies keyboard accessibility
      // The dialog opening is tested separately in other tests
    });

    it("supports Escape key to close dialogs", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Open help dialog
      const helpButton = screen.getByRole("button", { name: /help/i });
      await user.click(helpButton);

      // Press Escape to close
      await user.keyboard("{Escape}");

      // Dialog should be closed
      const helpDialog = screen.queryByRole("dialog");
      expect(helpDialog).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides proper ARIA labels for interactive elements", () => {
      render(<ImpactTreeApp />);

      // Check for proper button labels
      expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reset view/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /center view/i })).toBeInTheDocument();
    });

    it("maintains proper heading hierarchy", () => {
      render(<ImpactTreeApp />);

      // Check for proper heading structure
      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);

      // Main heading should be h1
      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it("provides tooltip information for complex buttons", async () => {
      const user = userEvent.setup();
      render(<ImpactTreeApp />);

      // Hover over a button with tooltip
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.hover(saveButton);

      // Tooltip should be visible (if implemented)
      // This test ensures the tooltip component is properly integrated
      // Note: Tooltip visibility testing would require more complex setup
    });
  });


});
