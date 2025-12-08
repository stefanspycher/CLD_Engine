import type { Graph } from "../Graph";
import type { NodeId } from "../types";
import type { IExecutionStrategy } from "../IExecutionStrategy";
import { modifiedTopologicalSort } from "../topology/modifiedTopologicalSort";

/**
 * Single-pass execution strategy.
 *
 * - Execution order: Modified topological sort using SCC detection and component DAG sorting
 * - Iteration control: Executes exactly one iteration (iteration 0)
 * - Back-edges: Always returns empty map (no back-edge values in single-pass)
 */
export class SinglePassStrategy implements IExecutionStrategy {
  /**
   * Returns nodes in execution order using modified topological sort.
   * Uses Tarjan's algorithm for SCC detection and topological sorts the component DAG.
   */
  determineExecutionOrder(graph: Graph): NodeId[] {
    return modifiedTopologicalSort(graph);
  }

  /**
   * Returns false after the first iteration (single-pass semantics).
   * For iteration 0, returns true (allow execution).
   * For iteration >= 1, returns false (stop after first pass).
   *
   * @param iteration The current iteration number
   * @param results Results from current iteration (ignored for single-pass)
   */
  shouldContinue(iteration: number, results: Map<NodeId, any>): boolean {
    return iteration < 1;
  }

  /**
   * Returns an empty map (no back-edge values in single-pass strategy).
   * All back-edges are effectively zeroed in the first iteration.
   *
   * @param iteration The current iteration number
   * @param previousResults Previous iteration results (ignored for single-pass)
   * @returns Empty map
   */
  getBackEdgeValues(
    iteration: number,
    previousResults?: Map<NodeId, any>,
  ): Map<string, number> {
    return new Map();
  }
}
