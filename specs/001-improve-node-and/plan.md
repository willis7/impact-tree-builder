# Implementation Plan: Drag-and-Drop Interactions for Node and Relationship Creation

**Branch**: `001-improve-node-and` | **Date**: October 15, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-improve-node-and/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement drag-and-drop interactions for creating nodes and relationships in the Impact Tree Builder. Users will drag node type buttons from the sidebar directly onto the canvas to create nodes, and drag between nodes to create relationships. This replaces the current click-based workflow while maintaining both methods for accessibility (keyboard-only users). The feature includes visual feedback (preview elements, cursor changes, target highlighting), auto-pan when approaching viewport edges, and automatic deselection after placement. Built using @dnd-kit/core for TypeScript compatibility and shadcn/ui integration.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode enabled  
**Primary Dependencies**: React 19.1.1, Vite 7.1.14, @dnd-kit/core (drag-and-drop), shadcn/ui, Tailwind CSS  
**Storage**: Browser localStorage (existing - no changes needed for this feature)  
**Testing**: Vitest 3.2.4, React Testing Library, @testing-library/user-event  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) on desktop/laptop  
**Project Type**: Single-page web application  
**Performance Goals**: Visual feedback within 100ms of drag initiation, smooth 60fps animations during drag  
**Constraints**: Desktop/laptop only (touch devices out-of-scope), must maintain WCAG 2.1 AA accessibility  
**Scale/Scope**: Interactive UI feature affecting 3 main components (Sidebar, ImpactCanvas, ImpactTreeApp)

## Constitution Check

**GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.**

### I. Test-First Development (NON-NEGOTIABLE)

- ✅ **Status**: PASS
- **Evidence**: Feature spec includes 5 prioritized user stories with acceptance scenarios. Plan includes test strategy for drag-and-drop interactions using React Testing Library and @testing-library/user-event.
- **Action Required**: Write tests before implementation following TDD Red-Green-Refactor cycle.

### II. Component-First Architecture

- ✅ **Status**: PASS
- **Evidence**: Feature enhances existing components (Sidebar, ImpactCanvas, ImpactTreeApp) with new drag-and-drop behavior. Each component maintains single responsibility. Will create reusable custom hooks for drag logic.
- **Action Required**: Create useDragNode and useDragRelationship custom hooks for reusable drag state management.

### III. shadcn/ui Component Library (NON-NEGOTIABLE)

- ✅ **Status**: PASS
- **Evidence**: Feature uses existing shadcn/ui Button components in Sidebar. @dnd-kit integrates well with shadcn/ui (both use Radix UI primitives). No custom UI components needed - all interactive elements already use shadcn/ui.
- **Action Required**: Ensure drag preview elements use shadcn/ui styling classes and theme variables.

### IV. Type Safety (NON-NEGOTIABLE)

- ✅ **Status**: PASS
- **Evidence**: TypeScript 5.9.3 strict mode enabled. @dnd-kit provides full TypeScript support. Will define explicit types for drag state, preview elements, and drop zones.
- **Action Required**: Create TypeScript interfaces for DragState, NodeDragData, RelationshipDragData, DropZone.

### V. Accessibility & UX (NON-NEGOTIABLE)

- ✅ **Status**: PASS
- **Evidence**: Spec includes FR-017 and FR-018 requiring keyboard shortcuts and parallel click workflows for keyboard-only users. Maintains WCAG 2.1 AA compliance. @dnd-kit supports keyboard navigation natively.
- **Action Required**: Implement keyboard shortcuts (FR-017) alongside drag-and-drop. Test with screen readers and keyboard-only navigation.

### VI. Performance & Optimization

- ✅ **Status**: PASS
- **Evidence**: Success criteria SC-005 requires visual feedback within 100ms. @dnd-kit is optimized for 60fps animations. Canvas auto-pan will use requestAnimationFrame for smooth performance.
- **Action Required**: Profile drag operations to ensure 60fps during drag and 100ms feedback latency.

### VII. Code Quality & Standards

- ✅ **Status**: PASS
- **Evidence**: Feature follows existing codebase patterns. Will add JSDoc documentation for new hooks and modified components. ESLint/TypeScript configured.
- **Action Required**: Document drag-and-drop patterns in component JSDoc. Update README with keyboard shortcuts.

**Overall Gate**: ✅ PASS - All constitutional requirements satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-improve-node-and/
├── spec.md              # Feature specification (✅ complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (generated below)
├── data-model.md        # Phase 1 output (generated below)
├── quickstart.md        # Phase 1 output (generated below)
├── contracts/           # Phase 1 output (generated below)
│   └── drag-state.ts    # TypeScript interfaces for drag state
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (existing)
src/
├── components/
│   ├── ImpactTreeApp.tsx          # [MODIFY] Add drag state management
│   ├── ImpactCanvas.tsx            # [MODIFY] Add drop zone handling
│   ├── Sidebar.tsx                 # [MODIFY] Add draggable node type buttons
│   ├── PropertiesPanel.tsx         # [NO CHANGE]
│   ├── ErrorBoundary.tsx           # [NO CHANGE]
│   ├── theme-provider.tsx          # [NO CHANGE]
│   ├── theme-toggle.tsx            # [NO CHANGE]
│   ├── __tests__/
│   │   ├── ImpactTreeApp.test.tsx  # [MODIFY] Add drag-and-drop tests
│   │   ├── ImpactCanvas.test.tsx   # [MODIFY] Add drop zone tests
│   │   └── Sidebar.test.tsx        # [MODIFY] Add drag initiation tests
│   └── ui/                         # [NO CHANGE] shadcn/ui components
├── hooks/
│   ├── useDragNode.ts              # [NEW] Custom hook for node drag state
│   ├── useDragRelationship.ts      # [NEW] Custom hook for relationship drag state
│   ├── useCanvasAutoPan.ts         # [NEW] Custom hook for auto-pan behavior
│   └── __tests__/
│       ├── useDragNode.test.ts     # [NEW] Unit tests for drag node hook
│       ├── useDragRelationship.test.ts  # [NEW] Unit tests for drag relationship hook
│       └── useCanvasAutoPan.test.ts     # [NEW] Unit tests for auto-pan hook
├── lib/
│   ├── utils.ts                    # [NO CHANGE]
│   ├── sanitize.ts                 # [NO CHANGE]
│   └── drag-utils.ts               # [NEW] Utility functions for drag operations
├── types/
│   ├── index.ts                    # [MODIFY] Add drag state types
│   └── drag.ts                     # [NEW] Drag-and-drop specific types
└── data/
    └── sampleData.ts               # [NO CHANGE]

tests/                               # [NO CHANGE] Existing test infrastructure
```

**Structure Decision**: Extending existing single web application structure. No new top-level directories needed. Adding new custom hooks directory to organize drag-and-drop logic as reusable, testable units following Component-First Architecture principle. All UI modifications use existing shadcn/ui components.

## Complexity Tracking

**Note**: Fill ONLY if Constitution Check has violations that must be justified.

No violations detected. All constitutional requirements are satisfied.
