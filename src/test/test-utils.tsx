import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Custom render function that wraps components with necessary providers
 *
 * @param ui - React component to render
 * @param options - Render options from @testing-library/react
 * @returns Rendered component with utilities
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider defaultTheme="light">{children}</ThemeProvider>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
export { customRender as render };
