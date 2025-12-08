import { describe, it, expect } from "vitest";
import { CLDEngine } from "../../src/core/engine/CLDEngine";
import { MultiPassStrategy } from "../../src/core/strategies/MultiPassStrategy";
import { createGraph, addNode, addEdge } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { Edge } from "../../src/core/Edge";

/**
 * Helper to create a constant node that outputs a fixed delta value.
 */
function createConstantNode(
  id: string,
  outputValue: number,
): ReturnType<typeof createVariableNode> {
  const deltaPort = {
    id: "delta",
    name: "delta",
    kind: "output" as const,
  };

  return {
    id,
    type: "constant",
    state: {},
    inputs: {},
    outputs: {
      delta: deltaPort,
    },
    calculate() {
      return { delta: outputValue };
    },
  };
}

describe("Phase 6: MultiPassStrategy Integration", () => {
  it("runs multiple iterations up to maxIterations", async () => {
    const nodeA = createConstantNode("A", 1);
    const nodeB = createVariableNode("B", 0);

    let graph = createGraph();
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);

    const edgeAB: Edge = {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    };
    graph = addEdge(graph, edgeAB);

    const strategy = new MultiPassStrategy(3);
    const engine = new CLDEngine(strategy);

    const result = await engine.execute(graph);

    // Should run exactly 3 iterations
    expect(result.iterations).toBe(3);
    
    // B should accumulate delta=1 each iteration: 0 + 1 + 1 + 1 = 3
    expect(result.state.get("B")).toEqual({ value: 3 });
  });

  it("back-edges see previous iteration values in cycle", async () => {
    // Phase 6 Acceptance: Back-edges see previous iteration values
    // Cycle A→B→C→A with MultiPassStrategy(3)
    // Iteration 1: A sees 0 from C (back-edge, no previous)
    // Iteration 2: A sees C's output from iteration 1 (back-edge has value!)
    // Iteration 3: A sees C's output from iteration 2

    const nodeA = createVariableNode("A", 0);
    const nodeB = createVariableNode("B", 0);
    const nodeC = createVariableNode("C", 0);

    // Create input node to inject pulse
    const inputNode = createConstantNode("INPUT", 1);

    let graph = createGraph();
    graph = addNode(graph, inputNode);
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);

    const edgeInputA: Edge = {
      id: "e0",
      fromNodeId: "INPUT",
      fromPortId: "delta",
      toNodeId: "A",
      toPortId: "delta",
    };

    const edgeAB: Edge = {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    };

    const edgeBC: Edge = {
      id: "e2",
      fromNodeId: "B",
      fromPortId: "delta",
      toNodeId: "C",
      toPortId: "delta",
    };

    const edgeCA: Edge = {
      id: "e3",
      fromNodeId: "C",
      fromPortId: "delta",
      toNodeId: "A",
      toPortId: "delta",
    };

    graph = addEdge(graph, edgeInputA);
    graph = addEdge(graph, edgeAB);
    graph = addEdge(graph, edgeBC);
    graph = addEdge(graph, edgeCA);

    const strategy = new MultiPassStrategy(3);
    const engine = new CLDEngine(strategy);

    const result = await engine.execute(graph);

    // Should run 3 iterations
    expect(result.iterations).toBe(3);

    // With back-edges receiving previous iteration values:
    // Iteration 1: A gets INPUT(1) + C(0) = 1, B gets A(1), C gets B(1)
    // Iteration 2: A gets INPUT(1) + C(1) = 2, B gets A(2), C gets B(2)
    // Iteration 3: A gets INPUT(1) + C(2) = 3, B gets A(3), C gets B(3)
    
    // A's final state should be > 1 (accumulated from multiple iterations with feedback)
    const aState = result.state.get("A") as { value: number } | undefined;
    expect(aState).toBeDefined();
    expect(aState!.value).toBeGreaterThan(1); // Should have feedback from C

    // B and C should also have accumulated values
    const bState = result.state.get("B") as { value: number } | undefined;
    const cState = result.state.get("C") as { value: number } | undefined;
    expect(bState).toBeDefined();
    expect(cState).toBeDefined();
    expect(bState!.value).toBeGreaterThan(0);
    expect(cState!.value).toBeGreaterThan(0);
  });

  it("iteration counts match expectations", async () => {
    const nodeA = createConstantNode("A", 1);
    let graph = createGraph();
    graph = addNode(graph, nodeA);

    // Test with different maxIterations
    for (const maxIter of [1, 2, 5, 10]) {
      const strategy = new MultiPassStrategy(maxIter);
      const engine = new CLDEngine(strategy);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(maxIter);
    }
  });
});

