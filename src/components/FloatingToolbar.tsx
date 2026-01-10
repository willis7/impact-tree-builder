import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Focus,
  Sparkles,
} from "lucide-react";

interface FloatingToolbarProps {
  treeName: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenterView: () => void;
}

/**
 * Modern floating toolbar at the bottom of the canvas
 *
 * Displays:
 * - Tree name
 * - Zoom controls with percentage
 * - View controls
 */
export const FloatingToolbar = memo(function FloatingToolbar({
  treeName,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetView,
  onCenterView,
}: FloatingToolbarProps) {
  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-card/95 backdrop-blur-sm border shadow-elevated">
        {/* App indicator */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {treeName || "Untitled"}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <div className="w-12 text-center text-sm font-medium tabular-nums">
            {zoomPercentage}%
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* View controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onCenterView}
                aria-label="Fit to screen"
              >
                <Focus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to screen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onResetView}
                aria-label="Reset view"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset view</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});
