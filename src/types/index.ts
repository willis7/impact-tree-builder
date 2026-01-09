export interface ImpactTree {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
  owner: string;
}

export interface Node {
  id: string;
  name: string;
  description: string;
  node_type: "business_metric" | "product_metric" | "initiative";
  level: number;
  position_x: number;
  position_y: number;
  color: string;
  shape: "rectangle" | "ellipse";
}

export interface Relationship {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: "desirable_effect" | "undesirable_effect" | "rollup";
  color: string;
  strength: number;
}

/** Valid measurement period values */
export type MeasurementPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface Measurement {
  id: string;
  node_id: string;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  measurement_date: string;
  measurement_period?: MeasurementPeriod;
  impact_type: "proximate" | "downstream";
  /** Display order within the node (lower numbers first) */
  order?: number;
}

/** Canvas viewport state */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface TreeData {
  tree: ImpactTree;
  nodes: Node[];
  relationships: Relationship[];
  measurements: Measurement[];
}
