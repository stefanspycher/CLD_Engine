import { describe, it, expect } from "vitest";
import { CLDEngine } from "../../src/core/engine/CLDEngine";
import { SinglePassStrategy } from "../../src/core/strategies/SinglePassStrategy";
import { MultiPassStrategy } from "../../src/core/strategies/MultiPassStrategy";
import { createGraph, addNode, addEdge, validateGraph } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { Edge } from "../../src/core/Edge";
import type { NodeDefinition } from "../../src/core/Node";
import type { PortDescriptor } from "../../src/core/Port";

/**
 * Helper to create a constant node that outputs a fixed delta value.
 */
function createConstantNode(
  id: string,
  outputValue: number,
): NodeDefinition<any, any, any> {
  const outputPort: PortDescriptor = {
    id: "delta",
    name: "delta",
    kind: "output",
  };

  return {
    id,
    type: "constant",
    state: {},
    inputs: {},
    outputs: {
      delta: outputPort,
    },
    calculate() {
      return { delta: outputValue };
    },
  };
}

/**
 * Technical Limit Tests for CLD-Engine
 * 
 * These tests determine the technical limits of the engine:
 * - Maximum number of nodes
 * - Maximum number of edges per node
 * - Combination limits
 * - Back-edge limits
 * - Graph depth limits
 * - Performance characteristics
 */
describe("CLD-Engine Technical Limits", () => {
  const strategy = new SinglePassStrategy();
  const engine = new CLDEngine(strategy);

  describe("Maximum Number of Nodes", () => {
    it("should handle 100 nodes", async () => {
      let graph = createGraph();
      const nodeCount = 100;

      // Create a source node
      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      // Create a chain of 100 variable nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        // Connect source to first node, then chain
        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `N${i - 1}`,
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      expect(graph.nodes.size).toBe(nodeCount + 1); // +1 for SOURCE

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });

    it("should handle 1000 nodes", async () => {
      let graph = createGraph();
      const nodeCount = 1000;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `N${i - 1}`,
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });

    it("should handle 10000 nodes", async () => {
      let graph = createGraph();
      const nodeCount = 10000;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `N${i - 1}`,
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });
  });

  describe("Maximum Number of Edges Per Node", () => {
    it("should handle a node with 100 incoming edges", async () => {
      let graph = createGraph();
      const edgeCount = 100;

      // Create target node
      const target = createVariableNode("TARGET", 0);
      graph = addNode(graph, target);

      // Create 100 source nodes, all connecting to TARGET
      for (let i = 0; i < edgeCount; i++) {
        const source = createConstantNode(`S${i}`, 1);
        graph = addNode(graph, source);
        graph = addEdge(graph, {
          id: `e-${i}`,
          fromNodeId: `S${i}`,
          fromPortId: "delta",
          toNodeId: "TARGET",
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const incomingEdges = graph.edges.filter((e) => e.toNodeId === "TARGET");
      expect(incomingEdges.length).toBe(edgeCount);

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      // TARGET should receive sum of all deltas (100 * 1 = 100)
      const targetState = result.state.get("TARGET") as { value: number };
      expect(targetState.value).toBe(edgeCount);
    });

    it("should handle a node with 1000 incoming edges", async () => {
      let graph = createGraph();
      const edgeCount = 1000;

      const target = createVariableNode("TARGET", 0);
      graph = addNode(graph, target);

      for (let i = 0; i < edgeCount; i++) {
        const source = createConstantNode(`S${i}`, 1);
        graph = addNode(graph, source);
        graph = addEdge(graph, {
          id: `e-${i}`,
          fromNodeId: `S${i}`,
          fromPortId: "delta",
          toNodeId: "TARGET",
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      const targetState = result.state.get("TARGET") as { value: number };
      expect(targetState.value).toBe(edgeCount);
    });

    it("should handle a node with 100 outgoing edges", async () => {
      let graph = createGraph();
      const edgeCount = 100;

      // Create source node
      const source = createConstantNode("SOURCE", 5);
      graph = addNode(graph, source);

      // Create 100 target nodes, all receiving from SOURCE
      for (let i = 0; i < edgeCount; i++) {
        const target = createVariableNode(`T${i}`, 0);
        graph = addNode(graph, target);
        graph = addEdge(graph, {
          id: `e-${i}`,
          fromNodeId: "SOURCE",
          fromPortId: "delta",
          toNodeId: `T${i}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const outgoingEdges = graph.edges.filter((e) => e.fromNodeId === "SOURCE");
      expect(outgoingEdges.length).toBe(edgeCount);

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      // All targets should receive delta=5
      for (let i = 0; i < edgeCount; i++) {
        const targetState = result.state.get(`T${i}`) as { value: number };
        expect(targetState.value).toBe(5);
      }
    });

    it("should handle a node with 1000 outgoing edges", async () => {
      let graph = createGraph();
      const edgeCount = 1000;

      const source = createConstantNode("SOURCE", 5);
      graph = addNode(graph, source);

      for (let i = 0; i < edgeCount; i++) {
        const target = createVariableNode(`T${i}`, 0);
        graph = addNode(graph, target);
        graph = addEdge(graph, {
          id: `e-${i}`,
          fromNodeId: "SOURCE",
          fromPortId: "delta",
          toNodeId: `T${i}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      // Verify first and last targets
      const firstState = result.state.get("T0") as { value: number };
      const lastState = result.state.get(`T${edgeCount - 1}`) as { value: number };
      expect(firstState.value).toBe(5);
      expect(lastState.value).toBe(5);
    });
  });

  describe("Combination: Max Nodes and Max Edges", () => {
    it("should handle 100 nodes with high edge density (star topology)", async () => {
      let graph = createGraph();
      const nodeCount = 100;

      // Create a central hub node
      const hub = createConstantNode("HUB", 1);
      graph = addNode(graph, hub);

      // Create 99 target nodes, all connected to hub
      for (let i = 0; i < nodeCount - 1; i++) {
        const target = createVariableNode(`T${i}`, 0);
        graph = addNode(graph, target);
        graph = addEdge(graph, {
          id: `e-hub-${i}`,
          fromNodeId: "HUB",
          fromPortId: "delta",
          toNodeId: `T${i}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      expect(graph.nodes.size).toBe(nodeCount);
      expect(graph.edges.length).toBe(nodeCount - 1);

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount);
    });

    it("should handle 1000 nodes with high edge density", async () => {
      let graph = createGraph();
      const nodeCount = 1000;

      const hub = createConstantNode("HUB", 1);
      graph = addNode(graph, hub);

      for (let i = 0; i < nodeCount - 1; i++) {
        const target = createVariableNode(`T${i}`, 0);
        graph = addNode(graph, target);
        graph = addEdge(graph, {
          id: `e-hub-${i}`,
          fromNodeId: "HUB",
          fromPortId: "delta",
          toNodeId: `T${i}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount);
    });

    it("should handle fully connected graph with 50 nodes", async () => {
      let graph = createGraph();
      const nodeCount = 50;

      // Create all nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);
      }

      // Create a source to inject initial value
      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);
      graph = addEdge(graph, {
        id: "e-source-0",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "N0",
        toPortId: "delta",
      });

      // Fully connect: every node connects to every other node
      let edgeId = 0;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
          if (i !== j) {
            graph = addEdge(graph, {
              id: `e-${edgeId++}`,
              fromNodeId: `N${i}`,
              fromPortId: "delta",
              toNodeId: `N${j}`,
              toPortId: "delta",
            });
          }
        }
      }

      validateGraph(graph);
      // Expected edges: nodeCount * (nodeCount - 1) + 1 (from SOURCE)
      const expectedEdges = nodeCount * (nodeCount - 1) + 1;
      expect(graph.edges.length).toBe(expectedEdges);

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1); // +1 for SOURCE
    });
  });

  describe("Back-Edge Limits", () => {
    it("should handle a single back-edge in a cycle", async () => {
      // Simple cycle: A → B → A
      const nodeA = createVariableNode("A", 0);
      const nodeB = createVariableNode("B", 0);
      const source = createConstantNode("SOURCE", 1);

      let graph = createGraph();
      graph = addNode(graph, source);
      graph = addNode(graph, nodeA);
      graph = addNode(graph, nodeB);

      graph = addEdge(graph, {
        id: "e-source-a",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-a-b",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-a",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // Verify back-edge is detected and handled
      const executionOrder = strategy.determineExecutionOrder(graph);
      const aIndex = executionOrder.indexOf("A");
      const bIndex = executionOrder.indexOf("B");

      // One of A→B or B→A will be a back-edge
      expect(executionOrder.length).toBe(3); // SOURCE, A, B (or B, A)
    });

    it("should handle multiple back-edges from one node", async () => {
      // Node A has back-edges to multiple nodes: A → B, A → C, B → A, C → A
      const nodeA = createVariableNode("A", 0);
      const nodeB = createVariableNode("B", 0);
      const nodeC = createVariableNode("C", 0);
      const source = createConstantNode("SOURCE", 1);

      let graph = createGraph();
      graph = addNode(graph, source);
      graph = addNode(graph, nodeA);
      graph = addNode(graph, nodeB);
      graph = addNode(graph, nodeC);

      graph = addEdge(graph, {
        id: "e-source-a",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-a-b",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-a-c",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "C",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-a",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-c-a",
        fromNodeId: "C",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // Verify multiple back-edges are handled
      const executionOrder = strategy.determineExecutionOrder(graph);
      expect(executionOrder.length).toBe(4); // SOURCE + A, B, C
    });

    it("should handle back-edges to multiple nodes (fan-in back-edges)", async () => {
      // Multiple nodes have back-edges to the same target: A → B, C → B, D → B
      // Where B executes before A, C, D
      const nodeA = createVariableNode("A", 0);
      const nodeB = createVariableNode("B", 0);
      const nodeC = createVariableNode("C", 0);
      const nodeD = createVariableNode("D", 0);
      const source = createConstantNode("SOURCE", 1);

      let graph = createGraph();
      graph = addNode(graph, source);
      graph = addNode(graph, nodeB); // Add B first to try to get it earlier in execution order
      graph = addNode(graph, nodeA);
      graph = addNode(graph, nodeC);
      graph = addNode(graph, nodeD);

      graph = addEdge(graph, {
        id: "e-source-b",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-a",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-c",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "C",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-d",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "D",
        toPortId: "delta",
      });
      // Back-edges: A, C, D → B
      graph = addEdge(graph, {
        id: "e-a-b",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-c-b",
        fromNodeId: "C",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-d-b",
        fromNodeId: "D",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // Verify back-edges are handled
      const executionOrder = strategy.determineExecutionOrder(graph);
      const bIndex = executionOrder.indexOf("B");
      const aIndex = executionOrder.indexOf("A");
      const cIndex = executionOrder.indexOf("C");
      const dIndex = executionOrder.indexOf("D");

      // If B executes before A, C, D, then A→B, C→B, D→B are back-edges
      if (bIndex < aIndex && bIndex < cIndex && bIndex < dIndex) {
        // All three are back-edges, should receive 0
        const bState = result.state.get("B") as { value: number };
        // B receives: SOURCE (1) + A (0) + C (0) + D (0) = 1
        expect(bState.value).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle 100 back-edges in a large cycle", async () => {
      // Create a cycle with 100 nodes: N0 → N1 → ... → N99 → N0
      let graph = createGraph();
      const nodeCount = 100;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);
      }

      // Connect SOURCE to N0
      graph = addEdge(graph, {
        id: "e-source-0",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "N0",
        toPortId: "delta",
      });

      // Create cycle: N0 → N1 → ... → N99 → N0
      for (let i = 0; i < nodeCount; i++) {
        const next = (i + 1) % nodeCount;
        graph = addEdge(graph, {
          id: `e-${i}-${next}`,
          fromNodeId: `N${i}`,
          fromPortId: "delta",
          toNodeId: `N${next}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // Verify all nodes executed
      expect(result.outputs.size).toBe(nodeCount + 1); // +1 for SOURCE
    });
  });

  describe("Graph Depth Limits", () => {
    it("should handle a very deep chain (1000 levels)", async () => {
      let graph = createGraph();
      const depth = 1000;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < depth; i++) {
        const node = createVariableNode(`L${i}`, 0);
        graph = addNode(graph, node);

        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `L${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `L${i - 1}`,
            fromPortId: "delta",
            toNodeId: `L${i}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // Verify last node in chain received the value
      const lastState = result.state.get(`L${depth - 1}`) as { value: number };
      expect(lastState.value).toBe(1);
    });
  });

  describe("Multiple Cycles", () => {
    it("should handle multiple independent cycles", async () => {
      // Create 10 independent cycles, each with 3 nodes
      let graph = createGraph();
      const cycleCount = 10;
      const nodesPerCycle = 3;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let cycle = 0; cycle < cycleCount; cycle++) {
        // Create nodes for this cycle
        for (let i = 0; i < nodesPerCycle; i++) {
          const node = createVariableNode(`C${cycle}N${i}`, 0);
          graph = addNode(graph, node);
        }

        // Connect SOURCE to first node of cycle
        graph = addEdge(graph, {
          id: `e-source-c${cycle}n0`,
          fromNodeId: "SOURCE",
          fromPortId: "delta",
          toNodeId: `C${cycle}N0`,
          toPortId: "delta",
        });

        // Create cycle: C0N0 → C0N1 → C0N2 → C0N0
        for (let i = 0; i < nodesPerCycle; i++) {
          const next = (i + 1) % nodesPerCycle;
          graph = addEdge(graph, {
            id: `e-c${cycle}n${i}-c${cycle}n${next}`,
            fromNodeId: `C${cycle}N${i}`,
            fromPortId: "delta",
            toNodeId: `C${cycle}N${next}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      expect(graph.nodes.size).toBe(1 + cycleCount * nodesPerCycle);
      expect(graph.edges.length).toBe(cycleCount + cycleCount * nodesPerCycle);

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(1 + cycleCount * nodesPerCycle);
    });

    it("should handle interconnected cycles", async () => {
      // Create cycles that share nodes: A→B→A and B→C→B (share node B)
      const nodeA = createVariableNode("A", 0);
      const nodeB = createVariableNode("B", 0);
      const nodeC = createVariableNode("C", 0);
      const source = createConstantNode("SOURCE", 1);

      let graph = createGraph();
      graph = addNode(graph, source);
      graph = addNode(graph, nodeA);
      graph = addNode(graph, nodeB);
      graph = addNode(graph, nodeC);

      graph = addEdge(graph, {
        id: "e-source-a",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });

      // Cycle 1: A → B → A
      graph = addEdge(graph, {
        id: "e-a-b",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-b-a",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });

      // Cycle 2: B → C → B
      graph = addEdge(graph, {
        id: "e-b-c",
        fromNodeId: "B",
        fromPortId: "delta",
        toNodeId: "C",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-c-b",
        fromNodeId: "C",
        fromPortId: "delta",
        toNodeId: "B",
        toPortId: "delta",
      });

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(4);
    });
  });

  describe("Total Edge Count Limits", () => {
    it("should handle 10000 total edges", async () => {
      let graph = createGraph();
      const nodeCount = 100;
      const edgesPerNode = 100; // Each node connects to 100 others
      const totalEdges = nodeCount * edgesPerNode;

      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);
      }

      // Create source
      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);
      graph = addEdge(graph, {
        id: "e-source-0",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "N0",
        toPortId: "delta",
      });

      // Create edges: each node connects to the next 100 nodes (wrapping around)
      let edgeId = 0;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = 1; j <= edgesPerNode; j++) {
          const target = (i + j) % nodeCount;
          graph = addEdge(graph, {
            id: `e-${edgeId++}`,
            fromNodeId: `N${i}`,
            fromPortId: "delta",
            toNodeId: `N${target}`,
            toPortId: "delta",
          });
        }
      }

      validateGraph(graph);
      expect(graph.edges.length).toBe(totalEdges + 1); // +1 for SOURCE edge

      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });
  });

  describe("Self-Loops", () => {
    it("should handle a node with a self-loop (back-edge to itself)", async () => {
      // Node A → A (self-loop)
      const nodeA = createVariableNode("A", 0);
      const source = createConstantNode("SOURCE", 1);

      let graph = createGraph();
      graph = addNode(graph, source);
      graph = addNode(graph, nodeA);

      graph = addEdge(graph, {
        id: "e-source-a",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });
      graph = addEdge(graph, {
        id: "e-a-a",
        fromNodeId: "A",
        fromPortId: "delta",
        toNodeId: "A",
        toPortId: "delta",
      });

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // A should receive SOURCE's delta (1) + its own delta (0, back-edge) = 1
      const aState = result.state.get("A") as { value: number };
      expect(aState.value).toBe(1);
    });

    it("should handle multiple nodes with self-loops", async () => {
      let graph = createGraph();
      const nodeCount = 50;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        // Connect SOURCE to each node
        graph = addEdge(graph, {
          id: `e-source-${i}`,
          fromNodeId: "SOURCE",
          fromPortId: "delta",
          toNodeId: `N${i}`,
          toPortId: "delta",
        });

        // Add self-loop
        graph = addEdge(graph, {
          id: `e-${i}-${i}`,
          fromNodeId: `N${i}`,
          fromPortId: "delta",
          toNodeId: `N${i}`,
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });
  });

  describe("Complex Topologies", () => {
    it("should handle a diamond pattern with many paths", async () => {
      // SOURCE → A, B, C, D → TARGET (diamond with 4 paths)
      let graph = createGraph();
      const pathCount = 20; // 20 parallel paths

      const source = createConstantNode("SOURCE", 1);
      const target = createVariableNode("TARGET", 0);
      graph = addNode(graph, source);
      graph = addNode(graph, target);

      // Create intermediate nodes for each path
      for (let i = 0; i < pathCount; i++) {
        const intermediate = createVariableNode(`I${i}`, 0);
        graph = addNode(graph, intermediate);

        // SOURCE → Intermediate
        graph = addEdge(graph, {
          id: `e-source-i${i}`,
          fromNodeId: "SOURCE",
          fromPortId: "delta",
          toNodeId: `I${i}`,
          toPortId: "delta",
        });

        // Intermediate → TARGET
        graph = addEdge(graph, {
          id: `e-i${i}-target`,
          fromNodeId: `I${i}`,
          fromPortId: "delta",
          toNodeId: "TARGET",
          toPortId: "delta",
        });
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);

      // TARGET should receive sum of all paths (20 * 1 = 20)
      const targetState = result.state.get("TARGET") as { value: number };
      expect(targetState.value).toBe(pathCount);
    });

    it("should handle a mesh topology (many-to-many connections)", async () => {
      // Create a mesh where every node connects to every other node
      let graph = createGraph();
      const nodeCount = 30; // Smaller number for mesh (n*(n-1) edges)

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);
      }

      // Connect SOURCE to first node
      graph = addEdge(graph, {
        id: "e-source-0",
        fromNodeId: "SOURCE",
        fromPortId: "delta",
        toNodeId: "N0",
        toPortId: "delta",
      });

      // Create mesh: every node connects to every other node
      let edgeId = 0;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
          if (i !== j) {
            graph = addEdge(graph, {
              id: `e-${edgeId++}`,
              fromNodeId: `N${i}`,
              fromPortId: "delta",
              toNodeId: `N${j}`,
              toPortId: "delta",
            });
          }
        }
      }

      validateGraph(graph);
      const result = await engine.execute(graph);
      expect(result.iterations).toBe(1);
      expect(result.outputs.size).toBe(nodeCount + 1);
    });
  });

  describe("Performance Characteristics", () => {
    it("should execute 1000 nodes in reasonable time", async () => {
      let graph = createGraph();
      const nodeCount = 1000;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `N${i - 1}`,
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        }
      }

      const startTime = Date.now();
      const result = await engine.execute(graph);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.iterations).toBe(1);
      // Should complete in under 5 seconds (adjust based on your performance requirements)
      expect(executionTime).toBeLessThan(5000);
    }, 10000); // 10 second timeout

    it("should handle MultiPassStrategy with large graph", async () => {
      let graph = createGraph();
      const nodeCount = 500;
      const iterations = 10;

      const source = createConstantNode("SOURCE", 1);
      graph = addNode(graph, source);

      for (let i = 0; i < nodeCount; i++) {
        const node = createVariableNode(`N${i}`, 0);
        graph = addNode(graph, node);

        if (i === 0) {
          graph = addEdge(graph, {
            id: `e-source-0`,
            fromNodeId: "SOURCE",
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        } else {
          graph = addEdge(graph, {
            id: `e-${i - 1}-${i}`,
            fromNodeId: `N${i - 1}`,
            fromPortId: "delta",
            toNodeId: `N${i}`,
            toPortId: "delta",
          });
        }
      }

      const multiPassStrategy = new MultiPassStrategy(iterations);
      const multiPassEngine = new CLDEngine(multiPassStrategy);

      const startTime = Date.now();
      const result = await multiPassEngine.execute(graph);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.iterations).toBe(iterations);
      expect(executionTime).toBeLessThan(10000); // Should complete in under 10 seconds
    }, 15000); // 15 second timeout
  });
});

