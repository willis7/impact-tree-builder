# Quickstart: Drag-and-Drop Implementation

**Feature**: Drag-and-Drop Interactions for Node and Relationship Creation  
**For**: Developers implementing this feature  
**Prerequisites**: Completed Phase 0 (Research) and Phase 1 (Data Model)

---

## Setup

### 1. Install Dependencies

```bash
# Install @dnd-kit packages
npm install @dnd-kit/core@^6.1.0 @dnd-kit/utilities@^3.2.2

# Verify installation
npm list @dnd-kit/core @dnd-kit/utilities
```

### 2. Create Type Definitions

Copy `/specs/001-improve-node-and/contracts/drag-state.ts` to `src/types/drag.ts`:

```bash
cp specs/001-improve-node-and/contracts/drag-state.ts src/types/drag.ts
```

### 3. Create Custom Hooks Directory

```bash
mkdir -p src/hooks/__tests__
```

---

## Implementation Order (TDD)

Follow Test-First Development (Constitution Principle I):

### Phase A: Node Drag-and-Drop (Priority P1)

**Estimated Time**: 6-8 hours

1. **Write Tests First** ✅ TDD Red Phase

   - [ ] `src/hooks/__tests__/useDragNode.test.ts` - Unit tests for drag node hook
   - [ ] `src/components/__tests__/Sidebar.test.tsx` - Add drag initiation tests
   - [ ] `src/components/__tests__/ImpactCanvas.test.tsx` - Add drop handling tests
   - [ ] `src/components/__tests__/ImpactTreeApp.test.tsx` - Add integration tests

2. **Implement Custom Hook** ✅ TDD Green Phase

   - [ ] `src/hooks/useDragNode.ts` - Drag state management for nodes
   - [ ] Verify tests pass

3. **Modify Sidebar Component** ✅ TDD Green Phase

   - [ ] Add `useDraggable` from @dnd-kit to node type buttons
   - [ ] Add drag start handlers
   - [ ] Verify tests pass

4. **Modify ImpactCanvas Component** ✅ TDD Green Phase

   - [ ] Add `useDroppable` from @dnd-kit for canvas
   - [ ] Add drop handlers
   - [ ] Implement coordinate transformation
   - [ ] Verify tests pass

5. **Modify ImpactTreeApp Component** ✅ TDD Green Phase

   - [ ] Add `DndContext` from @dnd-kit
   - [ ] Integrate `useDragNode` hook
   - [ ] Add `DragOverlay` for preview
   - [ ] Wire up node creation on drop
   - [ ] Add auto-deselect logic (FR-004)
   - [ ] Verify all tests pass

6. **Refactor** ✅ TDD Refactor Phase
   - [ ] Extract utility functions to `src/lib/drag-utils.ts`
   - [ ] Optimize re-renders
   - [ ] Add JSDoc documentation
   - [ ] Verify tests still pass

---

### Phase B: Canvas Auto-Pan (Priority P1)

**Estimated Time**: 3-4 hours

1. **Write Tests First** ✅ TDD Red Phase

   - [ ] `src/hooks/__tests__/useCanvasAutoPan.test.ts` - Unit tests

2. **Implement Custom Hook** ✅ TDD Green Phase

   - [ ] `src/hooks/useCanvasAutoPan.ts` - Auto-pan logic
   - [ ] Verify tests pass

3. **Integrate with ImpactTreeApp** ✅ TDD Green Phase

   - [ ] Call `useCanvasAutoPan` during drag operations
   - [ ] Update viewBox state from auto-pan
   - [ ] Verify tests pass

4. **Refactor** ✅ TDD Refactor Phase
   - [ ] Performance optimization
   - [ ] Add JSDoc documentation

---

### Phase C: Relationship Drag-and-Drop (Priority P2)

**Estimated Time**: 6-8 hours

1. **Write Tests First** ✅ TDD Red Phase

   - [ ] `src/hooks/__tests__/useDragRelationship.test.ts` - Unit tests
   - [ ] Update `ImpactCanvas.test.tsx` - Add relationship drag tests
   - [ ] Update `ImpactTreeApp.test.tsx` - Add integration tests

2. **Implement Custom Hook** ✅ TDD Green Phase

   - [ ] `src/hooks/useDragRelationship.ts` - Drag state management for relationships
   - [ ] Verify tests pass

3. **Modify ImpactCanvas Component** ✅ TDD Green Phase

   - [ ] Add drag handlers to node elements
   - [ ] Add target node highlighting
   - [ ] Add relationship line preview
   - [ ] Add validation (self-relationship, duplicates)
   - [ ] Verify tests pass

4. **Modify ImpactTreeApp Component** ✅ TDD Green Phase

   - [ ] Integrate `useDragRelationship` hook
   - [ ] Wire up relationship creation on drop
   - [ ] Add error handling (FR-020: self-relationship)
   - [ ] Add duplicate prevention (FR-015)
   - [ ] Add auto-deselect logic (FR-010)
   - [ ] Verify all tests pass

5. **Refactor** ✅ TDD Refactor Phase
   - [ ] Code cleanup
   - [ ] Add JSDoc documentation

---

### Phase D: Keyboard Shortcuts (Priority P1 - Accessibility)

**Estimated Time**: 4-5 hours

1. **Write Tests First** ✅ TDD Red Phase

   - [ ] Update `ImpactTreeApp.test.tsx` - Add keyboard navigation tests
   - [ ] Test all shortcuts (b, p, i, n, arrow keys, Enter, Escape)

2. **Implement Keyboard Handlers** ✅ TDD Green Phase

   - [ ] Add `useEffect` for keyboard event listeners in `ImpactTreeApp.tsx`
   - [ ] Implement virtual cursor state
   - [ ] Implement node type selection shortcuts
   - [ ] Implement placement with Enter key
   - [ ] Verify tests pass

3. **Add Visual Feedback** ✅ TDD Green Phase

   - [ ] Show virtual cursor indicator on canvas
   - [ ] Show selected node type in UI
   - [ ] Verify tests pass

4. **Document Shortcuts** ✅ Documentation
   - [ ] Update README.md with keyboard shortcuts table
   - [ ] Add tooltip/help overlay to UI (optional)

---

### Phase E: Visual Feedback (Priority P3)

**Estimated Time**: 3-4 hours

1. **Write Tests First** ✅ TDD Red Phase

   - [ ] Test cursor changes
   - [ ] Test preview visibility
   - [ ] Test target highlighting

2. **Implement Visual Feedback** ✅ TDD Green Phase

   - [ ] Add CSS cursor classes
   - [ ] Style drag preview with shadcn/ui classes
   - [ ] Add target node highlighting styles
   - [ ] Verify tests pass

3. **Add Animations** ✅ TDD Green Phase
   - [ ] Add smooth transitions for preview
   - [ ] Add settle animation on drop
   - [ ] Verify 60fps performance

---

## Code Snippets

### 1. DndContext Setup (ImpactTreeApp.tsx)

```typescript
import { DndContext, DragOverlay, MouseSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragNode } from '@/hooks/useDragNode';

export function ImpactTreeApp() {
  const { dragState, startDrag, updateDragPosition, endDrag, cancelDrag } = useDragNode({
    onNodeCreate: handleNodeCreate
  });

  // Configure sensors for mouse and keyboard
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10 // 10px before drag starts
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      cancelDrag();
      return;
    }

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = screenToCanvasCoordinates(
      event.activatorEvent.clientX,
      event.activatorEvent.clientY,
      svgRef.current,
      viewBox
    );

    endDrag(canvasPosition);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={cancelDrag}
    >
      {/* Existing app components */}
      <Sidebar ... />
      <ImpactCanvas ... />
      <PropertiesPanel ... />

      {/* Drag preview overlay */}
      <DragOverlay>
        {dragState.isDragging && dragState.activeNodeType && (
          <div className="opacity-60 cursor-grabbing">
            <Badge variant={getNodeVariant(dragState.activeNodeType)}>
              {getNodeLabel(dragState.activeNodeType)}
            </Badge>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

### 2. Draggable Node Type Button (Sidebar.tsx)

```typescript
import { useDraggable } from "@dnd-kit/core";

function NodeTypeButton({ type }: { type: NodeType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `node-type-${type}`,
    data: { type },
  });

  return (
    <Button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      variant={
        mode === "add-node" && selectedNodeType === type ? "default" : "outline"
      }
      className={isDragging ? "opacity-50" : ""}
      onClick={() => handleNodeTypeClick(type)}
    >
      {getNodeLabel(type)}
    </Button>
  );
}
```

### 3. Droppable Canvas (ImpactCanvas.tsx)

```typescript
import { useDroppable } from '@dnd-kit/core';

export function ImpactCanvas({ dragState, onDrop }: ImpactCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone'
  });

  return (
    <svg ref={setNodeRef} ...>
      {/* Existing canvas content */}

      {/* Relationship drag preview */}
      {dragState.isDragging && dragState.dragType === 'relationship' && (
        <line
          x1={dragState.previewPosition.x}
          y1={dragState.previewPosition.y}
          x2={dragState.cursorPosition.x}
          y2={dragState.cursorPosition.y}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.7"
          className="pointer-events-none"
        />
      )}
    </svg>
  );
}
```

### 4. Coordinate Transformation Utility (lib/drag-utils.ts)

```typescript
/**
 * Convert screen coordinates to canvas coordinates
 * Accounts for zoom level and viewBox transformation
 */
export function screenToCanvasCoordinates(
  screenX: number,
  screenY: number,
  svgElement: SVGSVGElement,
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  }
): { x: number; y: number } {
  const rect = svgElement.getBoundingClientRect();

  // Normalize to [0, 1] range
  const normalizedX = (screenX - rect.left) / rect.width;
  const normalizedY = (screenY - rect.top) / rect.height;

  // Map to viewBox coordinates
  const canvasX = normalizedX * viewBox.width + viewBox.x;
  const canvasY = normalizedY * viewBox.height + viewBox.y;

  return { x: canvasX, y: canvasY };
}
```

---

## Testing Checklist

### Unit Tests

- [ ] useDragNode hook: start, update, end, cancel transitions
- [ ] useDragRelationship hook: all state transitions
- [ ] useCanvasAutoPan hook: edge detection, velocity calculation
- [ ] Coordinate transformation utility: various zoom levels

### Integration Tests

- [ ] Node drag-and-drop: sidebar to canvas
- [ ] Relationship drag-and-drop: node to node
- [ ] Keyboard mode: shortcuts, navigation, placement
- [ ] Auto-pan: triggers near edges, stops correctly
- [ ] Error handling: self-relationship, duplicate relationship

### Accessibility Tests

- [ ] Keyboard navigation works without mouse
- [ ] Screen reader announces drag operations
- [ ] Focus management during/after drag
- [ ] ARIA labels present on all interactive elements

### Performance Tests

- [ ] Visual feedback < 100ms (SC-005)
- [ ] Drag operations maintain 60fps
- [ ] No memory leaks in animation frames

---

## Common Issues & Solutions

### Issue: Drag not starting

**Solution**: Check activation constraint (distance: 10). Ensure button has `useDraggable` listeners attached.

### Issue: Coordinate mismatch at different zoom levels

**Solution**: Verify `screenToCanvasCoordinates` uses current viewBox state. Test at zoom levels 0.5x, 1x, 2x, 3x.

### Issue: Auto-pan too fast/slow

**Solution**: Adjust `MAX_PAN_SPEED` and `ACCELERATION_FACTOR` in `DRAG_CONSTANTS`.

### Issue: Preview not visible

**Solution**: Check z-index. `DragOverlay` renders in portal, should be above canvas.

### Issue: Keyboard shortcuts conflict

**Solution**: Only activate when canvas has focus. Use `e.preventDefault()` to stop browser defaults.

---

## Completion Criteria

Feature is complete when:

1. ✅ All 111 existing tests pass
2. ✅ 30+ new tests pass (hooks + integration)
3. ✅ All 8 success criteria from spec.md verified:
   - SC-001: Node creation < 3 seconds ✅
   - SC-002: 90% first-attempt success ✅
   - SC-003: Relationship creation < 4 seconds ✅
   - SC-004: Zero accidental nodes ✅
   - SC-005: Feedback < 100ms ✅
   - SC-006: Works at all zoom levels ✅
   - SC-007: 95% expected outcomes ✅
   - SC-008: 60% fewer relationship errors ✅
4. ✅ Constitutional requirements met (all principles)
5. ✅ README updated with keyboard shortcuts
6. ✅ JSDoc documentation complete

---

## Next Steps

After completing this implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Begin Phase A implementation following TDD workflow
3. Create PR when Phase A complete for early feedback
4. Continue with subsequent phases

---

**Need Help?**

- Review `/specs/001-improve-node-and/research.md` for technical decisions
- Review `/specs/001-improve-node-and/data-model.md` for state structure
- Check @dnd-kit docs: https://docs.dndkit.com/
- Review shadcn/ui docs: https://ui.shadcn.com/

**Quickstart Complete** ✅
