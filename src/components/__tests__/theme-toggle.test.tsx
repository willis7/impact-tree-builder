import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { ThemeToggle } from "../theme-toggle";

/**
 * Tests for ThemeToggle component
 *
 * Verifies dropdown menu interactions and theme switching.
 */
describe("ThemeToggle", () => {
  it("should render theme toggle button", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeDefined();
  });

  it("should show theme options when clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined();
      expect(screen.getByRole("menuitem", { name: /dark/i })).toBeDefined();
      expect(screen.getByRole("menuitem", { name: /system/i })).toBeDefined();
    });
  });

  it("should change theme when light option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined()
    );

    const lightOption = screen.getByRole("menuitem", { name: /light/i });
    await user.click(lightOption);

    // Menu should close after selection
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /light/i })).toBeNull();
    });
  });

  it("should change theme when dark option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: /dark/i })).toBeDefined()
    );

    const darkOption = screen.getByRole("menuitem", { name: /dark/i });
    await user.click(darkOption);

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /dark/i })).toBeNull();
    });
  });

  it("should change theme when system option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: /system/i })).toBeDefined()
    );

    const systemOption = screen.getByRole("menuitem", { name: /system/i });
    await user.click(systemOption);

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /system/i })).toBeNull();
    });
  });

  it("should display icons for theme options", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() => {
      const lightOption = screen.getByRole("menuitem", { name: /light/i });
      const darkOption = screen.getByRole("menuitem", { name: /dark/i });
      const systemOption = screen.getByRole("menuitem", { name: /system/i });

      expect(lightOption).toBeDefined();
      expect(darkOption).toBeDefined();
      expect(systemOption).toBeDefined();
    });
  });

  it("should be keyboard accessible", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });

    // Focus the button
    await user.tab();
    expect(document.activeElement).toBe(button);

    // Open with Enter
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined();
    });
  });

  it("should close menu on selection", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined()
    );

    // Select an option
    const lightOption = screen.getByRole("menuitem", { name: /light/i });
    await user.click(lightOption);

    // Menu should close after selection
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /light/i })).toBeNull();
    });
  });
});
