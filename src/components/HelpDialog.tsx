import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Help dialog component displaying documentation and keyboard shortcuts
 *
 * Provides comprehensive help content including:
 * - Getting started guide
 * - Interface overview
 * - Node and relationship creation instructions
 * - Keyboard shortcuts reference
 * - Tips and best practices
 */
export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Impact Tree Builder Help
          </DialogTitle>
          <DialogDescription>
            Learn how to use the Impact Tree Builder to create and analyze impact networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
            <div className="space-y-2 text-sm">
              <p>
                The Impact Tree Builder helps you create visual impact networks to analyze cause-and-effect relationships
                in your projects and initiatives. Impact trees show how different factors (initiatives, metrics, and outcomes)
                are connected and influence each other.
              </p>
              <p>
                <strong>Key Concepts:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Business Metrics</strong> (green rectangles): Top-level outcomes you want to achieve</li>
                <li><strong>Product Metrics</strong> (blue rectangles): Measurable indicators of progress</li>
                <li><strong>Initiatives</strong> (orange ellipses): Actions, projects, or changes you can implement</li>
                <li><strong>Relationships</strong>: Arrows showing how elements influence each other</li>
                <li><strong>Measurements</strong>: Data points tracking actual vs. expected performance</li>
              </ul>
            </div>
          </section>

          {/* Interface Overview */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Interface Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Toolbar (Top)</h4>
                <ul className="space-y-1">
                  <li><strong>New:</strong> Clear the canvas for a new impact tree</li>
                  <li><strong>Save:</strong> Save current tree to browser storage</li>
                  <li><strong>Load:</strong> Import tree from JSON file</li>
                  <li><strong>Export:</strong> Download tree as JSON file</li>
                  <li><strong>Help:</strong> Show this help dialog</li>
                  <li><strong>Theme:</strong> Toggle between light and dark mode</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Main Areas</h4>
                <ul className="space-y-1">
                  <li><strong>Sidebar (Left):</strong> Tree info, node creation tools</li>
                  <li><strong>Canvas (Center):</strong> Visual impact tree workspace</li>
                  <li><strong>Properties (Right):</strong> Edit selected items</li>
                  <li><strong>Canvas Controls:</strong> Zoom and pan the view</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Creating Content */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Creating Your Impact Tree</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Adding Nodes</h4>
                <p className="mb-2">Use the sidebar tools or keyboard shortcuts to add nodes:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Click and drag node type buttons from the sidebar to the canvas</li>
                  <li>Use keyboard shortcuts to select node types, then click on canvas</li>
                  <li>Edit node properties in the right panel after selection</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Creating Relationships</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Enter "Connect" mode using the sidebar button or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd></li>
                  <li>Click on source node, then click on target node</li>
                  <li>Relationships are automatically typed based on node colors</li>
                  <li>Green arrows: desirable effects, Red arrows: undesirable effects</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Adding Measurements</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Select a node in the canvas</li>
                  <li>Use the "Add Measurement" button in the properties panel</li>
                  <li>Enter metric name, expected/actual values, and dates</li>
                  <li>Choose impact type: proximate (direct) or downstream (indirect)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Node Creation</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Business Metric</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">B</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Product Metric</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">P</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Initiative (Positive)</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">I</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Initiative (Negative)</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">N</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Modes & Actions</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Select Mode</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Connect Mode</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancel/Exit Mode</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Help</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">F1</kbd>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Tips & Best Practices</h3>
            <div className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Start with business metrics (outcomes) at the top, then work downwards</li>
                <li>Use consistent naming conventions for related nodes</li>
                <li>Add measurements to track progress and validate your impact assumptions</li>
                <li>Use different relationship types to show positive vs. negative impacts</li>
                <li>Regularly save your work and export backups</li>
                <li>Use the zoom and pan controls to navigate large impact trees</li>
              </ul>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
