import { describe, it, expect } from "vitest";
import { createGraph, addNode, addEdge, validateGraph, type Graph } from "../../src/core/Graph";
import type { NodeDefinition } from "../../src/core/Node";
import type { Edge } from "../../src/core/Edge";
import type { PortDescriptor } from "../../src/core/Port";

function makePort(id: string, name: string, kind: PortDescriptor["kind"]): PortDescriptor {
  return { id, name, kind };
}

function makeNode(id: string): NodeDefinition<any, any, any> {
  return {
    id,
    type: "test",
    state: {},
    inputs: {
      in: makePort("in", "in", "input"),
    },
    outputs: {
      out: makePort("out", "out", "output"),
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculate(inputs, ctx) {
      return {};
    },
  };
}

function makeEdge(id: string, fromNodeId: string, toNodeId: string): Edge {
  return {
    id,
    fromNodeId,
    fromPortId: "out",
    toNodeId,
    toPortId: "in",
  };
}

describe("Graph core helpers", () => {
  it("createGraph returns an empty graph", () => {
    const graph = createGraph();

    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  it("addNode immutably adds nodes to the graph", () => {
    const graph = createGraph();
    const nodeA = makeNode("A");
    const nodeB = makeNode("B");

    const graphWithA = addNode(graph, nodeA);
    expect(graph.nodes.size).toBe(0);
    expect(graphWithA.nodes.size).toBe(1);
    expect(graphWithA.nodes.get("A")).toBe(nodeA);

    const graphWithAB = addNode(graphWithA, nodeB);
    expect(graphWithA.nodes.size).toBe(1);
    expect(graphWithAB.nodes.size).toBe(2);
    expect(graphWithAB.nodes.get("B")).toBe(nodeB);
  });

  it("addNode throws on duplicate node id", () => {
    const graph = createGraph();
    const nodeA1 = makeNode("A");
    const nodeA2 = makeNode("A");

    const graphWithA = addNode(graph, nodeA1);
    expect(() => addNode(graphWithA, nodeA2)).toThrow(/already exists/i);
  });

  it("addEdge appends edges immutably", () => {
    const graph = createGraph();
    const nodeA = makeNode("A");
    const nodeB = makeNode("B");

    const graphWithNodes = addNode(addNode(graph, nodeA), nodeB);
    const edge = makeEdge("e1", "A", "B");

    const graphWithEdge = addEdge(graphWithNodes, edge);

    expect(graphWithNodes.edges.length).toBe(0);
    expect(graphWithEdge.edges.length).toBe(1);
    expect(graphWithEdge.edges[0]).toBe(edge);
  });

  it("validateGraph succeeds for a minimal valid graph", () => {
    const graph = createGraph();
    const nodeA = makeNode("A");
    const nodeB = makeNode("B");

    const graphWithNodes: Graph = addNode(addNode(graph, nodeA), nodeB);
    const graphWithEdge = addEdge(graphWithNodes, makeEdge("e1", "A", "B"));

    expect(() => validateGraph(graphWithEdge)).not.toThrow();
  });

  it("validateGraph throws when edge references missing fromNode", () => {
    const graph = createGraph();
    const nodeB = makeNode("B");
    const graphWithB = addNode(graph, nodeB);

    const badEdge = makeEdge("e1", "A", "B");
    const graphWithBadEdge = addEdge(graphWithB, badEdge);

    expect(() => validateGraph(graphWithBadEdge)).toThrow(/fromNodeId/);
  });

  it("validateGraph throws when edge references missing toNode", () => {
    const graph = createGraph();
    const nodeA = makeNode("A");
    const graphWithA = addNode(graph, nodeA);

    const badEdge = makeEdge("e1", "A", "B");
    const graphWithBadEdge = addEdge(graphWithA, badEdge);

    expect(() => validateGraph(graphWithBadEdge)).toThrow(/toNodeId/);
  });

  it("validateGraph throws when edge references missing output port", () => {
    const graph = createGraph();
    const nodeA: NodeDefinition<any, any, any> = {
      ...makeNode("A"),
      outputs: {}, // remove expected output
    };
    const nodeB = makeNode("B");

    const graphWithNodes = addNode(addNode(graph, nodeA), nodeB);
    const edge = makeEdge("e1", "A", "B");
    const graphWithEdge = addEdge(graphWithNodes, edge);

    expect(() => validateGraph(graphWithEdge)).toThrow(/output port/);
  });

  it("validateGraph throws when edge references missing input port", () => {
    const graph = createGraph();
    const nodeA = makeNode("A");
    const nodeB: NodeDefinition<any, any, any> = {
      ...makeNode("B"),
      inputs: {}, // remove expected input
    };

    const graphWithNodes = addNode(addNode(graph, nodeA), nodeB);
    const edge = makeEdge("e1", "A", "B");
    const graphWithEdge = addEdge(graphWithNodes, edge);

    expect(() => validateGraph(graphWithEdge)).toThrow(/input port/);
  });

  it("validateGraph throws on duplicate input port ids within a node", () => {
    const graph = createGraph();

    const nodeA: NodeDefinition<any, any, any> = {
      id: "A",
      type: "test",
      state: {},
      inputs: {
        in1: makePort("dup", "in1", "input"),
        in2: makePort("dup", "in2", "input"),
      },
      outputs: {
        out: makePort("out", "out", "output"),
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      calculate(inputs, ctx) {
        return {};
      },
    };

    const graphWithA = addNode(graph, nodeA);

    expect(() => validateGraph(graphWithA)).toThrow(/Duplicate port id/);
  });

  it("validateGraph throws on wrong port kind", () => {
    const graph = createGraph();

    const nodeA: NodeDefinition<any, any, any> = {
      id: "A",
      type: "test",
      state: {},
      inputs: {
        in: makePort("in", "in", "output"), // wrong kind
      },
      outputs: {
        out: makePort("out", "out", "output"),
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      calculate(inputs, ctx) {
        return {};
      },
    };

    const graphWithA = addNode(graph, nodeA);

    expect(() => validateGraph(graphWithA)).toThrow(/expected "input"/);
  });
});

