# Phase 0: Research & Technology Decisions

**Feature**: Drag-and-Drop Interactions for Node and Relationship Creation  
**Date**: October 15, 2025  
**Status**: ✅ Complete

## Research Questions

### 1. Drag-and-Drop Library Selection

**Decision**: @dnd-kit/core v6.x

**Rationale**:

- **TypeScript Support**: Full TypeScript support with comprehensive type definitions (required by Constitution Principle IV)
- **React 19 Compatibility**: Works with React 19.1.1 (our current version)
- **Accessibility**: Built-in keyboard navigation and screen reader support (required by Constitution Principle V - WCAG 2.1 AA)
- **shadcn/ui Integration**: Uses Radix UI primitives like shadcn/ui, ensuring consistent API patterns
- **Active Maintenance**: Actively maintained with regular updates (last release within 3 months)
- **Performance**: Optimized for 60fps animations using modern browser APIs (requestAnimationFrame)
- **Modular Architecture**: Core package (@dnd-kit/core) with optional utilities (@dnd-kit/utilities) matches our component-first approach

**Alternatives Considered**:

- **react-dnd**: Older library, less active maintenance, heavier bundle size, no built-in accessibility
- **react-beautiful-dnd**: Deprecated by Atlassian, not actively maintained
- **Pragmatic drag-and-drop**: New library, less ecosystem support, no TypeScript first-class support
- **Native HTML5 Drag API**: Poor touch support, limited customization, accessibility challenges

**Implementation Approach**:

```typescript
// Core packages needed
npm install @dnd-kit/core @dnd-kit/utilities

// No additional packages required - keeps bundle small
```

---

### 2. Drag Preview Rendering Strategy

**Decision**: Portal-based preview with React.createPortal

**Rationale**:

- **Positioning**: Portal renders preview outside component hierarchy, avoiding z-index conflicts
- **Performance**: Single preview element reused across all drags (no DOM thrashing)
- **Theming**: Preview can access root-level CSS variables from shadcn/ui theme
- **shadcn/ui Compatibility**: Can reuse shadcn/ui Badge component styled with CSS variables
- **Animation**: Can apply Tailwind CSS transitions and transforms smoothly

**Alternatives Considered**:

- **@dnd-kit DragOverlay**: Built-in component but less control over styling
- **In-place rendering**: Would require z-index management and could clip at canvas boundaries
- **Canvas element**: Overkill for simple node preview, harder to style

**Implementation Pattern**:

```typescript
// In ImpactTreeApp.tsx
import { DragOverlay } from "@dnd-kit/core";

<DragOverlay>
  {activeNodeType && (
    <div className="opacity-60">
      <Badge variant={getNodeVariant(activeNodeType)}>
        {getNodeLabel(activeNodeType)}
      </Badge>
    </div>
  )}
</DragOverlay>;
```

---

### 3. Canvas Auto-Pan Mechanism

**Decision**: requestAnimationFrame-based auto-pan with configurable edge detection

**Rationale**:

- **Smooth Performance**: requestAnimationFrame ensures 60fps pan animation
- **Configurable Zones**: Define edge proximity threshold (e.g., 50px from viewport edge)
- **Velocity Control**: Pan speed increases closer to edge for intuitive UX
- **Cancellable**: Easy to stop when drag ends or moves away from edges
- **No Dependencies**: Pure JavaScript solution, no additional libraries

**Alternatives Considered**:

- **CSS-based auto-scroll**: Limited control, poor UX for infinite canvas
- **Third-party libraries**: Unnecessary dependency for simple functionality
- **Scroll events**: Canvas uses SVG viewBox, not scroll, so incompatible

**Implementation Pattern**:

```typescript
// In useCanvasAutoPan.ts custom hook
const EDGE_THRESHOLD = 50; // px from viewport edge
const MAX_PAN_SPEED = 10; // px per frame
const ACCELERATION_FACTOR = 0.2;

useEffect(() => {
  if (!isDragging) return;

  let animationFrame: number;

  const autoPan = () => {
    const { x, y } = cursorPosition;
    const { width, height } = canvasRect;

    // Calculate distance from edges
    const distanceFromLeft = x;
    const distanceFromRight = width - x;
    const distanceFromTop = y;
    const distanceFromBottom = height - y;

    // Calculate pan velocity based on proximity
    let panX = 0,
      panY = 0;

    if (distanceFromLeft < EDGE_THRESHOLD) {
      panX =
        -MAX_PAN_SPEED *
        (1 - distanceFromLeft / EDGE_THRESHOLD) *
        ACCELERATION_FACTOR;
    } else if (distanceFromRight < EDGE_THRESHOLD) {
      panX =
        MAX_PAN_SPEED *
        (1 - distanceFromRight / EDGE_THRESHOLD) *
        ACCELERATION_FACTOR;
    }

    if (distanceFromTop < EDGE_THRESHOLD) {
      panY =
        -MAX_PAN_SPEED *
        (1 - distanceFromTop / EDGE_THRESHOLD) *
        ACCELERATION_FACTOR;
    } else if (distanceFromBottom < EDGE_THRESHOLD) {
      panY =
        MAX_PAN_SPEED *
        (1 - distanceFromBottom / EDGE_THRESHOLD) *
        ACCELERATION_FACTOR;
    }

    // Update viewBox
    if (panX !== 0 || panY !== 0) {
      updateViewBox((prev) => ({
        ...prev,
        x: prev.x + panX,
        y: prev.y + panY,
      }));
    }

    animationFrame = requestAnimationFrame(autoPan);
  };

  animationFrame = requestAnimationFrame(autoPan);

  return () => cancelAnimationFrame(animationFrame);
}, [isDragging, cursorPosition, canvasRect]);
```

---

### 4. Keyboard Shortcuts Implementation

**Decision**: Global keyboard event listeners with contextual awareness

**Rationale**:

- **Accessibility**: Required by FR-017, FR-018 (keyboard-only users)
- **WCAG Compliance**: Meets WCAG 2.1 AA keyboard navigation requirements
- **@dnd-kit Support**: @dnd-kit has built-in keyboard support for drag operations
- **Contextual**: Shortcuts only active when canvas has focus
- **Discoverable**: Will document shortcuts in UI and README

**Alternatives Considered**:

- **Command palette**: Too heavy for simple shortcuts
- **Browser extensions**: Would exclude most users
- **Mouse-only**: Violates accessibility requirements

**Keyboard Shortcuts Mapping**:

```typescript
// Defined in keyboard-shortcuts.ts
const KEYBOARD_SHORTCUTS = {
  // Node type selection
  b: "business_metric",
  p: "product_metric",
  i: "initiative_positive",
  n: "initiative_negative",

  // Actions
  Escape: "cancel_drag",
  Enter: "place_node",
  ArrowUp: "move_cursor_up",
  ArrowDown: "move_cursor_down",
  ArrowLeft: "move_cursor_left",
  ArrowRight: "move_cursor_right",

  // Modes
  c: "connect_mode",
  s: "select_mode",
};

// Usage in ImpactTreeApp.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!canvasHasFocus) return;

    const action = KEYBOARD_SHORTCUTS[e.key];
    if (!action) return;

    e.preventDefault();
    handleKeyboardAction(action);
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [canvasHasFocus, handleKeyboardAction]);
```

---

### 5. Coordinate Transformation at Different Zoom Levels

**Decision**: SVG viewBox-based coordinate transformation

**Rationale**:

- **Existing Pattern**: Canvas already uses SVG viewBox for zoom/pan
- **Accurate Mapping**: SVG provides accurate screen-to-canvas coordinate transformation
- **Scale Independent**: Coordinates automatically account for zoom level
- **No Additional Libraries**: Native SVG API support

**Alternatives Considered**:

- **Manual transformation**: Error-prone, duplicates SVG logic
- **Matrix transformations**: Unnecessarily complex for this use case

**Implementation Pattern**:

```typescript
// In drag-utils.ts
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
  // Get SVG bounding rect
  const rect = svgElement.getBoundingClientRect();

  // Convert screen coordinates to SVG coordinates
  const svgX = ((screenX - rect.left) / rect.width) * viewBox.width + viewBox.x;
  const svgY =
    ((screenY - rect.top) / rect.height) * viewBox.height + viewBox.y;

  return { x: svgX, y: svgY };
}

// Usage in ImpactCanvas.tsx
const handleDrop = (event: DragEndEvent) => {
  const { x, y } = screenToCanvasCoordinates(
    event.active.rect.current.translated.left,
    event.active.rect.current.translated.top,
    svgRef.current,
    viewBox
  );

  createNode({ ...nodeData, position_x: x, position_y: y });
};
```

---

### 6. Relationship Drag Visual Feedback

**Decision**: SVG line element with dynamic path

**Rationale**:

- **Native SVG**: Canvas is already SVG-based, line integrates naturally
- **Smooth Updates**: SVG path updates efficiently during drag
- **Styling**: Can use shadcn/ui color variables via Tailwind classes
- **Arrow Support**: Can add arrow markers for directionality

**Alternatives Considered**:

- **HTML div with CSS**: Would not align with SVG canvas, positioning issues
- **Canvas 2D API**: Incompatible with existing SVG structure

**Implementation Pattern**:

```typescript
// In ImpactCanvas.tsx
{
  isDraggingRelationship && dragStart && (
    <line
      x1={dragStart.x}
      y1={dragStart.y}
      x2={cursorPosition.x}
      y2={cursorPosition.y}
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeDasharray="5,5"
      opacity="0.7"
      className="pointer-events-none"
    />
  );
}
```

---

### 7. Error Message Display Strategy

**Decision**: shadcn/ui Toast component for transient errors

**Rationale**:

- **shadcn/ui Native**: Already available in project (required by Constitution Principle III)
- **Non-Blocking**: Toast doesn't interrupt workflow
- **Accessible**: Built-in ARIA announcements for screen readers
- **Consistent**: Matches existing error handling patterns
- **Auto-Dismiss**: Configurable timeout for user convenience

**Alternatives Considered**:

- **Alert dialog**: Too disruptive for simple errors
- **Inline error messages**: No clear place in UI during drag operation
- **Console only**: Violates accessibility requirements

**Implementation Pattern**:

```typescript
// In ImpactTreeApp.tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

const handleInvalidDrop = (reason: string) => {
  toast({
    variant: "destructive",
    title: "Cannot create node",
    description: reason,
    duration: 3000,
  });
};

// Usage examples
handleInvalidDrop("Cannot connect a node to itself");
handleInvalidDrop("A relationship of this type already exists");
handleInvalidDrop("Node placement cancelled");
```

---

## Best Practices Summary

### @dnd-kit/core Usage Patterns

1. **Sensors**: Use mouse and keyboard sensors for cross-input support
2. **Collision Detection**: Use closestCenter algorithm for relationship targets
3. **Data Transfer**: Use custom data objects typed with TypeScript
4. **Accessibility**: Leverage built-in announcements and keyboard navigation
5. **Performance**: Minimize re-renders with useMemo for droppable areas

### Testing Strategy

1. **Unit Tests**: Test custom hooks (useDragNode, useDragRelationship, useCanvasAutoPan) in isolation
2. **Component Tests**: Test drag initiation, preview rendering, drop handling with React Testing Library
3. **Integration Tests**: Test complete drag-and-drop workflows across components
4. **Accessibility Tests**: Test keyboard navigation, screen reader announcements
5. **Performance Tests**: Verify 60fps animations and 100ms feedback latency

### Code Organization

1. **Custom Hooks**: Encapsulate drag state management
2. **Utility Functions**: Coordinate transformations, validation logic
3. **Type Definitions**: Centralize in types/drag.ts
4. **Constants**: Define in lib/drag-constants.ts
5. **Components**: Modify existing components, avoid creating new ones

---

## Dependencies to Install

```bash
# Core drag-and-drop library
npm install @dnd-kit/core@^6.1.0

# Utilities for collision detection and transforms
npm install @dnd-kit/utilities@^3.2.2

# Development dependencies (if not already present)
npm install --save-dev @types/react@^19.0.0
```

**Bundle Size Impact**:

- @dnd-kit/core: ~15KB gzipped
- @dnd-kit/utilities: ~5KB gzipped
- Total: ~20KB (acceptable for feature scope)

---

## Performance Considerations

1. **Drag Preview**: Single portal element, not per-drag instance
2. **Auto-Pan**: requestAnimationFrame for 60fps
3. **Collision Detection**: Only check visible nodes
4. **State Updates**: Debounce cursor position updates if needed
5. **Event Listeners**: Clean up on unmount

---

## Accessibility Checklist

- ✅ Keyboard shortcuts for all drag operations (FR-017, FR-018)
- ✅ Screen reader announcements for drag events (@dnd-kit built-in)
- ✅ Focus management during and after drag
- ✅ ARIA labels on interactive elements
- ✅ Visible focus indicators (shadcn/ui default)
- ✅ Error messages announced to screen readers (Toast)
- ✅ Alternative click workflows maintained

---

## Research Complete

All technical unknowns resolved. Ready to proceed to Phase 1: Design & Contracts.
