import { describe, it, expect } from "vitest";
import { SinglePassStrategy } from "../../src/core/strategies/SinglePassStrategy";
import { createGraph, addNode } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { NodeId } from "../../src/core/types";

describe("SinglePassStrategy", () => {
  it("determines execution order using modifiedTopologicalSort", () => {
    const strategy = new SinglePassStrategy();
    let graph = createGraph();
    const nodeA = createVariableNode("A", 0);
    const nodeB = createVariableNode("B", 0);
    graph = addNode(graph, nodeA);
    graph = addNode(graph, nodeB);

    const order = strategy.determineExecutionOrder(graph);
    expect(order).toContain("A");
    expect(order).toContain("B");
    expect(order.length).toBe(2);
  });

  it("shouldContinue returns true only for iteration 0", () => {
    const strategy = new SinglePassStrategy();
    const results = new Map<NodeId, any>();

    expect(strategy.shouldContinue(0, results)).toBe(true);
    expect(strategy.shouldContinue(1, results)).toBe(false);
    expect(strategy.shouldContinue(2, results)).toBe(false);
  });

  it("getBackEdgeValues always returns empty map", () => {
    const strategy = new SinglePassStrategy();
    
    const backEdgeValues1 = strategy.getBackEdgeValues(1, undefined);
    expect(backEdgeValues1.size).toBe(0);

    const previousResults = new Map<NodeId, any>();
    previousResults.set("A", { delta: 5 });
    
    const backEdgeValues2 = strategy.getBackEdgeValues(2, previousResults);
    expect(backEdgeValues2.size).toBe(0);
  });
});
