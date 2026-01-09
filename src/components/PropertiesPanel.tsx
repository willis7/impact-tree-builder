import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { Node, Relationship, Measurement } from "@/types";
import { Trash2, Edit, Plus } from "lucide-react";
import {
  sanitizeNodeName,
  sanitizeDescription,
  sanitizeMeasurementText,
  sanitizeNumericInput,
} from "@/lib/sanitize";

/**
 * Props for the PropertiesPanel component
 */
interface PropertiesPanelProps {
  /** Currently selected node to display/edit properties */
  selectedNode: Node | null | undefined;
  /** Currently selected relationship to display information */
  selectedRelationship: Relationship | null | undefined;
  /** Map of all measurements in the tree by ID */
  measurements: Map<string, Measurement>;
  /** Map of all nodes in the tree by ID (for relationship lookups) */
  nodes: Map<string, Node>;
  /** Callback to update node properties */
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  /** Callback to delete a node */
  onDeleteNode: (nodeId: string) => void;
  /** Callback to add a new measurement */
  onAddMeasurement: (measurement: Measurement) => void;
}

/**
 * Properties panel component for editing nodes and measurements
 *
 * Provides functionality for:
 * - Viewing and editing node properties (name, description, type)
 * - Managing measurements for nodes (add, view performance)
 * - Viewing relationship information
 * - Calculating and displaying measurement performance indicators
 *
 * Features edit mode with save/cancel for node properties.
 * All user inputs are sanitized to prevent XSS attacks.
 * Performance badges show green (≥80%) or red (<80%) based on actual vs expected values.
 *
 * @param props - Component props
 * @returns The properties panel UI element
 */
export function PropertiesPanel({
  selectedNode,
  selectedRelationship,
  measurements,
  nodes,
  onUpdateNode,
  onDeleteNode,
  onAddMeasurement,
}: PropertiesPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [editedNode, setEditedNode] = useState<Partial<Node>>({});
  const [newMeasurement, setNewMeasurement] = useState({
    metric_name: "",
    expected_value: 0,
    actual_value: 0,
    impact_type: "proximate" as "proximate" | "downstream",
    measurement_period: "monthly",
  });

  // Memoize filtered measurements to avoid recalculating on every render
  const nodeMeasurements = useMemo(() => {
    if (!selectedNode) return [];
    return Array.from(measurements.values()).filter(
      (m) => m.node_id === selectedNode.id
    );
  }, [selectedNode, measurements]);

  /**
   * Converts node type identifier to human-readable label
   * @param type - Node type identifier (business_metric, product_metric, initiative)
   * @returns Human-readable label
   */
  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "business_metric":
        return "Business Metric";
      case "product_metric":
        return "Product Metric";
      case "initiative":
        return "Initiative";
      default:
        return type;
    }
  };

  /**
   * Calculates measurement performance as ratio of actual to expected value
   * Used to determine badge color (green if ≥0.8, red otherwise)
   * @param measurement - The measurement to calculate performance for
   * @returns Performance ratio (0 if expected_value is 0, otherwise actual/expected)
   */
  const calculateMeasurementPerformance = useCallback((measurement: Measurement) => {
    if (measurement.expected_value === 0) return 0;
    return Math.abs(measurement.actual_value / measurement.expected_value);
  }, []);

  /**
   * Saves edited node properties and exits edit mode
   * Updates the node via onUpdateNode callback
   */
  const handleSaveNode = () => {
    if (selectedNode && editedNode) {
      onUpdateNode(selectedNode.id, editedNode);
      setEditMode(false);
      setEditedNode({});
    }
  };

  /**
   * Adds a new measurement for the selected node
   * Creates measurement with current date and sanitized inputs
   * Resets the form and closes the dialog after adding
   */
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
        <ScrollArea className="flex-1">
          {/* Properties Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Properties</h3>
              <Badge variant="secondary">
                {getNodeTypeLabel(selectedNode.node_type)}
              </Badge>
            </div>

            {!editMode && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-3"
                onClick={() => {
                  setEditMode(true);
                  setEditedNode({ ...selectedNode });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Properties
              </Button>
            )}

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="nodeName" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="nodeName"
                    value={editedNode.name || ""}
                    onChange={(e) =>
                      setEditedNode({
                        ...editedNode,
                        name: sanitizeNodeName(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nodeDescription" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="nodeDescription"
                    value={editedNode.description || ""}
                    onChange={(e) =>
                      setEditedNode({
                        ...editedNode,
                        description: sanitizeDescription(e.target.value),
                      })
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveNode} size="sm" className="flex-1">
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setEditedNode({});
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
                <Button
                  onClick={() => onDeleteNode(selectedNode.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="mt-1">{selectedNode.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Description
                  </Label>
                  <p className="mt-1 text-sm">
                    {selectedNode.description || "No description"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="mt-1">
                    {getNodeTypeLabel(selectedNode.node_type)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Measurements Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Measurements</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMeasurementDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>{" "}
            {nodeMeasurements.length > 0 ? (
              <div className="space-y-2">
                {nodeMeasurements.map((measurement) => {
                  const performance =
                    calculateMeasurementPerformance(measurement);
                  const isGood = performance >= 0.8;

                  return (
                    <Card key={measurement.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">
                            {measurement.metric_name}
                          </span>
                          <Badge
                            variant={isGood ? "default" : "destructive"}
                            className="ml-2"
                          >
                            {(performance * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
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
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {measurement.impact_type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No measurements yet
              </p>
            )}
          </div>

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
                          expected_value: sanitizeNumericInput(
                            e.target.value,
                            0
                          ),
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
                        measurement_period: value,
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
        </ScrollArea>
      </aside>
    );
  }

  if (selectedRelationship) {
    const sourceNode = nodes.get(selectedRelationship.source_node_id);
    const targetNode = nodes.get(selectedRelationship.target_node_id);

    return (
      <aside className="w-80 border-l bg-card flex flex-col h-full overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Relationship</h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <p className="mt-1">{sourceNode?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <p className="mt-1">{targetNode?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <p className="mt-1">
                {selectedRelationship.relationship_type.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l bg-card flex flex-col h-full overflow-y-auto">
      <div className="p-4 flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground text-center">
          Select a node or relationship to view properties
        </p>
      </div>
    </aside>
  );
}
