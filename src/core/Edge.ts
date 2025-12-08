import type { NodeId, PortId } from "./types";

/**
 * Represents a directed edge connecting an output port to an input port.
 * 
 * Edges define data flow: values flow from `fromNodeId.fromPortId` to `toNodeId.toPortId`.
 * 
 * @public
 * @example
 * ```typescript
 * const edge: Edge = {
 *   id: "e1",
 *   fromNodeId: "A",
 *   fromPortId: "delta",
 *   toNodeId: "B",
 *   toPortId: "delta"
 * };
 * ```
 */
export interface Edge {
  /** Unique identifier for this edge */
  id: string;
  /** Source node ID */
  fromNodeId: NodeId;
  /** Source port ID (must be an output port) */
  fromPortId: PortId;
  /** Target node ID */
  toNodeId: NodeId;
  /** Target port ID (must be an input port) */
  toPortId: PortId;
}

