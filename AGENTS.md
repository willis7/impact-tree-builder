# Agent Guidelines for Impact Tree Builder

## Build/Lint/Test Commands

### Build
- `npm run build` - Type-check and build for production
- `npm run dev` - Start development server

### Lint
- `npm run lint` - Run ESLint on all files

### Test
- `npm run test` - Run all tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `vitest run --reporter=verbose path/to/test/file.test.tsx` - Run single test file

## Code Style Guidelines

### TypeScript & React
- Use TypeScript for all new code
- Use functional components with hooks
- Use `const` for all variable declarations unless reassignment is needed

### Imports
- Use path aliases: `@/` for `src/` directory
- Group imports: React imports first, then external libraries, then internal imports
- Use named imports over default imports when possible

### Naming Conventions
- **Interfaces/Types**: PascalCase (e.g., `ImpactTree`, `Node`, `Relationship`)
- **Functions/Variables**: camelCase (e.g., `handleAddNode`, `selectedNodeId`)
- **Data Properties**: snake_case (e.g., `position_x`, `node_type`, `created_date`)
- **Components**: PascalCase (e.g., `ImpactTreeApp`, `PropertiesPanel`)
- **Files**: PascalCase for components, camelCase for utilities

### Types & Interfaces
- Define interfaces in `src/types/` directory
- Use union types for enums (e.g., `"business_metric" | "product_metric"`)
- Use `as const` for literal type assertions
- Prefer explicit typing over inference for complex objects

### Error Handling
- Use `console.warn()` for non-critical issues
- Use try/catch blocks for operations that may fail
- Return early from functions on error conditions
- Use TypeScript's strict null checks

### Testing
- Use Vitest with `@testing-library/react`
- Mock external dependencies (localStorage, URL, etc.)
- Use descriptive test names and `describe` blocks
- Test user interactions with `userEvent`
- Use `happy-dom` environment for DOM testing

### Styling
- Use Tailwind CSS classes
- Follow component library patterns (Radix UI + custom components)
- Use CSS variables for theming
- Prefer utility classes over custom CSS

### Code Organization
- Components in `src/components/` with `__tests__/` subdirectories
- Hooks in `src/hooks/` with tests
- Utilities in `src/lib/` with tests
- Types in `src/types/`
- Data/constants in `src/data/`

### Documentation
- Use JSDoc comments for complex functions
- Keep comments concise and focused on "why" not "what"
- Document component props and return types
- Use TODO comments for future improvements

### Performance
- Use React.memo for expensive components
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations
- Avoid unnecessary re-renders

### Security
- Sanitize user input with DOMPurify
- Validate data before processing
- Use TypeScript for type safety
- Avoid direct DOM manipulation