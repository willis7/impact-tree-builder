import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactTreeApp } from "../ImpactTreeApp";
import * as useToastModule from "@/hooks/use-toast";

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
  result: null as string | ArrayBuffer | null,
};

global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock toast
const mockToast = vi.fn();
vi.spyOn(useToastModule, "toast").mockImplementation(mockToast);

describe("Import Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the Load button", () => {
    render(<ImpactTreeApp />);
    expect(screen.getByRole("button", { name: /load/i })).toBeInTheDocument();
  });

  it("should trigger file input when Load button is clicked", async () => {
    render(<ImpactTreeApp />);

    const loadButton = screen.getByRole("button", { name: /load/i });

    // Mock the file input click
    const mockClick = vi.fn();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click = mockClick;
    }

    await userEvent.click(loadButton);
    expect(mockClick).toHaveBeenCalled();
  });

  it("should validate and import valid JSON data", async () => {
    render(<ImpactTreeApp />);

    const validJsonData = {
      tree: {
        id: "tree_test",
        name: "Test Tree",
        description: "Test description",
        created_date: "2025-01-01",
        updated_date: "2025-01-01",
        owner: "Test User"
      },
      nodes: [
        {
          id: "node_test",
          name: "Test Node",
          description: "Test node",
          node_type: "business_metric" as const,
          level: 1,
          position_x: 100,
          position_y: 100,
          color: "#000000",
          shape: "rectangle" as const
        }
      ],
      relationships: [],
      measurements: []
    };

    // Mock file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File([JSON.stringify(validJsonData)], 'test.json', { type: 'application/json' });

    // Simulate file selection and file read
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Simulate successful file read
      mockFileReader.result = JSON.stringify(validJsonData);
      mockFileReader.onload?.({ target: mockFileReader } as unknown as ProgressEvent<FileReader>);
    });

    // Check that toast was called with success message
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Import successful",
        variant: "success",
      })
    );
  });

  it("should show error for invalid JSON", async () => {
    render(<ImpactTreeApp />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['invalid json'], 'test.json', { type: 'application/json' });

    // Simulate file selection and file read
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Simulate file read with invalid JSON
      mockFileReader.result = 'invalid json';
      mockFileReader.onload?.({ target: mockFileReader } as unknown as ProgressEvent<FileReader>);
    });

    // Check that toast was called with error message
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Import failed",
        variant: "destructive",
      })
    );
  });

  it("should validate data structure", async () => {
    render(<ImpactTreeApp />);

    const invalidData = {
      tree: {}, // Missing required fields
      nodes: [],
      relationships: [],
      measurements: []
    };

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File([JSON.stringify(invalidData)], 'test.json', { type: 'application/json' });

    // Simulate file selection and file read
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Simulate successful file read
      mockFileReader.result = JSON.stringify(invalidData);
      mockFileReader.onload?.({ target: mockFileReader } as unknown as ProgressEvent<FileReader>);
    });

    // Check that toast was called with validation errors
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Import failed",
        variant: "destructive",
      })
    );
  });
});