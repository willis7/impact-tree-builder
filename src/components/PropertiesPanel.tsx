import { useState, useMemo, useCallback, memo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Node,
  Relationship,
  Measurement,
  MeasurementPeriod,
} from "@/types";
import {
  Trash2,
  Plus,
  TrendingUp,
  BarChart3,
  Lightbulb,
  ArrowRight,
  FileText,
  Activity,
  GripVertical,
} from "lucide-react";
import {
  sanitizeNodeName,
  sanitizeDescription,
  sanitizeMeasurementText,
  sanitizeNumericInput,
} from "@/lib/sanitize";
import { getNodeTypeLabel } from "@/lib/node-utils";

/**
 * Props for the PropertiesPanel component
 */
interface PropertiesPanelProps {
  selectedNode: Node | null | undefined;
  selectedRelationship: Relationship | null | undefined;
  measurements: Map<string, Measurement>;
  nodes: Map<string, Node>;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement?: (measurementId: string) => void;
  onReorderMeasurements?: (measurements: Measurement[]) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
}

/**
 * Sortable measurement item component
 */
interface SortableMeasurementItemProps {
  measurement: Measurement;
  index: number;
  performance: number | null;
  onDelete?: (measurementId: string) => void;
}

function SortableMeasurementItem({ measurement, index, performance, onDelete }: SortableMeasurementItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: measurement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isGood = performance !== null && performance >= 0.8;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {index + 1}.
          </span>
          <span className="text-sm font-medium">
            {measurement.metric_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {performance !== null ? (
            <Badge
              variant={isGood ? "success" : "destructive"}
              className="text-xs"
            >
              {(performance * 100).toFixed(0)}%
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              N/A
            </Badge>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(measurement.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Delete measurement ${measurement.metric_name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs pl-6">
        <div>
          <span className="text-muted-foreground">
            Expected
          </span>
          <p className="font-medium">
            {measurement.expected_value}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">
            Actual
          </span>
          <p className="font-medium">
            {measurement.actual_value}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-2 pl-6">
        <Badge variant="outline" className="text-xs">
          {measurement.impact_type}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {measurement.measurement_period}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Icon component for node types
 */
function NodeTypeIcon({ nodeType }: { nodeType: string }) {
  const iconClass = "h-4 w-4";
  switch (nodeType) {
    case "business_metric":
      return <TrendingUp className={iconClass} />;
    case "product_metric":
      return <BarChart3 className={iconClass} />;
    default:
      return <Lightbulb className={iconClass} />;
  }
}

/**
 * Get gradient class for node type
 */
function getNodeGradient(nodeType: string): string {
  switch (nodeType) {
    case "business_metric":
      return "from-blue-500 to-cyan-500";
    case "product_metric":
      return "from-emerald-500 to-green-500";
    case "initiative_positive":
      return "from-violet-500 to-purple-500";
    case "initiative_negative":
      return "from-red-500 to-rose-500";
    default:
      return "from-gray-500 to-gray-600";
  }
}

/**
 * Modern Properties panel with tabs
 */
export const PropertiesPanel = memo(function PropertiesPanel({
  selectedNode,
  selectedRelationship,
  measurements,
  nodes,
  onUpdateNode,
  onDeleteNode,
  onAddMeasurement,
  onDeleteMeasurement,
  onReorderMeasurements,
  onDeleteRelationship,
}: PropertiesPanelProps) {
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    metric_name: "",
    expected_value: 0,
    actual_value: 0,
    impact_type: "proximate" as "proximate" | "downstream",
    measurement_period: "monthly" as MeasurementPeriod,
  });

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const nodeMeasurements = useMemo(() => {
    if (!selectedNode) return [];
    return Array.from(measurements.values())
      .filter((m) => m.node_id === selectedNode.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [selectedNode, measurements]);

  // Handle drag end for reordering measurements
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && onReorderMeasurements) {
        const oldIndex = nodeMeasurements.findIndex((m) => m.id === active.id);
        const newIndex = nodeMeasurements.findIndex((m) => m.id === over.id);

        const reordered = arrayMove(nodeMeasurements, oldIndex, newIndex);
        // Update order field for each measurement
        const updatedMeasurements = reordered.map((m, index) => ({
          ...m,
          order: index,
        }));
        onReorderMeasurements(updatedMeasurements);
      }
    },
    [nodeMeasurements, onReorderMeasurements]
  );

  const calculateMeasurementPerformance = useCallback(
    (measurement: Measurement) => {
      // Return null when expected_value is 0 to indicate no valid data
      // (0% performance vs. "no data" are semantically different)
      if (measurement.expected_value === 0) return null;
      return Math.abs(measurement.actual_value / measurement.expected_value);
    },
    []
  );

  const handleAddMeasurement = () => {
    if (!selectedNode) return;

    const measurement: Measurement = {
      id: "meas_" + Date.now(),
      node_id: selectedNode.id,
      ...newMeasurement,
      measurement_date: new Date().toISOString().split("T")[0],
    };

    onAddMeasurement(measurement);
    setMeasurementDialogOpen(false);
    setNewMeasurement({
      metric_name: "",
      expected_value: 0,
      actual_value: 0,
      impact_type: "proximate",
      measurement_period: "monthly",
    });
  };

  if (selectedNode) {
    return (
      <aside className="w-80 border-l bg-card flex flex-col h-full">
        {/* Header with node type indicator */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getNodeGradient(selectedNode.node_type)} flex items-center justify-center shadow-sm`}
            >
              <NodeTypeIcon nodeType={selectedNode.node_type} />
              <span className="sr-only">
                {getNodeTypeLabel(selectedNode.node_type)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{selectedNode.name}</h3>
              <p className="text-xs text-muted-foreground">
                {getNodeTypeLabel(selectedNode.node_type)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed content */}
        <Tabs defaultValue="node" className="flex-1 flex flex-col">
          <div className="px-4 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="node" className="flex-1">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Node
              </TabsTrigger>
              <TabsTrigger value="measurements" className="flex-1">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Metrics
                {nodeMeasurements.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                    {nodeMeasurements.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* Node Tab */}
            <TabsContent value="node" className="px-4 pb-4 mt-0">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nodeName" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Display Name
                  </Label>
                  <Input
                    id="nodeName"
                    value={selectedNode.name}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, {
                        name: sanitizeNodeName(e.target.value),
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="nodeDescription" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Description
                  </Label>
                  <Textarea
                    id="nodeDescription"
                    value={selectedNode.description || ""}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, {
                        description: sanitizeDescription(e.target.value),
                      })
                    }
                    placeholder="Add a description..."
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                {/* Delete */}
                <div className="pt-3 border-t">
                  <Button
                    onClick={() => onDeleteNode(selectedNode.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Node
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Measurements Tab */}
            <TabsContent value="measurements" className="px-4 pb-4 mt-0">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setMeasurementDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Measurement
                </Button>

                {nodeMeasurements.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={nodeMeasurements.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {nodeMeasurements.map((measurement, index) => (
                          <SortableMeasurementItem
                            key={measurement.id}
                            measurement={measurement}
                            index={index}
                            performance={calculateMeasurementPerformance(measurement)}
                            onDelete={onDeleteMeasurement}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No measurements yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add measurements to track performance
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Measurement Dialog */}
        <Dialog
          open={measurementDialogOpen}
          onOpenChange={setMeasurementDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Measurement</DialogTitle>
              <DialogDescription>
                Add a new measurement for {selectedNode.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="metricName">Metric Name</Label>
                <Input
                  id="metricName"
                  value={newMeasurement.metric_name}
                  onChange={(e) =>
                    setNewMeasurement({
                      ...newMeasurement,
                      metric_name: sanitizeMeasurementText(e.target.value),
                    })
                  }
                  placeholder="e.g., Sessions per Hour"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedValue">Expected Value</Label>
                  <Input
                    id="expectedValue"
                    type="number"
                    value={newMeasurement.expected_value}
                    onChange={(e) =>
                      setNewMeasurement({
                        ...newMeasurement,
                        expected_value: sanitizeNumericInput(e.target.value, 0),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="actualValue">Actual Value</Label>
                  <Input
                    id="actualValue"
                    type="number"
                    value={newMeasurement.actual_value}
                    onChange={(e) =>
                      setNewMeasurement({
                        ...newMeasurement,
                        actual_value: sanitizeNumericInput(e.target.value, 0),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="impactType">Impact Type</Label>
                <Select
                  value={newMeasurement.impact_type}
                  onValueChange={(value) =>
                    setNewMeasurement({
                      ...newMeasurement,
                      impact_type: value as "proximate" | "downstream",
                    })
                  }
                >
                  <SelectTrigger id="impactType" className="w-full">
                    <SelectValue placeholder="Select impact type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proximate">Proximate</SelectItem>
                    <SelectItem value="downstream">Downstream</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="measurementPeriod">Measurement Period</Label>
                <Select
                  value={newMeasurement.measurement_period}
                  onValueChange={(value) =>
                    setNewMeasurement({
                      ...newMeasurement,
                      measurement_period: value as MeasurementPeriod,
                    })
                  }
                >
                  <SelectTrigger id="measurementPeriod" className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMeasurementDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMeasurement}>Add Measurement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    );
  }

  if (selectedRelationship) {
    const sourceNode = nodes.get(selectedRelationship.source_node_id);
    const targetNode = nodes.get(selectedRelationship.target_node_id);

    return (
      <aside className="w-80 border-l bg-card flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Relationship</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Visual relationship display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sourceNode ? getNodeGradient(sourceNode.node_type) : "from-gray-400 to-gray-500"} flex items-center justify-center`}
            >
              {sourceNode && <NodeTypeIcon nodeType={sourceNode.node_type} />}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${targetNode ? getNodeGradient(targetNode.node_type) : "from-gray-400 to-gray-500"} flex items-center justify-center`}
            >
              {targetNode && <NodeTypeIcon nodeType={targetNode.node_type} />}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                From
              </Label>
              <p className="mt-1 text-sm font-medium">
                {sourceNode?.name || "Unknown"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                To
              </Label>
              <p className="mt-1 text-sm font-medium">
                {targetNode?.name || "Unknown"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Type
              </Label>
              <Badge variant="outline" className="mt-1.5">
                {selectedRelationship.relationship_type.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {/* Delete Relationship */}
          {onDeleteRelationship && (
            <div className="pt-3 border-t">
              <Button
                onClick={() => onDeleteRelationship(selectedRelationship.id)}
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Relationship
              </Button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l bg-card flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a node or relationship
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            to view and edit properties
          </p>
        </div>
      </div>
    </aside>
  );
});
