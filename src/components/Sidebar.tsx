import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useMemo, useCallback, memo } from "react";
import {
  Search,
  Link2,
  TrendingUp,
  BarChart3,
  Lightbulb,
  GripVertical,
  Layers,
  GitBranch,
  Activity,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { ImpactTree, Node, Relationship, Measurement } from "@/types";
import type { NodeType } from "@/types/drag";
import { sanitizeInput, sanitizeDescription } from "@/lib/sanitize";
import { NODE_TYPE_CONFIG } from "@/lib/node-utils";

/**
 * Configuration for draggable node type buttons
 */
interface NodeButtonConfig {
  nodeType: NodeType;
  label: string;
  icon: React.ElementType;
  gradientClass: string;
  tooltipText: string;
}

/**
 * Node button configurations with icons and gradient colors
 */
const NODE_BUTTON_CONFIGS: NodeButtonConfig[] = [
  {
    nodeType: "business_metric",
    label: NODE_TYPE_CONFIG.business_metric.label,
    icon: TrendingUp,
    gradientClass: "from-blue-500 to-cyan-500",
    tooltipText: "Add a business outcome or goal metric",
  },
  {
    nodeType: "product_metric",
    label: NODE_TYPE_CONFIG.product_metric.label,
    icon: BarChart3,
    gradientClass: "from-emerald-500 to-green-500",
    tooltipText: "Add a product or feature metric",
  },
  {
    nodeType: "initiative_positive",
    label: "Positive Initiative",
    icon: Lightbulb,
    gradientClass: "from-violet-500 to-purple-500",
    tooltipText: "Add an initiative with positive impact",
  },
  {
    nodeType: "initiative_negative",
    label: "Negative Initiative",
    icon: Lightbulb,
    gradientClass: "from-red-500 to-rose-500",
    tooltipText: "Add an initiative with negative impact",
  },
];

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  tree: ImpactTree;
  onTreeUpdate: (tree: ImpactTree) => void;
  mode: "select" | "add-node" | "connect";
  onModeChange: (mode: "select" | "add-node" | "connect") => void;
  selectedNodeType: NodeType | null;
  onNodeTypeSelect: (type: NodeType) => void;
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
}

/**
 * Props for the DraggableNodeButton component
 */
interface DraggableNodeButtonProps {
  nodeType: NodeType;
  label: string;
  icon: React.ElementType;
  gradientClass: string;
  tooltipText: string;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Draggable node type button with modern styling
 */
const DraggableNodeButton = memo(function DraggableNodeButton({
  nodeType,
  label,
  icon: Icon,
  gradientClass,
  tooltipText,
  isSelected,
  onClick,
}: DraggableNodeButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `node-type-${nodeType}`,
    data: {
      nodeType,
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={setNodeRef}
          variant={isSelected ? "default" : "ghost"}
          className={`w-full justify-start gap-3 h-10 px-2 transition-all duration-200 ${
            isDragging
              ? "opacity-50 cursor-grabbing"
              : "cursor-grab hover:bg-accent"
          } ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
          onClick={onClick}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-sm`}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-left text-sm">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click or drag to canvas
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

/**
 * Stat card component for statistics section
 */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
});

/**
 * Modern Sidebar component with collapsible sections
 */
export const Sidebar = memo(function Sidebar({
  tree,
  onTreeUpdate,
  mode,
  onModeChange,
  selectedNodeType,
  onNodeTypeSelect,
  nodes,
  relationships,
  measurements,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState({
    addNodes: true,
    treeInfo: true,
    tools: true,
    statistics: true,
  });

  const handleNodeTypeClick = useCallback(
    (type: NodeType) => {
      onNodeTypeSelect(type);
      onModeChange("add-node");
    },
    [onNodeTypeSelect, onModeChange]
  );

  const handleTreeNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTreeUpdate({
        ...tree,
        name: sanitizeInput(e.target.value),
      });
    },
    [tree, onTreeUpdate]
  );

  const handleTreeDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onTreeUpdate({
        ...tree,
        description: sanitizeDescription(e.target.value),
      });
    },
    [tree, onTreeUpdate]
  );

  const toggleSection = useCallback(
    (section: keyof typeof openSections) => {
      setOpenSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  const measuredNodesCount = useMemo(() => {
    const nodeSet = new Set<string>();
    measurements.forEach((measurement) => {
      nodeSet.add(measurement.node_id);
    });
    return nodeSet.size;
  }, [measurements]);

  // Filter node buttons based on search
  const filteredNodeConfigs = useMemo(() => {
    if (!searchQuery.trim()) return NODE_BUTTON_CONFIGS;
    const query = searchQuery.toLowerCase();
    return NODE_BUTTON_CONFIGS.filter(
      (config) =>
        config.label.toLowerCase().includes(query) ||
        config.tooltipText.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <aside className="w-72 border-r bg-card flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-secondary/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <TooltipProvider>
          <div className="p-3 space-y-1">
            {/* Add Nodes Section */}
            <Collapsible
              open={openSections.addNodes}
              onOpenChange={() => toggleSection("addNodes")}
            >
              <CollapsibleTrigger className="px-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Add Nodes
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 mt-1">
                  {filteredNodeConfigs.map((config) => (
                    <DraggableNodeButton
                      key={config.nodeType}
                      nodeType={config.nodeType}
                      label={config.label}
                      icon={config.icon}
                      gradientClass={config.gradientClass}
                      tooltipText={config.tooltipText}
                      isSelected={
                        mode === "add-node" &&
                        selectedNodeType === config.nodeType
                      }
                      onClick={() => handleNodeTypeClick(config.nodeType)}
                    />
                  ))}
                  {filteredNodeConfigs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No node types match your search
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Tree Info Section */}
            <Collapsible
              open={openSections.treeInfo}
              onOpenChange={() => toggleSection("treeInfo")}
            >
              <CollapsibleTrigger className="px-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Tree Info
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 px-2 mt-2">
                  <div>
                    <Label htmlFor="treeName" className="text-xs">
                      Name
                    </Label>
                    <Input
                      id="treeName"
                      value={tree.name}
                      onChange={handleTreeNameChange}
                      className="mt-1 h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="treeDescription" className="text-xs">
                      Description
                    </Label>
                    <Textarea
                      id="treeDescription"
                      value={tree.description}
                      onChange={handleTreeDescriptionChange}
                      rows={2}
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Tools Section */}
            <Collapsible
              open={openSections.tools}
              onOpenChange={() => toggleSection("tools")}
            >
              <CollapsibleTrigger className="px-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Tools
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-2 mt-2">
                  <Button
                    variant={mode === "connect" ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-10"
                    onClick={() => onModeChange("connect")}
                  >
                    <div
                      className={`p-2 rounded-lg ${mode === "connect" ? "bg-white/20" : "bg-secondary"}`}
                    >
                      <Link2 className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left">Connect Nodes</span>
                    {mode === "connect" && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground px-2">
                    Click two nodes to connect them
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Statistics Section */}
            <Collapsible
              open={openSections.statistics}
              onOpenChange={() => toggleSection("statistics")}
            >
              <CollapsibleTrigger className="px-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Statistics
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-2 px-2 mt-2">
                  <StatCard
                    icon={Layers}
                    label="Nodes"
                    value={nodes.size}
                    colorClass="bg-blue-500"
                  />
                  <StatCard
                    icon={GitBranch}
                    label="Relations"
                    value={relationships.size}
                    colorClass="bg-purple-500"
                  />
                  <StatCard
                    icon={Activity}
                    label="Measured"
                    value={measuredNodesCount}
                    colorClass="bg-emerald-500"
                  />
                  <StatCard
                    icon={BarChart3}
                    label="Metrics"
                    value={measurements.size}
                    colorClass="bg-amber-500"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TooltipProvider>
      </ScrollArea>
    </aside>
  );
});
