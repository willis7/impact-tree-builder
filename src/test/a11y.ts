import axeCore from "axe-core";
import { expect } from "vitest";

type AxeRunOptions = axeCore.RunOptions;

export async function axe(
  container: Element | Document = document,
  options?: AxeRunOptions
): Promise<axeCore.AxeResults> {
  if (options) {
    return axeCore.run(container as unknown as Document, options);
  }
  return axeCore.run(container as unknown as Document);
}

export function expectNoA11yViolations(results: axeCore.AxeResults): void {
  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => ({
      html: n.html,
      target: n.target,
      failureSummary: n.failureSummary,
    })),
  }));

  expect(
    violations,
    `Expected no accessibility violations, but found: ${JSON.stringify(
      violations,
      null,
      2
    )}`
  ).toEqual([]);
}

