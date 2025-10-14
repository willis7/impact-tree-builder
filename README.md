# Impact Tree Builder - Modern Version

A modern, fully-featured impact tree visualization tool built with React, TypeScript, Vite, Tailwind CSS, and shadcn-ui.

## 🚀 Tech Stack

- **Vite** - Next-generation frontend tooling
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - Beautiful, accessible component library
- **Lucide React** - Modern icon set

## ✨ Features

### Core Functionality (Preserved from Original)
- ✅ Interactive impact tree visualization with SVG
- ✅ Multiple node types: Business Metrics, Product Metrics, Initiatives
- ✅ Relationship mapping with visual indicators
- ✅ Drag-and-drop node positioning
- ✅ Node property editing
- ✅ Measurement tracking with performance indicators
- ✅ Canvas controls (zoom, pan, reset, center)
- ✅ Save/Load functionality
- ✅ Export to JSON
- ✅ Real-time statistics

### Modern Enhancements
- 🎨 Modern, clean UI with shadcn-ui components
- 🌓 Dark mode support (system preference)
- 📱 Responsive design
- ⚡ Lightning-fast with Vite
- 🔒 Type-safe with TypeScript
- 🎯 Accessible components
- 🎭 Smooth animations and transitions
- 💅 Professional styling with Tailwind CSS

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173/`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn-ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   └── label.tsx
│   ├── ImpactTreeApp.tsx     # Main application component
│   ├── ImpactCanvas.tsx       # SVG canvas with nodes and relationships
│   ├── Sidebar.tsx            # Left sidebar with tools
│   └── PropertiesPanel.tsx    # Right panel for properties and measurements
├── data/
│   └── sampleData.ts          # Sample impact tree data
├── lib/
│   └── utils.ts               # Utility functions
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Global styles with Tailwind
```

## 🎯 Usage

### Adding Nodes
1. Select a node type from the left sidebar (Business Metric, Product Metric, or Initiative)
2. Click anywhere on the canvas to place the node
3. Edit the node properties in the right panel

### Creating Relationships
1. Click "Connect Nodes" in the left sidebar
2. Select the relationship type (Desirable Effect, Undesirable Effect, or Rollup)
3. Click on two nodes to create a relationship

### Moving Nodes
- Simply drag and drop nodes to reposition them on the canvas

### Adding Measurements
1. Select a node
2. Click the "+" button in the Measurements section
3. Fill in the measurement details
4. Performance indicators will automatically update

### Canvas Controls
- **Zoom In/Out** - Use the + and - buttons
- **Reset View** - Return to default zoom and position
- **Center View** - Center the canvas on all nodes

### Saving and Exporting
- **Save** - Saves to browser localStorage
- **Load** - Loads from browser localStorage
- **Export** - Downloads as JSON file

## 🎨 Customization

### Tailwind Configuration
Customize the theme in `tailwind.config.js`:
- Colors
- Spacing
- Border radius
- Shadows

### Component Styling
All UI components are fully customizable through Tailwind utility classes.

### Adding New Node Types
1. Update the `Node` type in `src/types/index.ts`
2. Add the new type to the Sidebar component
3. Update the color and shape logic in `ImpactTreeApp.tsx`

## 🔧 Configuration

### Path Aliases
The project uses `@` as an alias for the `src` directory:
```typescript
import { Button } from '@/components/ui/button'
```

Configured in:
- `vite.config.ts`
- `tsconfig.app.json`

## 📦 Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder, ready to deploy to any static hosting service.

## 🚢 Deployment

The app can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Simply run `npm run build` and deploy the `dist` folder.

## 🆚 Comparison with Original

| Feature | Original | Modern Version |
|---------|----------|----------------|
| Framework | Vanilla JS | React + TypeScript |
| Build Tool | None | Vite |
| Styling | Custom CSS | Tailwind CSS + shadcn-ui |
| Type Safety | ❌ | ✅ TypeScript |
| Component Architecture | Monolithic | Modular Components |
| Dark Mode | ❌ | ✅ Built-in |
| Performance | Good | Excellent (Vite) |
| Developer Experience | Basic | Modern with HMR, types |
| Accessibility | Basic | Enhanced (shadcn-ui) |
| Maintainability | Moderate | High |

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
