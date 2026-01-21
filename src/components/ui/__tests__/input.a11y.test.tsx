import { describe, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { axe, expectNoA11yViolations } from "@/test/a11y";
import { Input } from "../input";

describe("Input (a11y)", () => {
  it("has no axe violations when properly labeled", async () => {
    const { container } = render(
      <div>
        <label htmlFor="name">Name</label>
        <Input id="name" />
      </div>
    );

    // sanity check the label association exists
    screen.getByLabelText("Name");

    const results = await axe(container);
    expectNoA11yViolations(results);
  });
});
