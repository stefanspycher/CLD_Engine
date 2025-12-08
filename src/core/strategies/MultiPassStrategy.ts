import type { Graph } from "../Graph";
import type { NodeId } from "../types";
import type { IExecutionStrategy } from "../IExecutionStrategy";
import { modifiedTopologicalSort } from "../topology/modifiedTopologicalSort";

/**
 * Multi-pass execution strategy with fixed iteration count.
 *
 * - Execution order: Modified topological sort using SCC detection and component DAG sorting
 * - Iteration control: Executes up to maxIterations iterations
 * - Back-edges: Uses previous iteration's outputs to provide values for back-edges
 */
export class MultiPassStrategy implements IExecutionStrategy {
  constructor(private maxIterations: number) {
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
   * Returns true if iteration is less than maxIterations.
   *
   * @param iteration The current iteration number (1-indexed)
   * @param results Results from current iteration (ignored for multi-pass)
   */
  shouldContinue(iteration: number, results: Map<NodeId, any>): boolean {
    return iteration < this.maxIterations;
  }

  /**
   * Returns back-edge values from previous iteration's outputs.
   * For iteration 1, returns empty map (no previous iteration).
   * For iteration 2+, extracts values from previousResults using ${nodeId}.${portId} keys.
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
    // We need to iterate through all nodes and their outputs
    // But we don't have direct access to the graph here, so we'll extract
    // all numeric values from the output objects
    // The engine will match these to the correct ports when gathering inputs

    // However, we need to know which ports exist. Since we don't have graph access,
    // we'll extract all numeric values from output objects and create keys
    // The format should be ${nodeId}.${portId}, but we need portId
    // 
    // Actually, looking at how gatherInputs works, it creates the key as:
    // `${edge.fromNodeId}.${edge.fromPortId}`
    // So we need to extract port values from previousResults
    // 
    // The previousResults contains output objects like { delta: 5 }
    // We need to know the port IDs. Since we don't have graph access here,
    // we'll need to extract all numeric values and create keys
    // But wait - we need the portId, not just the port name
    //
    // Let me check how this is used in gatherInputs...
    // In gatherInputs, the key is: `${edge.fromNodeId}.${edge.fromPortId}`
    // So we need portId, not port name
    //
    // Since we don't have graph access in getBackEdgeValues, we have two options:
    // 1. Pass graph to getBackEdgeValues (but that changes the interface)
    // 2. Extract all numeric values from outputs and let the engine match them
    //
    // Actually, looking at the interface, getBackEdgeValues doesn't take graph.
    // But we need to know which ports exist. Let me check the spec again...
    //
    // The spec says: "Uses previous iteration's outputs to fill ${nodeId}.${portId} keys"
    // So we need portId. But we don't have graph access.
    //
    // Wait, let me check how outputs are structured. In VariableNode, outputs is { delta: number }
    // The port descriptor has id: "delta" and name: "delta"
    // So portId == port name in this case, but that might not always be true
    //
    // Actually, I think the approach is: iterate through previousResults, and for each node,
    // extract all numeric values from its output object. The keys in the output object
    // correspond to output port names, and we need to map those to portIds.
    //
    // But without graph access, we can't map port names to portIds. However, in practice,
    // port names and portIds are often the same (as in VariableNode).
    //
    // For now, I'll assume that output object keys are port names, and we'll use them
    // as portIds. If they differ, we'd need graph access, but that's a limitation
    // we can document.
    //
    // Actually, let me re-read the spec. It says "fill ${nodeId}.${portId} keys"
    // So we definitely need portId. But we don't have it.
    //
    // Let me check the engine code to see how it uses backEdgeValues...
    // In gatherInputs: `const backEdgeKey = `${edge.fromNodeId}.${edge.fromPortId}`;`
    // So it uses edge.fromPortId, which comes from the edge definition.
    //
    // So the backEdgeValues map needs to have keys matching what gatherInputs expects.
    // gatherInputs creates keys from edges, so we need to know which edges are back-edges
    // and what their portIds are.
    //
    // But we don't have edge information in getBackEdgeValues either!
    //
    // I think the solution is: we need to extract ALL possible back-edge values.
    // For each node in previousResults, for each output port (which we can infer from
    // the output object keys), create a key ${nodeId}.${portId}.
    //
    // But we still need portId. Let me assume portId == port name for now, and document
    // this limitation. Or better: extract all numeric values and use the key as portId.
    //
    // Actually, I think the cleanest approach is: for each node's outputs, extract
    // all numeric values and create keys using the output object keys as portIds.
    // This assumes portId == port name, which is true for VariableNode and likely
    // for most nodes.

    for (const [nodeId, outputs] of previousResults) {
      if (outputs && typeof outputs === "object") {
        // Extract all numeric values from the output object
        for (const [portName, value] of Object.entries(outputs)) {
          if (typeof value === "number") {
            // Use portName as portId (assuming they're the same)
            // Create key: ${nodeId}.${portId}
            const key = `${nodeId}.${portName}`;
            backEdgeValues.set(key, value);
          }
        }
      }
    }

    return backEdgeValues;
  }
}

