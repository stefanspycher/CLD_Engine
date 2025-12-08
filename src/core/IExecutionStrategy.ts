import type { Graph } from "./Graph";
import type { NodeId } from "./types";

/**
 * Strategy interface for determining execution order and iteration control.
 *
 * Strategies determine:
 * - The order in which nodes should be executed
 * - Whether execution should continue for additional iterations
 * - Values for back-edges (edges from later nodes to earlier nodes in execution order)
 */
export interface IExecutionStrategy {
  /**
   * Determines the execution order for nodes in the graph.
   * @param graph The graph to analyze
   * @returns Array of node IDs in execution order
   */
  determineExecutionOrder(graph: Graph): NodeId[];

  /**
   * Determines whether execution should continue for another iteration.
   * @param iteration The current iteration number (0-indexed or 1-indexed depending on strategy)
   * @param results Map of node IDs to their outputs from the current iteration
   * @returns true if execution should continue, false otherwise
   */
  shouldContinue(iteration: number, results: Map<NodeId, any>): boolean;

  /**
   * Returns values for back-edges in the current iteration.
   * Back-edges are edges from nodes that appear later in execution order to nodes that appear earlier.
   *
   * @param iteration The current iteration number
   * @param previousResults Optional map of node IDs to outputs from the previous iteration
   * @returns Map of back-edge values, keyed by `${nodeId}.${portId}`
   */
  getBackEdgeValues(
    iteration: number,
    previousResults?: Map<NodeId, any>,
  ): Map<string, number>;
}





