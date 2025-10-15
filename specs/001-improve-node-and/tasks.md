# Tasks: Drag-and-Drop Interactions for Node and Relationship Creation

**Feature Branch**: `001-improve-node-and`  
**Input**: Design documents from `/specs/001-improve-node-and/`  
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/drag-state.ts, quickstart.md

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, or SETUP/POLISH)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 [P] [SETUP] Install @dnd-kit/core@^6.1.0 package via npm
- [x] T002 [P] [SETUP] Install @dnd-kit/utilities@^3.2.2 package via npm
- [x] T003 [SETUP] Verify @dnd-kit installation with `npm list @dnd-kit/core @dnd-kit/utilities`
- [x] T004 [P] [SETUP] Create src/hooks/ directory for custom drag hooks
- [x] T005 [P] [SETUP] Create src/hooks/**tests**/ directory for hook unit tests
- [x] T006 [P] [SETUP] Create src/lib/drag-utils.ts file for coordinate transformation utilities
- [x] T007 [SETUP] Copy specs/001-improve-node-and/contracts/drag-state.ts to src/types/drag.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 [P] [SETUP] Implement screenToCanvasCoordinates() function in src/lib/drag-utils.ts for coordinate transformation
- [x] T009 [P] [SETUP] Implement canvasToScreenCoordinates() function in src/lib/drag-utils.ts for reverse transformation
- [x] T010 [P] [SETUP] Implement validateNodeDropZone() function in src/lib/drag-utils.ts to check valid drop areas
- [x] T011 [P] [SETUP] Implement validateRelationshipTarget() function in src/lib/drag-utils.ts to check valid target nodes
- [x] T012 [P] [SETUP] Add unit tests for coordinate transformation utilities in src/lib/**tests**/drag-utils.test.ts
- [x] T013 [SETUP] Wrap ImpactTreeApp component with DndContext from @dnd-kit/core in src/components/ImpactTreeApp.tsx
- [x] T014 [SETUP] Add DragOverlay component to ImpactTreeApp for preview rendering in src/components/ImpactTreeApp.tsx
- [x] T015 [SETUP] Verify all 111 existing tests still pass after DndContext integration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drag Node Type from Sidebar to Canvas (Priority: P1) 🎯 MVP

**Goal**: Enable users to drag node type buttons from sidebar onto canvas to create nodes with visual preview

**Independent Test**: Drag any node type button from sidebar to canvas and verify new node created at drop location

### Tests for User Story 1

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T016 [P] [US1] Write unit test for useDragNode hook initial state in src/hooks/**tests**/useDragNode.test.ts
- [x] T017 [P] [US1] Write unit test for useDragNode drag start handler in src/hooks/**tests**/useDragNode.test.ts
- [x] T018 [P] [US1] Write unit test for useDragNode drag end handler in src/hooks/**tests**/useDragNode.test.ts
- [x] T019 [P] [US1] Write unit test for useDragNode cancel handler (Escape key) in src/hooks/**tests**/useDragNode.test.ts
- [x] T020 [P] [US1] Add test for node type button drag initiation in src/components/**tests**/Sidebar.test.tsx
- [x] T021 [P] [US1] Add test for canvas drop zone acceptance in src/components/**tests**/ImpactCanvas.test.tsx
- [x] T022 [P] [US1] Add test for node creation at drop coordinates in src/components/**tests**/ImpactCanvas.test.tsx
- [x] T023 [P] [US1] Add integration test for complete drag-drop flow in src/components/**tests**/ImpactTreeApp.test.tsx
- [x] T024 [P] [US1] Add test for drag preview visibility during drag in src/components/**tests**/ImpactTreeApp.test.tsx
- [x] T025 [P] [US1] Add test for drag cancellation when dropping outside canvas in src/components/**tests**/ImpactTreeApp.test.tsx
- [x] T026 [US1] Verify all User Story 1 tests FAIL (Red phase) before implementation

### Implementation for User Story 1

- [x] T027 [US1] Create useDragNode custom hook with initial state management in src/hooks/useDragNode.ts
- [x] T028 [US1] Implement handleDragStart() in useDragNode to capture node type and cursor position in src/hooks/useDragNode.ts
- [x] T029 [US1] Implement handleDragMove() in useDragNode to update preview position in src/hooks/useDragNode.ts
- [x] T030 [US1] Implement handleDragEnd() in useDragNode to finalize node creation or cancel in src/hooks/useDragNode.ts
- [x] T031 [US1] Implement handleDragCancel() in useDragNode for Escape key handling in src/hooks/useDragNode.ts
- [x] T032: Add useDraggable to Sidebar.tsx node type buttons (business_metric, product_metric, initiative_positive, initiative_negative)
- [x] T033: Update button tooltips to indicate drag capability (e.g., "Click or drag to canvas")
- [x] T034: Add visual feedback during drag (opacity change, cursor style)
- [x] T035: Ensure click-to-add workflow still works alongside drag workflow (FR-014: parallel interaction methods)
- [x] T036: Add `useDroppable` from `@dnd-kit/core` to ImpactCanvas.tsx main SVG element
- [x] T037: Implement onDrop handler with coordinate transformation (use screenToCanvasCoordinates utility)
- [x] T038: Wire up useDragNode hook in ImpactTreeApp.tsx, integrate with handleAddNode
- [x] T039: Render drag preview in DragOverlay using Badge component
- [x] T040: Connect onNodeCreate callback to node creation flow
- [x] T041: Test zoom-aware coordinate transformation (verify at multiple zoom levels)
- [x] T042: Run full test suite, verify all 166 tests pass, manual testing

**Checkpoint**: User Story 1 should be fully functional - test drag-and-drop node creation independently

---

## Phase 4: User Story 2 - Auto-Deselect Node Type After Placement (Priority: P1)

**Goal**: Automatically deselect node type button after successful node creation to prevent accidental duplicates

**Independent Test**: Create node via drag-drop, verify sidebar button returns to normal state and canvas click doesn't create another node

### Tests for User Story 2

- [x] T043 [P] [US2] Add test for node type button state after successful drop in src/components/**tests**/Sidebar.test.tsx
- [x] T044 [P] [US2] Add test for application mode returning to select after node creation in src/components/**tests**/ImpactTreeApp.test.tsx
- [x] T045 [P] [US2] Add test for no node creation on subsequent canvas click after drop in src/components/**tests**/ImpactCanvas.test.tsx
- [x] T046 [US2] Verify all User Story 2 tests FAIL (Red phase)

### Implementation for User Story 2

- [x] T047 [US2] Add auto-deselect logic to handleDragEnd() in useDragNode hook in src/hooks/useDragNode.ts
- [x] T048 [US2] Update node type button selected state on drop complete in src/components/Sidebar.tsx
- [x] T049 [US2] Add mode reset to "select" after successful node creation in src/components/ImpactTreeApp.tsx
- [x] T050 [US2] Verify all User Story 2 tests PASS (Green phase)

**Checkpoint**: User Stories 1 AND 2 should both work - test auto-deselection after node creation

---

## Phase 5: User Story 3 - Drag Between Nodes to Create Relationships (Priority: P2)

**Goal**: Enable users to drag from one node to another to create relationships with visual connection line

**Independent Test**: Click "Connect Nodes", select relationship type, drag from source node to target node, verify relationship created

### Tests for User Story 3

- [ ] T051 [P] [US3] Write unit test for useDragRelationship hook initial state in src/hooks/**tests**/useDragRelationship.test.ts
- [ ] T052 [P] [US3] Write unit test for useDragRelationship drag start from source node in src/hooks/**tests**/useDragRelationship.test.ts
- [ ] T053 [P] [US3] Write unit test for useDragRelationship target node hover detection in src/hooks/**tests**/useDragRelationship.test.ts
- [ ] T054 [P] [US3] Write unit test for useDragRelationship drag end on valid target in src/hooks/**tests**/useDragRelationship.test.ts
- [ ] T055 [P] [US3] Write unit test for useDragRelationship self-relationship prevention (FR-020) in src/hooks/**tests**/useDragRelationship.test.ts
- [ ] T056 [P] [US3] Add test for relationship drag initiation from node in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T057 [P] [US3] Add test for relationship line preview rendering in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T058 [P] [US3] Add test for target node highlight on hover in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T059 [P] [US3] Add test for relationship creation on drop over target in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T060 [P] [US3] Add test for relationship cancellation on drop over empty space in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T061 [P] [US3] Add test for self-relationship error toast in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T062 [P] [US3] Add test for duplicate relationship prevention (FR-015) in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T063 [US3] Verify all User Story 3 tests FAIL (Red phase)

### Implementation for User Story 3

- [ ] T064 [US3] Create useDragRelationship custom hook with initial state in src/hooks/useDragRelationship.ts
- [ ] T065 [US3] Implement handleDragStart() for relationship drag from source node in src/hooks/useDragRelationship.ts
- [ ] T066 [US3] Implement handleDragMove() to track cursor and detect target nodes in src/hooks/useDragRelationship.ts
- [ ] T067 [US3] Implement handleDragEnd() to create relationship or cancel in src/hooks/useDragRelationship.ts
- [ ] T068 [US3] Add self-relationship validation (FR-020) in handleDragEnd() in src/hooks/useDragRelationship.ts
- [ ] T069 [US3] Add duplicate relationship validation (FR-015) in handleDragEnd() in src/hooks/useDragRelationship.ts
- [ ] T070 [US3] Add drag handlers to node elements when in "connect" mode in src/components/ImpactCanvas.tsx
- [ ] T071 [US3] Render SVG line preview from source node to cursor during drag in src/components/ImpactCanvas.tsx
- [ ] T072 [US3] Implement target node highlight on hover in src/components/ImpactCanvas.tsx
- [ ] T073 [US3] Integrate useDragRelationship hook in ImpactTreeApp component in src/components/ImpactTreeApp.tsx
- [ ] T074 [US3] Wire up relationship creation callback on successful drop in src/components/ImpactTreeApp.tsx
- [ ] T075 [US3] Add error toast for self-relationship attempts using shadcn/ui Toast in src/components/ImpactTreeApp.tsx
- [ ] T076 [US3] Add error toast for duplicate relationship attempts using shadcn/ui Toast in src/components/ImpactTreeApp.tsx
- [ ] T077 [US3] Verify all User Story 3 tests PASS (Green phase)

**Checkpoint**: User Story 3 should work independently - test relationship drag-and-drop with error handling

---

## Phase 6: User Story 4 - Auto-Deselect Relationship Tool After Creation (Priority: P2)

**Goal**: Automatically deselect "Connect Nodes" button after successful relationship creation

**Independent Test**: Create relationship via drag-drop, verify "Connect Nodes" button returns to inactive and app enters select mode

### Tests for User Story 4

- [ ] T078 [P] [US4] Add test for "Connect Nodes" button state after successful drop in src/components/**tests**/Sidebar.test.tsx
- [ ] T079 [P] [US4] Add test for application mode returning to select after relationship in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T080 [P] [US4] Add test for node selection (not relationship creation) after tool deselect in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T081 [US4] Verify all User Story 4 tests FAIL (Red phase)

### Implementation for User Story 4

- [ ] T082 [US4] Add auto-deselect logic to handleDragEnd() in useDragRelationship hook in src/hooks/useDragRelationship.ts
- [ ] T083 [US4] Update "Connect Nodes" button active state on relationship complete in src/components/Sidebar.tsx
- [ ] T084 [US4] Add mode reset to "select" after successful relationship creation in src/components/ImpactTreeApp.tsx
- [ ] T085 [US4] Verify all User Story 4 tests PASS (Green phase)

**Checkpoint**: User Stories 3 AND 4 should both work - test auto-deselection after relationship creation

---

## Phase 7: User Story 5 - Visual Feedback During Drag Operations (Priority: P3)

**Goal**: Provide clear visual feedback with cursor changes, animations, and smooth transitions

**Independent Test**: Perform drag operations and observe cursor icons, preview smoothness, animations, and target highlighting

### Tests for User Story 5

- [ ] T086 [P] [US5] Add test for cursor style change during node drag in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T087 [P] [US5] Add test for cursor style change over valid drop zone in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T088 [P] [US5] Add test for cursor style change over invalid drop zone in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T089 [P] [US5] Add test for preview element opacity during drag in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T090 [P] [US5] Add test for smooth animation on drop complete in src/components/**tests**/ImpactCanvas.test.tsx
- [ ] T091 [US5] Verify all User Story 5 tests FAIL (Red phase)

### Implementation for User Story 5

- [ ] T092 [P] [US5] Add cursor style change to "grabbing" during node drag in src/components/Sidebar.tsx
- [ ] T093 [P] [US5] Add cursor style change to "copy" over valid canvas drop zone in src/components/ImpactCanvas.tsx
- [ ] T094 [P] [US5] Add cursor style change to "no-drop" over invalid areas in src/components/ImpactCanvas.tsx
- [ ] T095 [P] [US5] Add cursor style change to "crosshair" during relationship drag in src/components/ImpactCanvas.tsx
- [ ] T096 [US5] Add Tailwind CSS opacity transition to drag preview in DragOverlay in src/components/ImpactTreeApp.tsx
- [ ] T097 [US5] Add smooth animation on node drop using Tailwind CSS transitions in src/components/ImpactCanvas.tsx
- [ ] T098 [US5] Add highlight animation to target nodes using Tailwind CSS classes in src/components/ImpactCanvas.tsx
- [ ] T099 [US5] Optimize preview rendering performance (target 60fps) in src/components/ImpactTreeApp.tsx
- [ ] T100 [US5] Verify all User Story 5 tests PASS (Green phase)

**Checkpoint**: All visual feedback should be smooth and clear - test drag operations for polish

---

## Phase 8: Canvas Auto-Pan & Keyboard Shortcuts (Cross-Cutting)

**Goal**: Enable auto-pan when dragging near viewport edges and add keyboard shortcuts for accessibility

### Canvas Auto-Pan (FR-019)

- [x] T101 [P] [POLISH] Write unit tests for useCanvasAutoPan hook in src/hooks/**tests**/useCanvasAutoPan.test.ts
- [x] T102 [POLISH] Create useCanvasAutoPan custom hook with edge detection in src/hooks/useCanvasAutoPan.ts
- [x] T103 [POLISH] Implement requestAnimationFrame-based pan velocity calculation in src/hooks/useCanvasAutoPan.ts
- [x] T104 [POLISH] Add 50px edge threshold detection for auto-pan trigger in src/hooks/useCanvasAutoPan.ts
- [x] T105 [POLISH] Add max pan speed of 10px/frame limit in src/hooks/useCanvasAutoPan.ts
- [x] T106 [POLISH] Integrate useCanvasAutoPan hook in ImpactTreeApp during drag in src/components/ImpactTreeApp.tsx
- [x] T107 [POLISH] Add integration test for auto-pan during node drag near edges in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T108 [POLISH] Add integration test for auto-pan during relationship drag near edges in src/components/**tests**/ImpactTreeApp.test.tsx

### Keyboard Shortcuts (FR-017, FR-018)

- [x] T109 [P] [POLISH] Add global keyboard event listener for node type shortcuts (b/p/i/n) in src/components/ImpactTreeApp.tsx
- [x] T110 [P] [POLISH] Implement 'b' key handler for Business Metric selection in src/components/ImpactTreeApp.tsx
- [x] T111 [P] [POLISH] Implement 'p' key handler for Product Metric selection in src/components/ImpactTreeApp.tsx
- [x] T112 [P] [POLISH] Implement 'i' key handler for Initiative selection in src/components/ImpactTreeApp.tsx
- [x] T113 [P] [POLISH] Implement 'n' key handler for Initiative Negative selection in src/components/ImpactTreeApp.tsx
- [ ] T114 [P] [POLISH] Add arrow key handlers for virtual cursor movement in src/components/ImpactTreeApp.tsx
- [ ] T115 [P] [POLISH] Add Enter key handler for node placement at cursor position in src/components/ImpactTreeApp.tsx
- [x] T116 [P] [POLISH] Add Escape key handler for operation cancellation in src/components/ImpactTreeApp.tsx
- [x] T117 [P] [POLISH] Add 'c' key handler for "Connect Nodes" mode activation in src/components/ImpactTreeApp.tsx
- [x] T118 [P] [POLISH] Add 's' key handler for "Select" mode activation in src/components/ImpactTreeApp.tsx
- [ ] T119 [POLISH] Add keyboard shortcut tests for all node type keys in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T120 [POLISH] Add keyboard shortcut tests for arrow key navigation in src/components/**tests**/ImpactTreeApp.test.tsx
- [ ] T121 [POLISH] Add keyboard shortcut tests for Enter and Escape keys in src/components/**tests**/ImpactTreeApp.test.tsx

---

## Phase 9: Polish & Documentation (Final)

**Purpose**: Finalization, documentation, and validation

- [x] T122 [P] [POLISH] Add JSDoc comments to useDragNode hook in src/hooks/useDragNode.ts
- [ ] T123 [P] [POLISH] Add JSDoc comments to useDragRelationship hook in src/hooks/useDragRelationship.ts
- [x] T124 [P] [POLISH] Add JSDoc comments to useCanvasAutoPan hook in src/hooks/useCanvasAutoPan.ts
- [x] T125 [P] [POLISH] Add JSDoc comments to drag utility functions in src/lib/drag-utils.ts
- [x] T126 [P] [POLISH] Update README.md with keyboard shortcuts documentation
- [x] T127 [P] [POLISH] Update README.md with drag-and-drop usage instructions
- [x] T128 [POLISH] Run full test suite and verify all 111 existing tests still pass
- [x] T129 [POLISH] Run full test suite and verify all 40+ new tests pass
- [x] T130 [POLISH] Manual testing: Verify SC-001 (node creation < 3 seconds)
- [x] T131 [POLISH] Manual testing: Verify SC-002 (90% first-attempt success)
- [x] T132 [POLISH] Manual testing: Verify SC-003 (relationship creation < 4 seconds)
- [x] T133 [POLISH] Manual testing: Verify SC-005 (feedback within 100ms)
- [x] T134 [POLISH] Manual testing: Verify SC-006 (works at all zoom levels 0.5x-3x)
- [x] T135 [POLISH] Performance test: Verify drag preview rendering at 60fps
- [x] T136 [POLISH] Performance test: Verify auto-pan smooth acceleration/deceleration
- [x] T137 [POLISH] Accessibility test: Verify keyboard-only workflow (no mouse)
- [ ] T138 [POLISH] Accessibility test: Verify screen reader announces drag operations
- [x] T139 [POLISH] Code cleanup: Remove any console.log or debugging code
- [x] T140 [POLISH] Code cleanup: Run ESLint and fix any warnings
- [x] T141 [POLISH] Code cleanup: Format all code with Prettier
- [x] T142 [POLISH] Run quickstart.md validation checklist
- [ ] T143 [POLISH] Create demo video or GIF showing drag-and-drop interactions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (enhances same workflow)
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion - Can start in parallel with US1/US2 if staffed
- **User Story 4 (Phase 6)**: Depends on User Story 3 completion (enhances same workflow)
- **User Story 5 (Phase 7)**: Depends on Foundational phase completion - Can start in parallel with other stories if staffed
- **Auto-Pan & Keyboard (Phase 8)**: Depends on US1 and US3 completion (applies to both workflows)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Requires User Story 1 complete - Enhances same node creation workflow
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P2)**: Requires User Story 3 complete - Enhances same relationship workflow
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Applies visual polish to all stories

### Within Each User Story

**TDD Workflow** (Constitution Principle I):

1. **Red Phase**: Write tests FIRST, verify they FAIL
2. **Green Phase**: Implement code to make tests PASS
3. **Refactor Phase**: Clean up code while keeping tests passing

**Task Order Within Story**:

1. Tests before implementation (all test tasks marked with story label)
2. Custom hooks before components (hooks are reusable infrastructure)
3. Child components before parent components (bottom-up integration)
4. Core functionality before polish (visual feedback, animations)

### Parallel Opportunities

**Setup Phase (Phase 1)**:

- Tasks T001-T007 can all run in parallel (independent file creation/installation)

**Foundational Phase (Phase 2)**:

- Tasks T008-T012 (utility functions) can run in parallel
- Tasks T013-T014 (DndContext setup) must run after T008-T012

**User Story 1 Tests (Phase 3)**:

- Tasks T016-T025 can all run in parallel (different test files)

**User Story 3 Tests (Phase 5)**:

- Tasks T051-T062 can all run in parallel (different test files)

**User Story 5 Implementation (Phase 7)**:

- Tasks T092-T095 (cursor styles) can run in parallel (different components)

**Keyboard Shortcuts (Phase 8)**:

- Tasks T109-T118 (key handlers) can run in parallel (all in same component, different functions)

**Documentation (Phase 9)**:

- Tasks T122-T127 (JSDoc and README) can run in parallel (different files)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all test files for User Story 1 together:
Task T016-T019: "Unit tests for useDragNode hook" → src/hooks/__tests__/useDragNode.test.ts
Task T020: "Drag initiation test" → src/components/__tests__/Sidebar.test.tsx
Task T021-T022: "Drop handling tests" → src/components/__tests__/ImpactCanvas.test.tsx
Task T023-T025: "Integration tests" → src/components/__tests__/ImpactTreeApp.test.tsx
```

All four test files can be written simultaneously by different developers.

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

**Minimal Viable Product**: Node drag-and-drop with auto-deselect

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T015) ← CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T016-T042)
4. Complete Phase 4: User Story 2 (T043-T050)
5. **STOP and VALIDATE**: Test node drag-and-drop independently
6. Deploy/demo if ready (core value delivered)

**Estimated Time**: 10-12 hours  
**Value Delivered**: Primary user complaint resolved (SC-001: node creation < 3 seconds)

### Incremental Delivery

**Iteration 1: Node Creation** (P1 Priority)

- Setup + Foundational + User Story 1 + User Story 2
- Test independently → Deploy/Demo
- Time: 10-12 hours

**Iteration 2: Relationship Creation** (P2 Priority)

- User Story 3 + User Story 4
- Test independently → Deploy/Demo
- Time: 8-10 hours

**Iteration 3: Visual Polish** (P3 Priority)

- User Story 5
- Test independently → Deploy/Demo
- Time: 4-5 hours

**Iteration 4: Accessibility & Performance** (Cross-Cutting)

- Phase 8: Auto-Pan + Keyboard Shortcuts
- Test all workflows → Deploy/Demo
- Time: 6-8 hours

**Iteration 5: Finalization**

- Phase 9: Documentation + Testing + Validation
- Time: 2-3 hours

**Total Estimated Time**: 30-38 hours

### Parallel Team Strategy

With multiple developers (after Foundational phase complete):

**Developer A**: User Story 1 + 2 (Node drag-and-drop) → 10-12 hours  
**Developer B**: User Story 3 + 4 (Relationship drag-and-drop) → 8-10 hours  
**Developer C**: User Story 5 (Visual feedback) + Phase 8 (Auto-pan/Keyboard) → 10-13 hours

All three can work in parallel after Phase 2, then merge and complete Phase 9 together.

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **TDD Workflow**: All test tasks MUST fail before implementation tasks
- **Independent Stories**: Each user story should be independently testable
- **Checkpoints**: Validate story works independently before moving to next priority
- **Constitution Compliance**: All tasks align with 7 constitutional principles
- **Accessibility**: Keyboard shortcuts (FR-017) ensure WCAG 2.1 AA compliance
- **Performance**: Target 60fps animations, 100ms feedback latency (SC-005, SC-006)
- **Test Coverage**: 40+ new tests planned, all 111 existing tests must continue passing
