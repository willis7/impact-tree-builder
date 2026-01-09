# Testing Strategy

This document outlines the testing approach for Impact Tree Builder.

## Test Stack

- **Unit Tests**: [Vitest](https://vitest.dev/) with React Testing Library
- **E2E Tests**: [Playwright](https://playwright.dev/)
- **Test Environment**: happy-dom

## Running Tests

### Unit Tests

```bash
# Run tests in watch mode (development)
bun run test

# Run tests once (CI)
bun run test:run

# Run with coverage report
bun run test:coverage

# Interactive UI runner
bun run test:ui

# Run a single test file
bun run vitest run path/to/test.test.tsx
```

### E2E Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI (interactive)
bun run test:e2e:ui

# Run in headed mode (visible browser)
bun run test:e2e:headed
```

## Test File Locations

```
src/
├── components/
│   ├── __tests__/           # Component unit tests
│   │   ├── ImpactTreeApp.test.tsx
│   │   ├── ImpactCanvas.test.tsx
│   │   ├── Sidebar.test.tsx
│   │   └── ...
│   └── ui/__tests__/        # UI component tests
├── hooks/__tests__/         # Hook unit tests
├── lib/__tests__/           # Utility function tests
e2e/
└── *.spec.ts                # Playwright E2E tests
```

## Writing Tests

### Unit Test Guidelines

- Use `@testing-library/react` for component testing
- Mock external dependencies (localStorage, URL APIs)
- Use descriptive test names with `describe` blocks
- Test user interactions with `userEvent`
- Co-locate tests with source files in `__tests__/` directories

### Example Unit Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should handle user click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### E2E Test Guidelines

- Test critical user flows end-to-end
- Use Playwright's locators for reliable element selection
- Test across different viewport sizes when relevant

## Coverage

Run `bun run test:coverage` to generate a coverage report. Coverage reports are generated in the `coverage/` directory.

## CI Integration

Tests run automatically on pull requests via GitHub Actions. See `.github/workflows/` for CI configuration.
