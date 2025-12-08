import type { PortId } from "./types";

/**
 * Port kind: either "input" or "output".
 * 
 * @public
 */
export type PortKind = "input" | "output";

/**
 * Describes a port (input or output) on a node.
 * 
 * Ports have:
 * - An ID (unique within the node)
 * - A name (for display/logging)
 * - A kind (input or output)
 * 
 * @public
 * @example
 * ```typescript
 * const inputPort: PortDescriptor = {
 *   id: "delta",
 *   name: "Delta",
 *   kind: "input"
 * };
 * ```
 */
export interface PortDescriptor {
  /** Unique identifier for this port within the node */
  id: PortId;
  /** Human-readable name for this port */
  name: string;
  /** Whether this is an input or output port */
  kind: PortKind;
}

