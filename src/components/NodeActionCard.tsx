import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, Link2, BarChart3 } from "lucide-react";
import type { Node, Measurement } from "@/types";

interface NodeActionCardProps {
  node: Node;
  measurements: Map<string, Measurement>;
  nodePosition: { x: number; y: number };
  onDelete: (nodeId: string) => void;
  onStartConnect: (nodeId: string) => void;
}

/**
 * Floating action card that appears near selected nodes
 *
 * Shows:
 * - Quick action buttons (connect, delete)
 * - Mini measurement summary
 */
export const NodeActionCard = memo(function NodeActionCard({
  node,
  measurements,
  nodePosition,
  onDelete,
  onStartConnect,
}: NodeActionCardProps) {
  // Get measurements for this node
  const nodeMeasurements = useMemo(() => {
    const result: Measurement[] = [];
    measurements.forEach((m) => {
      if (m.node_id === node.id) {
        result.push(m);
      }
    });
    return result;
  }, [measurements, node.id]);

  // Calculate average performance
  const avgPerformance = useMemo(() => {
    if (nodeMeasurements.length === 0) return null;
    const total = nodeMeasurements.reduce((sum, m) => {
      return sum + (m.actual_value / m.expected_value) * 100;
    }, 0);
    return Math.round(total / nodeMeasurements.length);
  }, [nodeMeasurements]);

  return (
    <motion.div
      className="absolute z-20 pointer-events-auto"
      style={{
        left: `${nodePosition.x}px`,
        top: `${nodePosition.y}px`,
      }}
      initial={{ opacity: 0, x: 20, y: "-50%" }}
      animate={{ opacity: 1, x: 40, y: "-50%" }}
      exit={{ opacity: 0, x: 20, y: "-50%" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="flex flex-col gap-2 p-2 rounded-xl bg-card/95 backdrop-blur-sm border shadow-elevated"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onStartConnect(node.id)}
                aria-label="Create connection"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Create connection</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(node.id)}
                aria-label="Delete node"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Delete node</TooltipContent>
          </Tooltip>
        </div>

        {/* Mini measurement summary */}
        {nodeMeasurements.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-2 px-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {nodeMeasurements.length} metric{nodeMeasurements.length !== 1 ? "s" : ""}
              </span>
              {avgPerformance !== null && (
                <span
                  className={`text-xs font-medium ${
                    avgPerformance >= 80
                      ? "text-emerald-600"
                      : avgPerformance >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {avgPerformance}%
                </span>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
});
