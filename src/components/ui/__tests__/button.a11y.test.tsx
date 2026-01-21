import { describe, it } from "vitest";
import { render } from "@/test/test-utils";
import { axe, expectNoA11yViolations } from "@/test/a11y";
import { Button } from "../button";

describe("Button (a11y)", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expectNoA11yViolations(results);
  });
});
