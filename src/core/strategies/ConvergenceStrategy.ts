import type { Graph } from "../Graph";
import type { NodeId } from "../types";
import type { IExecutionStrategy } from "../IExecutionStrategy";
import { modifiedTopologicalSort } from "../topology/modifiedTopologicalSort";

/**
 * Convergence-based execution strategy.
 *
 * - Execution order: Modified topological sort using SCC detection and component DAG sorting
 * - Iteration control: Executes until convergence or maxIterations is reached
 * - Convergence: Values change by less than threshold between iterations
 * - Back-edges: Uses previous iteration's outputs to provide values for back-edges
 *
 * Note: Convergence checking requires comparing current results with previous results.
 * The engine passes previousResults to getBackEdgeValues, but not to shouldContinue.
 * For convergence checking, we store the previous results internally.
 */
export class ConvergenceStrategy implements IExecutionStrategy {
  private previousResults: Map<NodeId, any> | undefined = undefined;

  constructor(
    private threshold: number,
    private maxIterations: number = 100,
  ) {
    if (threshold < 0) {
      throw new Error("threshold must be non-negative");
    }
    if (maxIterations < 1) {
      throw new Error("maxIterations must be at least 1");
    }
  }

  /**
   * Returns nodes in execution order using modified topological sort.
   * Uses Tarjan's algorithm for SCC detection and topological sorts the component DAG.
   */
  determineExecutionOrder(graph: Graph): NodeId[] {
    return modifiedTopologicalSort(graph);
  }

  /**
   * Returns true if iteration is less than maxIterations AND values have not converged.
   * Convergence is determined by checking if all numeric outputs changed by less than threshold.
   *
   * Note: This method stores results internally for convergence checking.
   * The engine calls getBackEdgeValues with previousResults, but we also need
   * to track results here for convergence comparison.
   *
   * @param iteration The current iteration number (1-indexed)
   * @param results Map of node IDs to outputs from the current iteration
   */
  shouldContinue(iteration: number, results: Map<NodeId, any>): boolean {
    // Check iteration limit
    if (iteration >= this.maxIterations) {
      return false;
    }

    // Check convergence (compare with previous iteration)
    if (this.previousResults === undefined) {
      // First iteration, always continue
      this.previousResults = new Map(results);
      return true;
    }

    // Check if all numeric values have converged
    const hasConverged = this.checkConvergence(this.previousResults, results);
    
    // Update previous results for next iteration
    this.previousResults = new Map(results);

    // Continue if not converged
    return !hasConverged;
  }

  /**
   * Checks if outputs have converged by comparing numeric values between iterations.
   * Convergence means all numeric output values changed by less than threshold.
   *
   * @param previous Map of previous iteration outputs
   * @param current Map of current iteration outputs
   * @returns true if converged, false otherwise
   */
  private checkConvergence(
    previous: Map<NodeId, any>,
    current: Map<NodeId, any>,
  ): boolean {
    // Check all nodes in current results
    for (const [nodeId, currentOutputs] of current) {
      const previousOutputs = previous.get(nodeId);

      if (!previousOutputs) {
        // New node, not converged
        return false;
      }

      // Compare numeric values in output objects
      if (typeof currentOutputs === "object" && typeof previousOutputs === "object") {
        for (const [portId, currentValue] of Object.entries(currentOutputs)) {
          if (typeof currentValue === "number") {
            const previousValue = previousOutputs[portId];
            if (typeof previousValue === "number") {
              const change = Math.abs(currentValue - previousValue);
              if (change >= this.threshold) {
                // Value changed by more than threshold, not converged
                return false;
              }
            } else {
              // Type mismatch or missing value, not converged
              return false;
            }
          }
        }
      } else {
        // Output structure changed, not converged
        return false;
      }
    }

    // Check if any nodes disappeared (shouldn't happen, but be safe)
    if (previous.size !== current.size) {
      return false;
    }

    // All values converged
    return true;
  }

  /**
   * Returns back-edge values from previous iteration's outputs.
   * For iteration 1, returns empty map (no previous iteration).
   * For iteration 2+, extracts values from previousResults using ${nodeId}.${portId} keys.
   *
   * Note: This assumes that output object keys correspond to portIds.
   *
   * @param iteration The current iteration number (1-indexed)
   * @param previousResults Map of node IDs to outputs from the previous iteration
   * @returns Map of back-edge values, keyed by `${nodeId}.${portId}`
   */
  getBackEdgeValues(
    iteration: number,
    previousResults?: Map<NodeId, any>,
  ): Map<string, number> {
    const backEdgeValues = new Map<string, number>();

    // For iteration 1, there's no previous iteration, so return empty map
    if (iteration === 1 || !previousResults) {
      return backEdgeValues;
    }

    // For iteration 2+, extract values from previousResults
    // Extract all numeric values from output objects and create keys: ${nodeId}.${portId}
    for (const [nodeId, outputs] of previousResults) {
      if (outputs && typeof outputs === "object") {
        // Extract all numeric values from the output object
        for (const [portId, value] of Object.entries(outputs)) {
          if (typeof value === "number") {
            // Create key: ${nodeId}.${portId}
            const key = `${nodeId}.${portId}`;
            backEdgeValues.set(key, value);
          }
        }
      }
    }

    return backEdgeValues;
  }
}

