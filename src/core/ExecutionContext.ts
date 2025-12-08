import type { NodeId } from "./types";

/**
 * Execution context provided to node calculate functions.
 * 
 * Provides access to:
 * - The current node's ID
 * - The current iteration number
 * - State management (get/set)
 * 
 * @public
 * @example
 * ```typescript
 * calculate(inputs, ctx: ExecutionContext<{ value: number }>) {
 *   const state = ctx.getState();
 *   const newState = { value: state.value + inputs.delta };
 *   ctx.setState(newState);
 *   return { delta: inputs.delta };
 * }
 * ```
 */
export interface ExecutionContext<State = any> {
  /** The ID of the node being executed */
  readonly nodeId: NodeId;
  /** The current iteration number (1-indexed) */
  readonly iteration: number;
  /**
   * Gets the current state of this node.
   * @returns The current state
   */
  getState(): State;
  /**
   * Sets the state of this node.
   * @param next - The new state value
   */
  setState(next: State): void;
}

/**
 * Basic concrete implementation of ExecutionContext backed by a shared state map.
 * Intended for internal engine use and tests in early phases.
 */
export class BasicExecutionContext<State = any> implements ExecutionContext<State> {
  public readonly nodeId: NodeId;
  public readonly iteration: number;

  private readonly stateMap: Map<NodeId, State>;

  constructor(nodeId: NodeId, iteration: number, stateMap: Map<NodeId, State>) {
    this.nodeId = nodeId;
    this.iteration = iteration;
    this.stateMap = stateMap;
  }

  getState(): State {
    return this.stateMap.get(this.nodeId) as State;
  }

  setState(next: State): void {
    this.stateMap.set(this.nodeId, next);
  }
}

