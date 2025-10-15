<!--
Sync Impact Report:
- Version change: N/A → 1.0.0
- New constitution created from template
- Modified principles: N/A (initial version)
- Added sections:
  * I. Test-First Development (NON-NEGOTIABLE)
  * II. Component-First Architecture
  * III. Type Safety (NON-NEGOTIABLE)
  * IV. Accessibility & UX (NON-NEGOTIABLE)
  * V. Performance & Optimization
  * VI. Code Quality & Standards
  * React Development Standards (Section 2)
  * Testing Requirements (Section 3)
  * Security & Best Practices (Section 4)
- Removed sections: N/A
- Templates requiring updates:
  * ✅ plan-template.md - Verified constitution check section aligns with principles
  * ✅ spec-template.md - Verified requirement patterns align with testing and accessibility
  * ✅ tasks-template.md - Verified task categorization supports TDD workflow and user story prioritization
- Follow-up TODOs: None
-->

# Impact Tree Builder Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

**TDD is mandatory for all feature development.** All new features and significant changes MUST follow the Red-Green-Refactor cycle:

1. Write failing tests that define expected behavior
2. Obtain user approval of test scenarios
3. Verify tests fail as expected
4. Implement minimal code to pass tests
5. Refactor while maintaining test success

**Rationale**: Test-first development ensures requirements are clearly defined, reduces bugs, provides living documentation, enables confident refactoring, and maintains high code quality throughout the project lifecycle.

**Testing Hierarchy**:

- Unit tests for component logic and hooks (React Testing Library)
- Integration tests for component interactions and data flow
- Contract tests for API interfaces and data structures
- End-to-end tests for critical user journeys (when specified)

### II. Component-First Architecture

**Every feature starts as a modular, composable component.** Components MUST be:

- **Self-contained**: Clear boundaries with explicit props interface
- **Independently testable**: Can be tested in isolation with mocked dependencies
- **Reusable**: Designed for composition, not inheritance
- **Single responsibility**: One clear purpose per component
- **Documented**: PropTypes or TypeScript interfaces with JSDoc comments

**Component Hierarchy**:

- Functional components with hooks as the primary pattern
- Presentational components separated from container/logic components
- Custom hooks for reusable stateful logic
- Proper component composition with clear data flow (props down, events up)

**Rationale**: Component-first architecture promotes modularity, testability, maintainability, and enables parallel development while preventing coupling and technical debt.

### III. shadcn/ui Component Library (NON-NEGOTIABLE)

**All UI components MUST use shadcn/ui as the foundation.** The shadcn/ui library is the mandatory component system for consistency, accessibility, and maintainability:

- **Primary source**: All interactive UI elements must come from shadcn/ui registry
- **No custom alternatives**: Do not create custom implementations of components available in shadcn/ui
- **Extension only**: Custom UI components must extend or compose shadcn/ui components
- **Design system adherence**: Apply branding via shadcn/ui theming and CSS variables
- **Component registry**: All reusable UI elements must be registered and documented

**shadcn/ui Standards**:

- Use shadcn/ui CLI to add new components: `npx shadcn-ui@latest add [component]`
- Customize via `components.json` configuration and theme variables
- Extend components by wrapping or composing, never by forking
- Follow shadcn/ui's composition patterns (e.g., Dialog + DialogContent + DialogHeader)
- Leverage built-in accessibility features (ARIA, keyboard navigation)
- Use shadcn/ui's variant system for component states and styles

**Approved Component Usage**:

- ✅ **Import from shadcn/ui**: `@/components/ui/*`
- ✅ **Compose shadcn components**: Create feature components using shadcn/ui primitives
- ✅ **Extend with props**: Add custom props while maintaining shadcn/ui API
- ✅ **Theme customization**: Modify CSS variables in `globals.css`
- ❌ **Custom UI from scratch**: Do not create buttons, inputs, dialogs, etc. manually
- ❌ **Fork shadcn components**: Do not copy and modify shadcn/ui component source
- ❌ **Alternative UI libraries**: Do not add Material-UI, Ant Design, Chakra, etc.

**Deviation Process**:

If shadcn/ui lacks required functionality:

1. **Verify**: Confirm component doesn't exist in shadcn/ui registry
2. **Check primitives**: Evaluate if Radix UI primitives can be used (shadcn/ui's foundation)
3. **Document justification**: Explain why shadcn/ui cannot meet the requirement
4. **Architecture approval**: Obtain explicit approval from architecture lead
5. **Accessibility parity**: Ensure custom component meets WCAG 2.1 AA standards
6. **Future migration**: Document plan to migrate to shadcn/ui when available

**Rationale**: Standardizing on shadcn/ui ensures consistent UX, reduces maintenance burden, leverages battle-tested accessibility features, maintains design system coherence, and prevents component library fragmentation.

### IV. Type Safety (NON-NEGOTIABLE)

**TypeScript strict mode is mandatory.** All components, functions, and data structures MUST have explicit type definitions:

- **Props interfaces**: TypeScript interfaces for all component props
- **Event handlers**: Proper typing for all event callbacks and refs
- **State types**: Explicit types for useState, useReducer, and context
- **API contracts**: Type definitions for all external data interfaces
- **Generic components**: Leverage TypeScript generics where appropriate
- **No implicit any**: Strict mode enforced in tsconfig.json

**Type Definition Standards**:

- Use interfaces for public APIs and component props
- Use type aliases for unions, intersections, and utility types
- Leverage React's built-in types (React.FC, React.ComponentProps, etc.)
- Create union types for component variants and states

**Rationale**: Type safety catches bugs at compile time, improves IDE support, serves as living documentation, enables safe refactoring, and reduces runtime errors.

### V. Accessibility & UX (NON-NEGOTIABLE)

**Accessibility is a first-class requirement.** All UI components MUST meet WCAG 2.1 AA standards:

- **Semantic HTML**: Use proper HTML5 elements for structure and meaning (shadcn/ui provides this)
- **ARIA attributes**: Implement appropriate ARIA roles, labels, and descriptions (leverage shadcn/ui's built-in ARIA)
- **Keyboard navigation**: All interactive elements must be keyboard accessible (shadcn/ui handles this by default)
- **Focus management**: Visible focus indicators and logical tab order (use shadcn/ui's focus-visible utilities)
- **Screen reader support**: Descriptive alt text, labels, and announcements
- **Color contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text (verify against shadcn/ui theme)

**User Experience Standards**:

- Responsive design with mobile-first approach
- Loading states for async operations (use shadcn/ui Skeleton, Spinner)
- Error handling with clear user feedback (use shadcn/ui Alert, Toast)
- Optimistic updates where appropriate
- Consistent spacing, typography, and color systems (defined in shadcn/ui theme)

**Rationale**: Accessibility ensures inclusive design for all users, improves overall UX, meets legal requirements, and demonstrates professional quality. shadcn/ui components provide accessibility features by default through Radix UI primitives. shadcn/ui components provide accessibility features by default through Radix UI primitives.

### VI. Performance & Optimization

### V. Performance & Optimization

**Performance optimization is intentional, not premature.** Optimization MUST be:

- **Measured**: Profile with React DevTools before optimizing
- **Justified**: Document why optimization is needed with metrics
- **Tested**: Verify performance improvements with benchmarks
- **Documented**: Explain optimization techniques used

**Performance Patterns**:

- React.memo for expensive component renders (when profiled)
- useMemo and useCallback for expensive computations (when needed)
- Code splitting with React.lazy and Suspense
- Virtual scrolling for large lists
- Debounced/throttled event handlers for high-frequency events
- Optimized bundle size with tree shaking and dynamic imports

**Performance Targets**:

- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Bundle size < 500KB gzipped
- 60fps for animations and interactions

**Rationale**: Premature optimization adds complexity without benefit. Measured optimization ensures we solve real performance problems efficiently.

### VII. Code Quality & Standards

**Code quality is maintained through automation and peer review.** All code MUST:

- **Follow conventions**: PascalCase for components, camelCase for functions/variables
- **Be formatted**: ESLint and Prettier for consistent code style
- **Be reviewed**: All changes require code review before merge
- **Be documented**: Complex logic explained with comments and JSDoc
- **Follow patterns**: Consistent use of established patterns (HOCs, render props, hooks)

**Quality Gates**:

- ESLint with no errors (warnings acceptable with justification)
- Prettier formatting applied
- All tests passing
- No TypeScript errors
- Code review approval

**Rationale**: Automated quality checks maintain consistency, reduce review friction, catch common errors, and allow reviewers to focus on architecture and logic.

## React Development Standards

### State Management

- **Local state**: useState for component-local state
- **Complex state**: useReducer for complex state logic with multiple sub-values
- **Shared state**: useContext for state shared across component trees
- **Server state**: React Query or SWR for server-side data fetching and caching
- **Global state**: Consider Redux Toolkit or Zustand for complex global state (justify need)

### Hooks and Effects

- **Effect dependencies**: Always include all dependencies in useEffect array
- **Cleanup functions**: Implement cleanup to prevent memory leaks
- **Custom hooks**: Extract reusable stateful logic into custom hooks
- **Rules of hooks**: Only call hooks at the top level, not in conditions or loops
- **Refs**: Use useRef for DOM access and mutable values that don't trigger re-renders

### Data Fetching

- **Modern libraries**: Use React Query, SWR, or Apollo Client for data fetching
- **Loading states**: Implement proper loading, error, and success states
- **Race conditions**: Handle request cancellation and stale data
- **Optimistic updates**: Use for better UX in mutation scenarios
- **Caching strategies**: Implement appropriate cache invalidation and refresh logic
- **Error boundaries**: Catch and handle async errors gracefully

### Styling

- **shadcn/ui + Tailwind CSS**: Primary styling system (mandatory)
- **Design system**: All UI components from shadcn/ui registry
- **Theming**: CSS custom properties in `globals.css` for shadcn/ui theme customization
- **Responsive design**: Use Tailwind's responsive utilities with mobile-first approach
- **Component variants**: Use shadcn/ui's variant system (via class-variance-authority)
- **Accessibility**: Leverage shadcn/ui's built-in ARIA attributes, semantic HTML, focus states
- **Custom styles**: Only add via Tailwind utilities or extending shadcn/ui theme

### Forms and Validation

- **Controlled components**: Use controlled components for form inputs
- **Form libraries**: React Hook Form or Formik for complex forms
- **Validation**: Client-side validation with clear error messages
- **Accessibility**: Proper labels, ARIA attributes, error announcements
- **User experience**: Debounced validation, inline error messages

### Routing

- **Client-side routing**: React Router for single-page application routing
- **Nested routes**: Use for complex navigation hierarchies
- **Protected routes**: Implement authentication checks and redirects
- **Code splitting**: Lazy load route components for better performance
- **State management**: Handle route parameters and query strings properly

## Testing Requirements

### Test Coverage

- **Unit tests**: All custom hooks, utility functions, and business logic
- **Component tests**: User-facing behavior, not implementation details
- **Integration tests**: Complex component interactions and workflows
- **shadcn/ui integration**: Test custom compositions and extensions of shadcn/ui components
- **Contract tests**: API interfaces and data structure validation
- **Accessibility tests**: Verify shadcn/ui components maintain accessibility in context

### Testing Tools

- **Test runner**: Jest for test execution and assertions
- **Component testing**: React Testing Library for component tests
- **Mocking**: Mock external dependencies and API calls appropriately
- **Coverage**: Aim for 80%+ coverage, 100% for critical paths
- **Continuous testing**: Run tests on every commit via CI/CD

### Testing Best Practices

- **Test behavior**: Test what users see and do, not implementation
- **shadcn/ui components**: Test integration and composition, not shadcn/ui internals
- **Arrange-Act-Assert**: Clear test structure with setup, action, verification
- **Descriptive names**: Test names should describe the scenario and expected outcome
- **Accessibility**: Verify ARIA attributes and keyboard navigation work with shadcn/ui components
- **Single assertion**: Each test should verify one behavior
- **No flaky tests**: Tests must be deterministic and reliable

### Test-First Workflow

1. Write test describing desired behavior
2. Run test to verify it fails (RED)
3. Implement minimal code to pass test (GREEN)
4. Refactor while keeping tests green (REFACTOR)
5. Commit with passing tests

## Security & Best Practices

### Security Requirements

- **Input sanitization**: Sanitize all user inputs to prevent XSS attacks
- **Data validation**: Validate and escape data before rendering
- **HTTPS only**: All external API calls must use HTTPS
- **Authentication**: Implement proper auth patterns (JWT, OAuth, session)
- **Sensitive data**: Never store secrets in localStorage or sessionStorage
- **CSP headers**: Use Content Security Policy headers in production
- **Dependency audits**: Regularly audit and update dependencies for vulnerabilities

### Error Handling

- **Error boundaries**: Implement at appropriate levels to catch component errors
- **Async errors**: Proper try-catch for promises and async/await
- **User feedback**: Clear error messages for users
- **Logging**: Comprehensive error logging for debugging (without exposing sensitive data)
- **Graceful degradation**: Fallback UI when errors occur
- **Recovery strategies**: Provide recovery options (retry, refresh)

## Governance

### Amendment Process

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Discussion**: Team review and feedback period (minimum 3 business days)
3. **Approval**: Requires majority team approval
4. **Implementation**: Update constitution with version bump
5. **Migration**: Update affected code and documentation
6. **Communication**: Announce changes to entire team

### Versioning Policy

- **MAJOR** (X.0.0): Backward incompatible changes, principle removals, fundamental redefinitions
- **MINOR** (0.X.0): New principles added, materially expanded guidance, new mandatory sections
- **PATCH** (0.0.X): Clarifications, wording improvements, typo fixes, non-semantic changes

### Compliance Verification

- All pull requests MUST verify constitution compliance
- Code reviews MUST check adherence to core principles
- Complexity and architectural deviations MUST be justified in PR descriptions
- Constitution supersedes all other development practices
- Regular constitution review (quarterly) to ensure relevance

### Development Guidance

Runtime development guidance is provided in project documentation:

- **README.md**: Project overview, setup, and quick start
- **docs/**: Detailed guides for specific features and patterns
- **SHADCN_COMPONENTS.md**: Component library usage and guidelines
- **.specify/templates/**: Templates for specs, plans, and tasks

### Constitution Violations

When constitution violations are necessary (rare):

- Document in implementation plan under "Complexity Tracking"
- Explain why violation is needed
- Document why simpler alternatives were rejected
- Obtain explicit approval before proceeding
- Include migration plan to return to compliance when possible

**Version**: 1.1.0 | **Ratified**: 2025-10-15 | **Last Amended**: 2025-10-15
