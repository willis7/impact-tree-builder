import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenterView: () => void;
}

/**
 * Canvas control buttons for zoom and view operations
 *
 * Provides floating buttons for:
 * - Zoom in (1.2x)
 * - Zoom out (0.8x)
 * - Reset view to default
 * - Center view on all nodes
 */
export const CanvasControls = memo(function CanvasControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onCenterView,
}: CanvasControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={onZoomIn}
        className="shadow-lg"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onZoomOut}
        className="shadow-lg"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onResetView}
        className="shadow-lg"
        aria-label="Reset view"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onCenterView}
        className="shadow-lg"
        aria-label="Center view on all nodes"
      >
        <Move className="h-4 w-4" />
      </Button>
    </div>
  );
});
