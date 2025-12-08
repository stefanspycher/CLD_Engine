import type { Graph } from "../Graph";
import type { NodeId } from "../types";
import type { NodeDefinition } from "../Node";
import type { IExecutionStrategy } from "../IExecutionStrategy";
import type { ExecutionContext } from "../ExecutionContext";
import { BasicExecutionContext } from "../ExecutionContext";

/**
 * Result of executing a graph through the CLD engine.
 */
export interface ExecutionResult {
  /** Final node state after last iteration */
  state: Map<NodeId, any>;
  /** Outputs returned by each node in the last iteration */
  outputs: Map<NodeId, any>;
  /** Number of iterations executed */
  iterations: number;
}

/**
 * Core CLD execution engine.
 *
 * Executes a graph of nodes according to a given execution strategy.
 * Handles state management, input gathering, and output propagation.
 */
export class CLDEngine {
  constructor(private strategy: IExecutionStrategy) {}

  /**
   * Execute the graph with optional initial state.
   *
   * @param graph The graph to execute
   * @param initialState Optional initial state map (nodeId -> state)
   * @returns Promise resolving to execution results
   */
  async execute(
    graph: Graph,
    initialState?: Map<NodeId, any>,
  ): Promise<ExecutionResult> {
    // Initialize state map for all nodes
    const stateMap = new Map<NodeId, any>();
    for (const [nodeId, node] of graph.nodes.entries()) {
      if (initialState?.has(nodeId)) {
        stateMap.set(nodeId, initialState.get(nodeId));
      } else {
        // Use node's default state or empty object
        stateMap.set(nodeId, node.state ?? {});
      }
    }

    // Track outputs per iteration
    const outputs = new Map<NodeId, any>();
    let iteration = 0;
    let previousResults: Map<NodeId, any> | undefined = undefined;

    // Main execution loop
    while (true) {
      iteration++;

      // Determine execution order for this iteration
      const executionOrder = this.strategy.determineExecutionOrder(graph);

      // Get back-edge values (empty for single-pass, but we call it for consistency)
      const backEdgeValues = this.strategy.getBackEdgeValues(iteration, previousResults);

      // Execute nodes in order
      const currentResults = new Map<NodeId, any>();
      for (const nodeId of executionOrder) {
        const node = graph.nodes.get(nodeId);
        if (!node) {
          throw new Error(`Node "${nodeId}" not found in graph`);
        }

        // Gather inputs for this node
        // Use currentResults for nodes executed earlier in this iteration
        // Use outputs for nodes from previous iterations (if any)
        const inputValues = this.gatherInputs(
          nodeId,
          node,
          graph,
          currentResults, // Use currentResults so we get outputs from nodes executed earlier in THIS iteration
          backEdgeValues,
          executionOrder,
        );

        // Create execution context
        const ctx = new BasicExecutionContext(nodeId, iteration, stateMap);

        // Execute node's calculate function
        const nodeOutputs = node.calculate(inputValues, ctx);

        // Store outputs (both for this iteration and for next iteration)
        currentResults.set(nodeId, nodeOutputs);
        outputs.set(nodeId, nodeOutputs);
      }

      // Update previous results for next iteration
      previousResults = currentResults;

      // Check if we should continue
      if (!this.strategy.shouldContinue(iteration, currentResults)) {
        break;
      }
    }

    return {
      state: stateMap,
      outputs,
      iterations: iteration,
    };
  }

  /**
   * Gather input values for a node from connected edges.
   *
   * Phase 5: Handles both forward edges and back-edges according to execution order:
   * - Forward edges (M appears before N): Use current iteration outputs from M
   * - Back-edges (M appears after N): Use values from backEdgeValues map (defaults to 0)
   *
   * @param nodeId The node to gather inputs for (node N)
   * @param node The node definition
   * @param graph The graph containing edges
   * @param currentOutputs Map of nodeId -> outputs from current iteration
   * @param backEdgeValues Map of back-edge values (${nodeId}.${portId} -> value)
   * @param executionOrder Current execution order
   * @returns Object mapping input port names to values
   */
  private gatherInputs(
    nodeId: NodeId,
    node: NodeDefinition<any, any, any>,
    graph: Graph,
    currentOutputs: Map<NodeId, any>,
    backEdgeValues: Map<string, number>,
    executionOrder: NodeId[],
  ): Record<string, any> {
    const inputValues: Record<string, any> = {};

    // Find all incoming edges for this node
    const incomingEdges = graph.edges.filter((edge) => edge.toNodeId === nodeId);

    // Get current node's position in execution order
    const currentNodeIndex = executionOrder.indexOf(nodeId);
    if (currentNodeIndex === -1) {
      throw new Error(`Node "${nodeId}" not found in execution order`);
    }

    // Process each incoming edge
    // Note: Multiple edges can connect to the same input port - we sum their values
    for (const edge of incomingEdges) {
      // Find the input port descriptor
      const inputPort = Object.values(node.inputs).find(
        (port) => port.id === edge.toPortId,
      );

      if (!inputPort) {
        // Port should exist (validated by validateGraph), but handle gracefully
        continue;
      }

      // Phase 5: Determine if this is a back-edge
      // Back-edge: source node M appears AFTER current node N in execution order
      const sourceNodeIndex = executionOrder.indexOf(edge.fromNodeId);
      if (sourceNodeIndex === -1) {
        throw new Error(`Source node "${edge.fromNodeId}" not found in execution order`);
      }

      const isBackEdge = sourceNodeIndex > currentNodeIndex;

      let edgeValue: number = 0;

      if (isBackEdge) {
        // Phase 5: Back-edge handling
        // Use value from backEdgeValues map (for SinglePassStrategy, this will be empty, so defaults to 0)
        const backEdgeKey = `${edge.fromNodeId}.${edge.fromPortId}`;
        edgeValue = backEdgeValues.get(backEdgeKey) ?? 0;
      } else {
        // Phase 5: Forward edge handling
        // Source node M appears before or at current node N in execution order
        // Use current iteration outputs from M
        const sourceOutputs = currentOutputs.get(edge.fromNodeId);
        if (sourceOutputs) {
          // Find the output port descriptor on the source node
          const sourceNode = graph.nodes.get(edge.fromNodeId);
          if (sourceNode) {
            const outputPort = Object.values(sourceNode.outputs).find(
              (port) => port.id === edge.fromPortId,
            );
            if (outputPort) {
              // Get the value from the output port
              const outputValue = sourceOutputs[outputPort.name];
              if (typeof outputValue === "number") {
                edgeValue = outputValue;
              }
            }
          }
        } else {
          // Source node hasn't executed yet or has no outputs - default to 0
          edgeValue = 0;
        }
      }

      // Sum values if multiple edges connect to the same input port
      if (inputValues[inputPort.name] === undefined) {
        inputValues[inputPort.name] = 0;
      }
      inputValues[inputPort.name] += edgeValue;
    }

    return inputValues;
  }
}

