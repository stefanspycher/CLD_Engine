import { describe, it, expect } from "vitest";
import {
  CLDEngine,
  SinglePassStrategy,
  type Graph,
  type NodeDefinition,
  type Edge,
  type ExecutionResult,
  type ExecutionContext,
  createGraph,
  addNode,
  addEdge,
  validateGraph,
} from "../../src/index";

/**
 * Phase 7 Acceptance Test
 * 
 * Verifies that an external consumer (e.g., Baklava adapter) can:
 * - Import Graph, build a graph
 * - Instantiate CLDEngine with SinglePassStrategy
 * - Run execute and inspect results
 * 
 * This test simulates external library usage without accessing internal implementation details.
 */
describe("Phase 7: Public API Surface Hardening - Acceptance Test", () => {
  /**
   * Creates a simple variable node for testing.
   * This simulates what an external consumer would create.
   */
  function createVariableNode(
    id: string,
    initialValue: number,
  ): NodeDefinition<{ value: number }, { delta: number }, { delta: number }> {
    return {
      id,
      type: "variable",
      state: { value: initialValue },
      inputs: {
        delta: {
          id: "delta",
          name: "delta",
          kind: "input",
        },
      },
      outputs: {
        delta: {
          id: "delta",
          name: "delta",
          kind: "output",
        },
      },
      calculate(inputs, ctx: ExecutionContext<{ value: number }>) {
        const currentState = ctx.getState();
        // Handle missing inputs (no incoming edges) - default to 0
        const delta = inputs.delta ?? 0;
        const newValue = currentState.value + delta;
        ctx.setState({ value: newValue });
        return { delta };
      },
    };
  }

  /**
   * Creates a constant node that always outputs a fixed value.
   * This simulates an external input source.
   */
  function createConstantNode(
    id: string,
    outputValue: number,
  ): NodeDefinition<{}, {}, { delta: number }> {
    return {
      id,
      type: "constant",
      state: {},
      inputs: {},
      outputs: {
        delta: {
          id: "delta",
          name: "delta", // Must match the key in calculate return value
          kind: "output",
        },
      },
      calculate() {
        return { delta: outputValue };
      },
    };
  }

  it("can import Graph type and build a graph", () => {
    // Test that we can import Graph type
    let graph: Graph = createGraph();
    expect(graph).toBeDefined();
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  it("can build a graph with nodes and edges", () => {
    // Create nodes
    const nodeA = createConstantNode("A", 5);
    const nodeB = createVariableNode("B", 0);
    const nodeC = createVariableNode("C", 0);

    // Build graph using public API
    let graph = createGraph();
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);

    // Verify nodes were added
    expect(graph.nodes.size).toBe(3);
    expect(graph.nodes.has("A")).toBe(true);
    expect(graph.nodes.has("B")).toBe(true);
    expect(graph.nodes.has("C")).toBe(true);

    // Add edges
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

    // Verify edges were added
    expect(graph.edges.length).toBe(2);
    expect(graph.edges[0].id).toBe("e1");
    expect(graph.edges[1].id).toBe("e2");

    // Validate graph
    expect(() => validateGraph(graph)).not.toThrow();
  });

  it("can instantiate CLDEngine with SinglePassStrategy", () => {
    const strategy = new SinglePassStrategy();
    const engine = new CLDEngine(strategy);

    expect(engine).toBeDefined();
    expect(engine).toBeInstanceOf(CLDEngine);
  });

  it("can execute a graph and inspect results", async () => {
    // Build a simple graph: A (constant=5) → B → C
    const nodeA = createConstantNode("A", 5);
    const nodeB = createVariableNode("B", 0);
    const nodeC = createVariableNode("C", 0);

    let graph = createGraph();
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);

    graph = addEdge(graph, {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    });

    graph = addEdge(graph, {
      id: "e2",
      fromNodeId: "B",
      fromPortId: "delta",
      toNodeId: "C",
      toPortId: "delta",
    });

    validateGraph(graph);

    // Execute with SinglePassStrategy
    const strategy = new SinglePassStrategy();
    const engine = new CLDEngine(strategy);
    const result: ExecutionResult = await engine.execute(graph);

    // Inspect results
    expect(result).toBeDefined();
    expect(result.iterations).toBe(1); // Single-pass should execute once
    expect(result.outputs).toBeInstanceOf(Map);
    expect(result.state).toBeInstanceOf(Map);

    // Verify outputs
    expect(result.outputs.get("A")).toEqual({ delta: 5 });
    expect(result.outputs.get("B")).toEqual({ delta: 5 });
    expect(result.outputs.get("C")).toEqual({ delta: 5 });

    // Verify state (B and C should have accumulated the delta)
    expect(result.state.get("B")).toEqual({ value: 5 });
    expect(result.state.get("C")).toEqual({ value: 5 });
  });

  it("can execute a cyclic graph with back-edges", async () => {
    // Build a cycle: A → B → C → A
    const nodeA = createVariableNode("A", 0);
    const nodeB = createVariableNode("B", 0);
    const nodeC = createVariableNode("C", 0);

    // Create a constant source to inject initial value
    const source = createConstantNode("SOURCE", 10);

    let graph = createGraph();
    graph = addNode(graph, source);
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addNode(graph, nodeC);

    // SOURCE → A → B → C → A (cycle)
    graph = addEdge(graph, {
      id: "e1",
      fromNodeId: "SOURCE",
      fromPortId: "delta",
      toNodeId: "A",
      toPortId: "delta",
    });

    graph = addEdge(graph, {
      id: "e2",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    });

    graph = addEdge(graph, {
      id: "e3",
      fromNodeId: "B",
      fromPortId: "delta",
      toNodeId: "C",
      toPortId: "delta",
    });

    graph = addEdge(graph, {
      id: "e4",
      fromNodeId: "C",
      fromPortId: "delta",
      toNodeId: "A",
      toPortId: "delta",
    });

    validateGraph(graph);

    // Execute with SinglePassStrategy (back-edge should receive 0)
    const strategy = new SinglePassStrategy();
    const engine = new CLDEngine(strategy);
    const result = await engine.execute(graph);

    // Verify execution completed
    expect(result.iterations).toBe(1);

    // SOURCE should execute first (no inputs) and output 10
    expect(result.outputs.get("SOURCE")).toEqual({ delta: 10 });

    // Check execution order to understand forward vs back-edges
    const executionOrder = strategy.determineExecutionOrder(graph);
    const sourceIndex = executionOrder.indexOf("SOURCE");
    const aIndex = executionOrder.indexOf("A");
    const bIndex = executionOrder.indexOf("B");
    const cIndex = executionOrder.indexOf("C");

    // SOURCE should execute before cycle nodes
    expect(sourceIndex).toBeLessThan(aIndex);

    // A receives input from SOURCE (forward edge, SOURCE executes before A)
    // A also receives input from C (back-edge if C executes after A, forward if C executes before A)
    const aState = result.state.get("A") as { value: number } | undefined;
    expect(aState).toBeDefined();
    expect(aState!.value).toBeGreaterThanOrEqual(10); // At least 10 from SOURCE

    // Verify forward edges propagate correctly within cycle
    if (aIndex < bIndex) {
      // A executes before B - forward edge
      expect(result.outputs.get("B")).toEqual({ delta: aState!.value });
      expect(result.state.get("B")).toEqual({ value: aState!.value });
    }

    if (bIndex < cIndex) {
      // B executes before C - forward edge
      const bState = result.state.get("B") as { value: number } | undefined;
      if (bState && bState.value > 0) {
        expect(result.outputs.get("C")).toEqual({ delta: bState.value });
        expect(result.state.get("C")).toEqual({ value: bState.value });
      }
    }

    // Verify back-edge from C to A gets 0 (if C executes after A)
    if (cIndex > aIndex) {
      // C executes after A - C→A is a back-edge, should receive 0
      // So A's total input = SOURCE's delta (10) + C's delta (0) = 10
      expect(aState!.value).toBe(10);
    }
  });

  it("can use different strategies", async () => {
    const nodeA = createConstantNode("A", 5);
    const nodeB = createVariableNode("B", 0);

    let graph = createGraph();
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);
    graph = addEdge(graph, {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "B",
      toPortId: "delta",
    });

    // Test SinglePassStrategy
    const singlePass = new SinglePassStrategy();
    const engine1 = new CLDEngine(singlePass);
    const result1 = await engine1.execute(graph);
    expect(result1.iterations).toBe(1);

    // Test MultiPassStrategy
    const { MultiPassStrategy } = await import("../../src/index");
    const multiPass = new MultiPassStrategy(3);
    const engine2 = new CLDEngine(multiPass);
    const result2 = await engine2.execute(graph);
    expect(result2.iterations).toBe(3);

    // Test ConvergenceStrategy
    const { ConvergenceStrategy } = await import("../../src/index");
    const convergence = new ConvergenceStrategy(0.01, 10);
    const engine3 = new CLDEngine(convergence);
    const result3 = await engine3.execute(graph);
    expect(result3.iterations).toBeGreaterThanOrEqual(1);
    expect(result3.iterations).toBeLessThanOrEqual(10);
  });

  it("validates graph structure correctly", () => {
    let graph = createGraph();
    const nodeA = createVariableNode("A", 0);
    graph = addNode(graph, nodeA);

    // Valid graph should not throw
    expect(() => validateGraph(graph)).not.toThrow();

    // Invalid edge (missing node) should throw
    graph = addEdge(graph, {
      id: "e1",
      fromNodeId: "A",
      fromPortId: "delta",
      toNodeId: "MISSING",
      toPortId: "delta",
    });

    expect(() => validateGraph(graph)).toThrow();
  });
});

