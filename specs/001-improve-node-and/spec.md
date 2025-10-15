# Feature Specification: Drag-and-Drop Interactions for Node and Relationship Creation

**Feature Branch**: `001-improve-node-and`  
**Created**: October 15, 2025  
**Status**: Draft  
**Input**: User description: "The current behavior of the impact rebuilder is not as expected. What I would really like to happen within this application is that I would much prefer when a node from the AddNotes menu is selected, there's actually a drag and drop animation over to the canvas. But when the item has been dropped, the AddNodes item that was selected should be then deselected. Another behavior that is not working as explained is that when the connect nodes button is selected and then the relationship is also selected, when you click two separate nodes, the relationship isn't currently being created. Again, in this scenario, I would much prefer a drag and drop behavior."

## Clarifications

### Session 2025-10-15

- Q: Should click-to-place workflows be deprecated, maintained as alternatives, or removed entirely? → A: Maintain both workflows - Keep click and drag as parallel options to support keyboard-only users and provide flexibility with better accessibility.
- Q: How should keyboard-only users (who cannot use drag-and-drop) create nodes and relationships? → A: Both methods - Support both click workflows and keyboard shortcuts for maximum flexibility.
- Q: What happens when a user drags a node type to an area of the canvas that is currently outside the viewBox? → A: Auto-pan on approach - Canvas automatically pans when cursor approaches viewport edges during drag with smooth following behavior.
- Q: What happens if a user tries to create a relationship from a node to itself? → A: Prevent and show message - Block self-relationships and show a brief error message to maintain data integrity.
- Q: What happens on touch devices (tablets, touch screens) where drag-and-drop gestures may conflict with pan gestures? → A: Deferred to future - Touch support is out-of-scope for this release and will be evaluated based on user feedback. Desktop/laptop focus first.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Drag Node Type from Sidebar to Canvas (Priority: P1)

A user wants to add a new node (Business Metric, Product Metric, or Initiative) to their impact tree. Instead of clicking a node type button and then clicking on the canvas, they want to drag the node type directly from the sidebar onto the canvas at their desired location, with visual feedback during the drag operation.

**Why this priority**: This is the core interaction improvement for node creation and directly addresses the primary user complaint about the current click-based workflow. It provides more intuitive spatial control and immediate visual feedback.

**Independent Test**: Can be fully tested by dragging any node type button from the sidebar to any position on the canvas and verifying that a new node appears at the drop location with the correct type.

**Acceptance Scenarios**:

1. **Given** the user is viewing an impact tree in the application, **When** the user drags a "Business Metric" button from the sidebar and drops it onto the canvas at coordinates (400, 300), **Then** a new Business Metric node is created at position (400, 300) on the canvas
2. **Given** the user has started dragging a node type button, **When** the user moves their cursor over the canvas, **Then** a semi-transparent preview of the node follows the cursor showing where it will be placed
3. **Given** the user is dragging a node type over the canvas, **When** the user releases the mouse button, **Then** the node is created at the drop location and the node type button returns to its unselected state
4. **Given** the user has started dragging a node type, **When** the user moves the cursor outside the canvas area and releases, **Then** no node is created and the drag operation is cancelled
5. **Given** the user is dragging a node type, **When** they press the Escape key, **Then** the drag operation is cancelled and no node is created

---

### User Story 2 - Auto-Deselect Node Type After Placement (Priority: P1)

After a user adds a node to the canvas using drag-and-drop, the node type button should automatically deselect, returning the interface to selection mode. This prevents accidental creation of multiple nodes and provides clear feedback that the action is complete.

**Why this priority**: This is a critical usability improvement that prevents user errors and confusion. It's part of the same workflow as P1 and should be delivered together for a cohesive experience.

**Independent Test**: Can be tested by dragging and dropping a node type, then verifying the sidebar button returns to its normal (unselected) state and attempting to click on the canvas doesn't create additional nodes.

**Acceptance Scenarios**:

1. **Given** a node type button is in the selected state (highlighted/active), **When** the user successfully drops a node onto the canvas, **Then** the node type button returns to its normal unselected state immediately
2. **Given** a node has just been created via drag-and-drop, **When** the user clicks elsewhere on the canvas, **Then** the existing node is selected (if clicked) or deselected (if clicking empty space), and no new node is created
3. **Given** a node type was selected but the drag was cancelled, **When** the cancellation completes, **Then** the node type button returns to unselected state and the application returns to select mode

---

### User Story 3 - Drag Between Nodes to Create Relationships (Priority: P2)

When creating relationships between nodes, users want to drag from one node to another to establish the connection, rather than using the current click-based workflow. This provides more intuitive visual feedback about the relationship being created.

**Why this priority**: While important for improved UX, this can function independently of the node creation improvements. The current click-based relationship creation can serve as a fallback while this enhancement is developed.

**Independent Test**: Can be tested by clicking the "Connect Nodes" button, selecting a relationship type, then dragging from a source node to a target node and verifying the relationship is created correctly.

**Acceptance Scenarios**:

1. **Given** the user has clicked the "Connect Nodes" button and selected a relationship type (e.g., "Drives" or "Influences"), **When** the user clicks and drags from Node A to Node B, **Then** a visual line follows the cursor from Node A during the drag
2. **Given** the user is dragging a relationship connection from Node A, **When** the cursor hovers over Node B (a valid target), **Then** Node B highlights to indicate it can receive the connection
3. **Given** the user is dragging a relationship from Node A to Node B, **When** the user releases the mouse over Node B, **Then** a relationship is created between Node A and Node B with the selected relationship type
4. **Given** the user is dragging a relationship line, **When** the user releases the mouse over empty canvas space (not over a node), **Then** the relationship creation is cancelled and no relationship is created
5. **Given** the user is dragging a relationship line, **When** the user presses the Escape key, **Then** the relationship creation is cancelled

---

### User Story 4 - Auto-Deselect Relationship Tool After Creation (Priority: P2)

After a relationship is created between two nodes, the relationship tool should automatically deselect, returning to selection mode. This prevents accidental creation of multiple relationships and provides clear feedback.

**Why this priority**: Complements P3 by completing the relationship creation workflow improvement. Can be delivered with P3 as a cohesive feature.

**Independent Test**: Can be tested by creating a relationship via drag-and-drop and verifying the "Connect Nodes" button returns to its normal state and the application returns to select mode.

**Acceptance Scenarios**:

1. **Given** the "Connect Nodes" button is active and a relationship type is selected, **When** the user successfully creates a relationship between two nodes, **Then** the "Connect Nodes" button returns to inactive state and the application enters select mode
2. **Given** a relationship was just created, **When** the user clicks on a node, **Then** the node is selected for editing (not used as the start of a new relationship)
3. **Given** the relationship tool was active but the user cancelled the operation, **When** the cancellation completes, **Then** the "Connect Nodes" button returns to inactive state

---

### User Story 5 - Visual Feedback During Drag Operations (Priority: P3)

Users need clear visual feedback during all drag operations to understand what action is being performed and where the result will appear. This includes cursor changes, preview elements, and target highlighting.

**Why this priority**: Enhances the user experience but the basic drag-and-drop functionality from P1-P2 can work without sophisticated visual polish. This can be refined after core functionality is proven.

**Independent Test**: Can be tested by performing drag operations and observing cursor changes, preview visibility, animation smoothness, and target highlighting.

**Acceptance Scenarios**:

1. **Given** the user starts dragging a node type, **When** the cursor is over the sidebar, **Then** the cursor changes to indicate a drag is in progress
2. **Given** the user is dragging a node type, **When** the cursor moves over the canvas, **Then** the cursor changes to indicate the item can be dropped
3. **Given** the user is dragging a relationship connection, **When** the cursor hovers over a valid target node, **Then** the target node displays a visual highlight (e.g., glow, border, or color change)
4. **Given** the user is dragging any element, **When** the cursor moves over an invalid drop zone, **Then** the cursor indicates the drop is not allowed (e.g., "no-drop" cursor icon)
5. **Given** the user completes any drag-and-drop operation, **When** the drop occurs, **Then** a smooth animation shows the element settling into its final position (smooth defined as maintaining 60fps)

---

### Edge Cases

**Resolved in Requirements:**

- Rapid successive drag operations: Resolved in FR-021 (allow immediate start without delay)
- Overlapping nodes at drop location: Resolved in FR-022 (allow overlap, user maintains control)

**Remaining Questions:**

- What happens when a user starts dragging a node type but then switches to another node type before completing the drag? (Recommended: Cancel first drag, start new drag with new node type)
- How does drag-and-drop interact with zoom and pan operations? Should dragging be disabled during zoom/pan, or should they work together? (Recommended: Zoom/pan temporarily disabled during active drag)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support drag-and-drop for all node types (Business Metric, Product Metric, Initiative Positive, Initiative Negative) from the sidebar to the canvas
- **FR-002**: System MUST display a visual preview element that follows the cursor during a node drag operation
- **FR-003**: System MUST create a new node at the exact coordinates where the user releases the mouse button on the canvas
- **FR-004**: System MUST automatically deselect the node type button and return to select mode after a node is successfully placed via drag-and-drop
- **FR-005**: System MUST cancel the node creation if the user releases the mouse outside the canvas area
- **FR-006**: System MUST support drag-to-connect for relationship creation, where the user drags from a source node to a target node
- **FR-007**: System MUST display a visual line connecting the source node to the cursor position during a relationship drag operation
- **FR-008**: System MUST highlight potential target nodes when the cursor hovers over them during a relationship drag
- **FR-009**: System MUST create a relationship between two nodes when the user releases the mouse over a valid target node
- **FR-010**: System MUST automatically deselect the "Connect Nodes" tool and return to select mode after a relationship is successfully created
- **FR-011**: System MUST allow users to cancel any drag operation by pressing the Escape key
- **FR-012**: System MUST prevent relationship creation when the user releases the mouse over empty canvas space (not on a node)
- **FR-013**: System MUST use different cursor icons to indicate valid drop zones, invalid drop zones, and drag-in-progress states (grabbing during drag, copy over valid drop zone, no-drop over invalid areas, crosshair during relationship mode)
- **FR-014**: System MUST support three parallel interaction methods: drag-and-drop, click-based workflows, and keyboard shortcuts for accessibility (keyboard-only users) and user preference
- **FR-015**: System MUST prevent creation of duplicate relationships between the same two nodes with the same relationship type
- **FR-016**: System MUST handle coordinate transformation correctly when dragging at different zoom levels
- **FR-017**: System MUST provide keyboard shortcuts for node type selection and placement: 'b' for Business Metric, 'p' for Product Metric, 'i' for Initiative Positive, 'n' for Initiative Negative, arrow keys for virtual cursor movement, Enter to place node, Escape to cancel operation, 'c' for Connect Nodes mode, 's' for Select mode
- **FR-019**: System MUST automatically pan the canvas when the cursor approaches viewport edges during a drag operation to enable placement beyond the currently visible area (triggers within 50px of edges with maximum pan speed of 10px per frame)
- **FR-020**: System MUST prevent users from creating relationships from a node to itself and display a clear error message when attempted (message: "Cannot create relationship from a node to itself")
- **FR-021**: System MUST handle rapid successive drag operations by allowing immediate start of new drag after previous operation completes without delay or UI lag
- **FR-022**: System MUST allow overlapping node placement at drop location without auto-adjustment (user maintains full control of positioning)

### Key Entities _(included as feature involves interaction state)_

- **Node Type Button**: Interactive sidebar element representing a node type that can be dragged onto the canvas. Has states: normal, selected, dragging.
- **Node Preview**: Temporary visual element displayed during node drag operations, showing the node type and position where it will be created.
- **Relationship Line Preview**: Temporary visual element displayed during relationship drag operations, showing the connection path from source node to cursor.
- **Drag State**: Application state tracking active drag operations, including: drag type (node or relationship), source element, current cursor position, and valid drop targets.
- **Drop Zone**: Canvas area that can receive dragged elements and trigger node or relationship creation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a new node by dragging from the sidebar to the canvas in under 3 seconds (compared to current 5+ seconds for click-based workflow)
- **SC-002**: 90% of users successfully create nodes using drag-and-drop on their first attempt without errors or confusion (success defined as node created at intended location without retries, measured via user testing sessions with minimum 20 participants)
- **SC-003**: Users can create a relationship by dragging between two nodes in under 4 seconds (compared to current 7+ seconds for click-select-select workflow)
- **SC-004**: Zero instances of accidental node creation after the first node is placed (measured by undo operations or user corrections)
- **SC-005**: Visual feedback (preview, cursor changes, highlights) appears within 100 milliseconds of drag initiation
- **SC-006**: Drag operations work smoothly at all zoom levels (0.5x to 3x) without coordinate transformation errors (smooth defined as maintaining 60fps during drag animations)
- **SC-007**: 95% of drag operations result in the expected outcome where expected outcome is either successful creation or intentional user cancellation via Escape key or drop outside valid zones
- **SC-008**: Relationship creation error rate (attempting to connect incompatible nodes or create duplicate relationships) reduces by 60% due to visual feedback during drag

## Out of Scope

- **Touch device support**: Touch gestures (long-press to drag, pinch to zoom) are explicitly out-of-scope for this release. Touch device users will use click-based workflows. Touch support will be evaluated based on user feedback in a future release.
- **Undo/redo functionality**: While useful, undo/redo for drag-and-drop operations is not part of this feature scope.
- **Multi-select drag**: Dragging multiple nodes simultaneously is not included in this release.
- **Drag-and-drop for existing nodes**: This feature focuses on creating new nodes and relationships. Moving existing nodes via drag is already supported and not modified.

## Assumptions

- The current canvas coordinate system and node positioning logic is stable and can be reused for drag-and-drop placement
- Users primarily access the application via desktop/laptop with mouse or trackpad; touch device support is deferred to future releases
- The existing "select", "add-node", and "connect" modes will be enhanced but not fundamentally redesigned
- Browser support includes modern drag-and-drop APIs or React-based drag libraries (e.g., react-dnd, @dnd-kit)
- Performance impact of rendering preview elements during drag will be negligible with proper optimization
- Drag operations are mutually exclusive (user cannot drag a node and a relationship simultaneously)
- The canvas zoom and pan controls will not interfere with drag operations
- Current click-based workflows will remain available during development as fallback until drag-and-drop is fully tested
