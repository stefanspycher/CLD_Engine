import type { NodeId } from "./types";
import type { PortDescriptor } from "./Port";
import type { ExecutionContext } from "./ExecutionContext";

/**
 * Definition of a node in the graph.
 * 
 * Nodes are the fundamental computation units in CLD-Engine. Each node:
 * - Has a unique ID and type identifier
 * - Maintains internal state
 * - Defines input and output ports
 * - Implements a calculate function that processes inputs and returns outputs
 * 
 * The calculate function receives:
 * - `inputValues`: An object mapping input port names to their values
 * - `ctx`: An execution context providing access to node state and iteration info
 * 
 * @public
 * @example
 * ```typescript
 * const node: NodeDefinition<{ value: number }, { delta: number }, { delta: number }> = {
 *   id: "A",
 *   type: "variable",
 *   state: { value: 0 },
 *   inputs: {
 *     delta: { id: "delta", name: "Delta", kind: "input" }
 *   },
 *   outputs: {
 *     delta: { id: "delta", name: "Delta", kind: "output" }
 *   },
 *   calculate(inputs, ctx) {
 *     const currentState = ctx.getState();
 *     const newValue = currentState.value + inputs.delta;
 *     ctx.setState({ value: newValue });
 *     return { delta: inputs.delta };
 *   }
 * };
 * ```
 */
export interface NodeDefinition<State = any, Inputs = any, Outputs = any> {
  /** Unique identifier for this node */
  id: NodeId;
  /** Type identifier (e.g., "variable", "constant") */
  type: string;
  /** Initial state for this node */
  state: State;
  /** Map of input port names to port descriptors */
  inputs: Record<string, PortDescriptor>;
  /** Map of output port names to port descriptors */
  outputs: Record<string, PortDescriptor>;
  /**
   * Calculate function that processes inputs and returns outputs.
   * 
   * @param inputValues - Object mapping input port names to their values
   * @param ctx - Execution context for state management and iteration info
   * @returns Object mapping output port names to their values
   */
  calculate(inputValues: Inputs, ctx: ExecutionContext<State>): Outputs;
}

