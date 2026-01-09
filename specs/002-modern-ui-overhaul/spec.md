# Modern UI Overhaul Design Spec

## Overview

Modernize the Impact Tree Builder UI to match contemporary node-based canvas applications, inspired by tools like Viss, Figma, and Linear. The goal is a clean, minimal aesthetic with improved visual hierarchy and delightful interactions.

## Design Reference Analysis

Based on the provided reference (Viss workflow builder), key design patterns to adopt:

### Visual Language

#### Color Palette
- **Background**: Near-white canvas (`#F8F9FA` or `hsl(210, 20%, 98%)`)
- **Cards/Panels**: Pure white (`#FFFFFF`) with subtle shadows
- **Primary Accent**: Green (`#10B981` / emerald-500) for active states and CTAs
- **Text Primary**: Dark gray (`#1F2937` / gray-800)
- **Text Secondary**: Medium gray (`#6B7280` / gray-500)
- **Borders**: Very light gray (`#E5E7EB` / gray-200)
- **Node Colors**: Keep existing color system but soften with pastel variants

#### Typography
- **Font Family**: Inter or system-ui (already using)
- **Headings**: Semi-bold, slightly larger
- **Body**: Regular weight, comfortable line-height
- **Labels**: Small, medium gray, uppercase tracking for sections

#### Shadows & Depth
- **Cards**: `shadow-sm` to `shadow-md` (soft, diffuse)
- **Elevated elements**: `shadow-lg` with slight blur
- **No harsh drop shadows** - use layered, natural-feeling depth

#### Borders & Corners
- **Border radius**: Increase to `rounded-xl` (12px) for cards, `rounded-full` for circular elements
- **Borders**: 1px light gray, often omitted in favor of shadow

### Component Redesign

#### 1. Canvas Nodes (Major Change)

**Current**: Rectangles/ellipses with solid fill and text labels

**New Design**:
- **Circular icon nodes** with gradient ring/glow for primary nodes
- **Satellite action buttons** around nodes (small circles)
- **Expandable detail cards** that float near nodes when selected
- **Softer connection lines** with subtle curves

```
Node Visual Structure:
┌─────────────────────────────────────┐
│                                     │
│    ○ ○    <- Satellite actions      │
│   ╭───╮                             │
│  │ 🎯 │   <- Icon in gradient ring  │
│   ╰───╯                             │
│    ○ ○                              │
│                                     │
└─────────────────────────────────────┘
```

**Node Types Visual Mapping**:
| Type | Icon | Ring Color |
|------|------|------------|
| Business Metric | TrendingUp | Blue gradient |
| Product Metric | BarChart3 | Green gradient |
| Initiative | Lightbulb | Purple gradient |

#### 2. Sidebar (Moderate Change)

**Current**: Dense panel with buttons and stats

**New Design**:
- **Collapsible sections** with smooth animations
- **Drag handles** (dotted grip pattern) for node type buttons
- **Pill-shaped buttons** with icons
- **Statistics** displayed as mini-cards with icons
- **Search/filter** input at top

```
Sidebar Structure:
┌────────────────────────┐
│ 🔍 Search nodes...     │
├────────────────────────┤
│ ▼ Add Nodes            │
│   ⋮⋮ 📈 Business Metric│
│   ⋮⋮ 📊 Product Metric │
│   ⋮⋮ 💡 Initiative     │
├────────────────────────┤
│ ▼ Tree Info            │
│   Name: [___________]  │
│   Description: [____]  │
├────────────────────────┤
│ ▼ Statistics           │
│   ┌────┐ ┌────┐       │
│   │ 12 │ │  8 │       │
│   │nodes│ │rels│       │
│   └────┘ └────┘       │
└────────────────────────┘
```

#### 3. Properties Panel (Moderate Change)

**Current**: Form fields stacked vertically

**New Design**:
- **Tabbed interface** at top (like reference: "Slack" / "Document")
- **Grouped sections** with headers
- **Toggle switches** for boolean options (green when active)
- **Dropdown selects** with chevrons and clean styling
- **Action items** with drag handles for reordering

```
Properties Panel Structure:
┌─────────────────────────────┐
│ [Node ▼] [Measurements]     │  <- Tabs
├─────────────────────────────┤
│ ◇ Business Metric           │
│   Display Name              │
│                             │
│ Aa Description              │
│   Short description         │
│                             │
│ ▼ Appearance                │
│   Color    [● Blue    ▼]   │
│   Shape    [○ Circle  ▼]   │
│                             │
│ ▼ Measurements              │
│   1. ⋮⋮ Revenue Impact      │
│   2. ⋮⋮ User Growth         │
│   [+ Add measurement]       │
└─────────────────────────────┘
```

#### 4. Floating Action Cards (New Component)

When a node is selected, show a floating card nearby with:
- Quick actions (edit, delete, connect)
- Mini measurement summary
- Related nodes preview

#### 5. Canvas Controls

**Current**: Basic zoom buttons

**New Design**:
- **Floating toolbar** at bottom center (like reference)
- **Zoom slider** with percentage display
- **Minimap toggle**
- **Fit to screen** button

```
Bottom Toolbar:
┌─────────────────────────────────────┐
│  ✨ Impact Tree  │ 📄 Untitled │ ▶ 100% ▼  │
└─────────────────────────────────────┘
```

### Interaction Patterns

#### Animations
- **Node hover**: Subtle scale (1.02x) with shadow lift
- **Selection**: Ring pulse animation
- **Drag**: Node follows with slight lag (spring physics)
- **Panel transitions**: Slide with fade (200ms ease-out)

#### Micro-interactions
- **Button press**: Scale down slightly (0.98x)
- **Toggle switch**: Smooth slide with color transition
- **Dropdown open**: Fade + slight Y translate

### Responsive Considerations

- **Sidebar**: Collapsible to icon-only on smaller screens
- **Properties panel**: Slides over canvas on mobile
- **Canvas**: Touch-friendly with pinch-to-zoom

## Implementation Phases

### Phase 1: Foundation
- Update Tailwind config with new color tokens
- Create CSS variables for theming
- Update base component styles (buttons, inputs, cards)

### Phase 2: Layout Restructure
- Implement collapsible sidebar
- Add tabbed properties panel
- Create floating toolbar component

### Phase 3: Canvas Redesign
- Implement circular node rendering
- Add gradient ring effects
- Create satellite action buttons
- Update connection line styles

### Phase 4: New Components
- Floating action cards
- Node detail popover
- Improved measurement list with drag-reorder

### Phase 5: Animation & Polish
- Add Framer Motion or CSS transitions
- Implement micro-interactions
- Performance optimization

## Technical Considerations

### Dependencies to Add
- `framer-motion` - for smooth animations
- Consider `@radix-ui/react-popover` - for floating cards

### Files to Modify
- `src/index.css` - global styles, CSS variables
- `tailwind.config.js` - extend theme
- `src/components/ui/*` - all base components
- `src/components/ImpactCanvas.tsx` - node rendering
- `src/components/Sidebar.tsx` - layout restructure
- `src/components/PropertiesPanel.tsx` - tabs and grouping
- New: `src/components/FloatingToolbar.tsx`
- New: `src/components/NodeActionCard.tsx`
- New: `src/components/CircularNode.tsx`

### Backwards Compatibility
- Keep existing data model unchanged
- Node shape property can map to new circular style
- Export functions may need updates for new visual style

## Success Metrics

- Cleaner visual hierarchy
- Reduced visual clutter
- Improved discoverability of actions
- Smoother interactions
- Consistent design language throughout
