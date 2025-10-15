# Phase 1: Data Model & State Management

**Feature**: Drag-and-Drop Interactions for Node and Relationship Creation  
**Date**: October 15, 2025  
**Status**: ✅ Complete

## Overview

This document defines the data structures and state management patterns for implementing drag-and-drop interactions. The feature introduces new state entities to track drag operations while reusing existing Node and Relationship entities.

---

## State Entities

### 1. DragState (New)

**Purpose**: Global state tracking active drag operations

**Location**: `src/types/drag.ts`

**Fields**:

| Field             | Type                               | Description                                    | Validation                                         |
| ----------------- | ---------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `isDragging`      | `boolean`                          | Whether a drag operation is active             | Required                                           |
| `dragType`        | `'node' \| 'relationship' \| null` | Type of drag operation                         | Required, null when not dragging                   |
| `sourceNodeId`    | `string \| null`                   | Source node ID for relationship drag           | Required for relationship drag, null for node drag |
| `activeNodeType`  | `NodeType \| null`                 | Node type being dragged                        | Required for node drag, null for relationship drag |
| `cursorPosition`  | `{ x: number; y: number }`         | Current cursor position in screen coordinates  | Required when dragging                             |
| `previewPosition` | `{ x: number; y: number }`         | Preview element position in canvas coordinates | Required when dragging                             |
| `targetNodeId`    | `string \| null`                   | Potential drop target node ID                  | Only for relationship drag                         |

**State Transitions**:

```
Initial State (not dragging)
  ↓ User starts dragging node type button
Node Drag Active
  ↓ User releases mouse over canvas → Create node
  ↓ User releases mouse outside canvas → Cancel
  ↓ User presses Escape → Cancel
Back to Initial State

Initial State (not dragging)
  ↓ User starts dragging from source node
Relationship Drag Active
  ↓ User releases mouse over target node → Create relationship
  ↓ User releases mouse over source node → Show error (self-relationship)
  ↓ User releases mouse outside any node → Cancel
  ↓ User presses Escape → Cancel
Back to Initial State
```

**Relationships**:

- References `Node` entity via `sourceNodeId` and `targetNodeId`
- References `NodeType` enumeration via `activeNodeType`

---

### 2. AutoPanState (New)

**Purpose**: State for canvas auto-pan behavior when dragging near edges

**Location**: `src/hooks/useCanvasAutoPan.ts` (local to hook)

**Fields**:

| Field           | Type                                                           | Description                          | Validation                |
| --------------- | -------------------------------------------------------------- | ------------------------------------ | ------------------------- |
| `isAutoPanning` | `boolean`                                                      | Whether auto-pan is currently active | Required                  |
| `panVelocity`   | `{ x: number; y: number }`                                     | Current pan velocity in px/frame     | Required, range [-10, 10] |
| `edgeProximity` | `{ left: number; right: number; top: number; bottom: number }` | Distance from each viewport edge     | Required, >= 0            |

**State Transitions**:

```
Inactive
  ↓ Cursor within 50px of viewport edge during drag
Active (auto-panning)
  ↓ Cursor moves away from edges → Decelerate to stop
  ↓ Drag operation ends → Immediate stop
Inactive
```

---

### 3. KeyboardState (New)

**Purpose**: State for keyboard-based node placement

**Location**: `src/components/ImpactTreeApp.tsx` (component state)

**Fields**:

| Field                   | Type                       | Description                              | Validation             |
| ----------------------- | -------------------------- | ---------------------------------------- | ---------------------- |
| `virtualCursorPosition` | `{ x: number; y: number }` | Cursor position controlled by arrow keys | Required               |
| `keyboardMode`          | `boolean`                  | Whether keyboard mode is active          | Required               |
| `selectedNodeType`      | `NodeType \| null`         | Node type selected via keyboard shortcut | Required for placement |

**State Transitions**:

```
Inactive
  ↓ User presses node type shortcut (b/p/i/n)
Keyboard Mode Active
  ↓ User presses arrow keys → Update virtual cursor position
  ↓ User presses Enter → Create node at virtual cursor
  ↓ User presses Escape → Cancel
Inactive
```

---

## Existing Entities (Modified)

### Node (Existing - No Schema Changes)

**Changes**: None to schema. Usage changes only.

**New Usage Patterns**:

- Creation via drag-and-drop uses same `createNode()` function
- Position (`position_x`, `position_y`) set from drop coordinates
- All existing validations apply (sanitization, required fields)

---

### Relationship (Existing - No Schema Changes)

**Changes**: None to schema. Usage changes only.

**New Usage Patterns**:

- Creation via drag-and-drop uses same `createRelationship()` function
- Validation for self-relationships enforced (FR-020)
- Duplicate relationship prevention enforced (FR-015)

---

## State Management Strategy

### Component-Level State

**ImpactTreeApp.tsx** (Top-level coordinator):

- `dragState: DragState` - Global drag state
- `mode: 'select' | 'add-node' | 'connect'` - Current interaction mode (existing)
- Passes drag state down to child components via props

**ImpactCanvas.tsx** (Drop zone):

- Receives `dragState` via props
- Uses `useDrop` hook from @dnd-kit
- Calculates drop coordinates using coordinate transformation

**Sidebar.tsx** (Drag source):

- Receives `dragState` via props
- Uses `useDraggable` hook from @dnd-kit for each node type button
- Triggers drag initiation callbacks

### Custom Hooks

**useDragNode.ts**:

```typescript
interface UseDragNodeReturn {
  startDrag: (nodeType: NodeType, position: { x: number; y: number }) => void;
  updateDragPosition: (position: { x: number; y: number }) => void;
  endDrag: (dropPosition: { x: number; y: number } | null) => void;
  cancelDrag: () => void;
  dragState: DragState;
}
```

**useDragRelationship.ts**:

```typescript
interface UseDragRelationshipReturn {
  startDrag: (sourceNodeId: string, position: { x: number; y: number }) => void;
  updateDragPosition: (position: { x: number; y: number }) => void;
  setTargetNode: (targetNodeId: string | null) => void;
  endDrag: (targetNodeId: string | null) => void;
  cancelDrag: () => void;
  dragState: DragState;
}
```

**useCanvasAutoPan.ts**:

```typescript
interface UseCanvasAutoPanReturn {
  isAutoPanning: boolean;
  startAutoPan: (
    cursorPosition: { x: number; y: number },
    canvasRect: DOMRect
  ) => void;
  stopAutoPan: () => void;
}
```

---

## Validation Rules

### Drag Operation Validation

1. **Node Drag**:

   - Must have valid `activeNodeType` from enum: `business_metric`, `product_metric`, `initiative_positive`, `initiative_negative`
   - Drop position must be within canvas bounds (can be outside viewport due to auto-pan)
   - Node type must be deselected after successful drop (FR-004)

2. **Relationship Drag**:

   - `sourceNodeId` must reference existing node
   - `targetNodeId` must reference existing node (not null at drop time)
   - Cannot create self-relationship: `sourceNodeId !== targetNodeId` (FR-020)
   - Cannot create duplicate relationship: check existing relationships for same source + target + type (FR-015)
   - Relationship tool must be deselected after successful creation (FR-010)

3. **Keyboard Mode**:
   - Virtual cursor position must be within canvas bounds
   - Node type must be selected before placement
   - Arrow key movements update position in 10px increments

---

## Error Handling

### Error Types

1. **Invalid Drop Location**:

   - **Condition**: Drop outside canvas area
   - **Action**: Cancel drag, show toast "Node placement cancelled"
   - **Recovery**: Return to select mode

2. **Self-Relationship Attempt**:

   - **Condition**: `sourceNodeId === targetNodeId`
   - **Action**: Prevent creation, show toast "Cannot connect a node to itself"
   - **Recovery**: Return to connect mode (don't deselect tool)

3. **Duplicate Relationship**:

   - **Condition**: Relationship with same source, target, and type exists
   - **Action**: Prevent creation, show toast "A relationship of this type already exists"
   - **Recovery**: Return to connect mode

4. **Drag Cancelled**:
   - **Condition**: User presses Escape or drops outside valid zone
   - **Action**: Clean up drag state silently
   - **Recovery**: Return to previous mode (select or connect)

---

## Performance Considerations

### State Update Optimization

1. **Cursor Position Throttling**:

   - Update `cursorPosition` max once per animation frame (16.67ms)
   - Use `requestAnimationFrame` for smooth updates

2. **Preview Rendering**:

   - Single portal element reused across all drags
   - Conditional rendering based on `isDragging` flag
   - No unnecessary re-renders of canvas nodes during drag

3. **Collision Detection**:
   - Only check nodes within viewport + buffer zone
   - Use spatial indexing if node count > 100

---

## TypeScript Type Definitions

See `/contracts/drag-state.ts` for complete type definitions.

---

## Testing Requirements

### Unit Tests

1. **useDragNode hook**:

   - Test state transitions (start, update, end, cancel)
   - Test mode deselection after successful drop
   - Test cancellation behavior

2. **useDragRelationship hook**:

   - Test state transitions
   - Test target node highlighting logic
   - Test validation (self-relationship, duplicates)

3. **useCanvasAutoPan hook**:
   - Test edge proximity detection
   - Test velocity calculation
   - Test animation frame cleanup

### Integration Tests

1. **Node drag-and-drop workflow**:

   - Drag node type from sidebar to canvas
   - Verify node created at correct position
   - Verify mode returns to select

2. **Relationship drag-and-drop workflow**:

   - Drag from source to target node
   - Verify relationship created
   - Verify error handling for invalid targets

3. **Keyboard mode workflow**:
   - Activate via keyboard shortcut
   - Navigate with arrow keys
   - Place node with Enter

---

## Data Model Complete

All state entities and validation rules defined. Ready for contract generation.
