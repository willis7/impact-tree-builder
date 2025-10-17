import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactTreeApp } from "../ImpactTreeApp";

describe("Help Dialog Functionality", () => {
  it("should open help dialog when help button is clicked", async () => {
    const user = userEvent.setup();
    render(<ImpactTreeApp />);

    // Find and click the help button
    const helpButton = screen.getByRole("button", { name: /help/i });
    await user.click(helpButton);

    // Check if help dialog is opened (look for dialog title)
    expect(screen.getByText("Impact Tree Builder Help")).toBeInTheDocument();
  });

  it("should display help content sections", async () => {
    const user = userEvent.setup();
    render(<ImpactTreeApp />);

    // Open help dialog
    const helpButton = screen.getByRole("button", { name: /help/i });
    await user.click(helpButton);

    // Check for main sections
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Interface Overview")).toBeInTheDocument();
    expect(screen.getByText("Creating Your Impact Tree")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Tips & Best Practices")).toBeInTheDocument();
  });

  it("should display keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<ImpactTreeApp />);

    // Open help dialog
    const helpButton = screen.getByRole("button", { name: /help/i });
    await user.click(helpButton);

    // Check for keyboard shortcuts section
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Check for F1 shortcut (should be unique in help dialog)
    expect(screen.getByText("F1")).toBeInTheDocument();
  });

  it("should close help dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ImpactTreeApp />);

    // Open help dialog
    const helpButton = screen.getByRole("button", { name: /help/i });
    await user.click(helpButton);

    // Verify dialog is open
    expect(screen.getByText("Impact Tree Builder Help")).toBeInTheDocument();

    // Find and click close button (X button)
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    // Verify dialog is closed
    expect(screen.queryByText("Impact Tree Builder Help")).not.toBeInTheDocument();
  });
});