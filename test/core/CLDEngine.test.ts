import { describe, it, expect } from "vitest";
import { CLDEngine } from "../../src/core/engine/CLDEngine";
import { SinglePassStrategy } from "../../src/core/strategies/SinglePassStrategy";
import { createGraph, addNode, addEdge } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { Edge } from "../../src/core/Edge";

describe("CLDEngine", () => {
  it("executes a simple acyclic chain A → B → C with VariableNodes", async () => {
    // Create nodes
    const nodeA = createVariableNode("A", 0);
    const nodeB = createVariableNode("B", 0);
    const nodeC = createVariableNode("C", 0);

    // Build graph
    let graph = createGraph();
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);

    // Create edges: A → B → C
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

    graph = addEdge(graph, edgeAB);
    graph = addEdge(graph, edgeBC);

    // Create engine with single-pass strategy
    const strategy = new SinglePassStrategy();
    const engine = new CLDEngine(strategy);

    // Set initial input: provide delta=5 to node A
    const initialState = new Map();
    // We need to manually set the input for node A
    // Since we don't have external input ports yet, we'll simulate by
    // setting node A's state to have received a delta
    // Actually, we need to provide the input delta to node A's calculate function
    // For now, let's modify node A to accept an initial delta input
    // But wait - the engine needs to handle external inputs differently
    // Let's create a test node that can accept external input

    // Actually, for Phase 3, we can test by manually calling calculate on A first
    // Or we can create a special input node. Let me think...
    // The simplest approach: create a node that outputs a constant delta
    // Or modify the test to inject the delta into A's state first

    // For Phase 3, let's test the propagation: if A outputs delta=5,
    // then B should receive it and add to its state, and C should receive B's delta

    // We'll need to manually inject the input. Let's create a simpler test:
    // Create a graph where A has initial state with value=0, and we'll
    // manually set A's output to simulate an external input

    // Actually, let me reconsider: the engine should handle external inputs
    // For now, let's test that if we set A's output manually in the initial state,
    // the propagation works. But that's not quite right either.

    // Better approach: Create a constant node that always outputs a delta
    // Or: Test with initial state where A has already processed a delta

    // Let me create a simpler test first: test that the engine executes nodes
    // and propagates outputs correctly when we have a source node that outputs a delta

    // For Phase 3, let's test the basic execution flow:
    // 1. Engine executes nodes in order
    // 2. Nodes receive inputs from previous nodes
    // 3. State is updated correctly

    // We need a way to inject external input. Let's create a constant node:
    function createConstantNode(id: string, outputValue: number) {
      return {
        id,
        type: "constant",
        state: {},
        inputs: {},
        outputs: {
          delta: {
            id: "delta",
            name: "delta",
            kind: "output",
          },
        },
        calculate() {
          return { delta: outputValue };
        },
      };
    }

    // Replace nodeA with a constant node that outputs 5
    const constantA = createConstantNode("A", 5);
    graph = createGraph();
    graph = addNode(graph, constantA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);
    graph = addEdge(graph, edgeAB);
    graph = addEdge(graph, edgeBC);

    // Execute
    const result = await engine.execute(graph);

    // Verify results
    expect(result.iterations).toBe(1);

    // Node A (constant) should output delta=5
    expect(result.outputs.get("A")).toEqual({ delta: 5 });

    // Node B should receive delta=5, add it to state (0 + 5 = 5), and output delta=5
    expect(result.outputs.get("B")).toEqual({ delta: 5 });
    expect(result.state.get("B")).toEqual({ value: 5 });

    // Node C should receive delta=5 from B, add it to state (0 + 5 = 5), and output delta=5
    expect(result.outputs.get("C")).toEqual({ delta: 5 });
    expect(result.state.get("C")).toEqual({ value: 5 });
  });

  it("handles multiple deltas in a chain correctly", async () => {
    // Create a chain where we can test accumulation
    // INPUT → A → B

    // Create a constant node that outputs delta=5 to A
    function createConstantNode(id: string, outputValue: number) {
      return {
        id,
        type: "constant",
        state: {},
        inputs: {},
        outputs: {
          delta: {
            id: "delta",
            name: "delta",
            kind: "output",
          },
        },
        calculate() {
          return { delta: outputValue };
        },
      };
    }

    const constantInput = createConstantNode("INPUT", 5);
    const nodeA = createVariableNode("A", 10); // A starts with value 10
    const nodeB = createVariableNode("B", 20); // B starts with value 20

    // Add nodes in execution order: INPUT first, then A, then B
    let graph = createGraph();
    graph = addNode(graph, constantInput);
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);

    const edgeInputA: Edge = {
      id: "e0",
      fromNodeId: "INPUT",
      fromPortId: "delta",
      toNodeId: "A",
      toPortId: "delta",
    };
    graph = addEdge(graph, edgeInputA);

    const edgeAB: Edge = {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    };
    graph = addEdge(graph, edgeAB);

    const strategy = new SinglePassStrategy();
    const engine = new CLDEngine(strategy);

    const result = await engine.execute(graph);

    // INPUT outputs delta=5
    expect(result.outputs.get("INPUT")).toEqual({ delta: 5 });

    // A receives delta=5, adds to state: 10 + 5 = 15, outputs delta=5
    expect(result.state.get("A")).toEqual({ value: 15 });
    expect(result.outputs.get("A")).toEqual({ delta: 5 });

    // B receives delta=5 from A, adds to state: 20 + 5 = 25, outputs delta=5
    expect(result.state.get("B")).toEqual({ value: 25 });
    expect(result.outputs.get("B")).toEqual({ delta: 5 });
  });
});

