import { describe, it, expect } from "vitest";
import { MultiPassStrategy } from "../../src/core/strategies/MultiPassStrategy";
import { createGraph, addNode } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { NodeId } from "../../src/core/types";

describe("MultiPassStrategy", () => {
  it("throws error if maxIterations is less than 1", () => {
    expect(() => new MultiPassStrategy(0)).toThrow("maxIterations must be at least 1");
    expect(() => new MultiPassStrategy(-1)).toThrow("maxIterations must be at least 1");
  });

  it("determines execution order using modifiedTopologicalSort", () => {
    const strategy = new MultiPassStrategy(3);
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

  it("shouldContinue returns true for iterations less than maxIterations", () => {
    const strategy = new MultiPassStrategy(3);
    const results = new Map<NodeId, any>();

    expect(strategy.shouldContinue(1, results)).toBe(true);
    expect(strategy.shouldContinue(2, results)).toBe(true);
    expect(strategy.shouldContinue(3, results)).toBe(false);
    expect(strategy.shouldContinue(4, results)).toBe(false);
  });

  it("getBackEdgeValues returns empty map for iteration 1", () => {
    const strategy = new MultiPassStrategy(3);
    const backEdgeValues = strategy.getBackEdgeValues(1, undefined);
    expect(backEdgeValues.size).toBe(0);
  });

  it("getBackEdgeValues extracts values from previousResults for iteration 2+", () => {
    const strategy = new MultiPassStrategy(3);
    
    const previousResults = new Map<NodeId, any>();
    previousResults.set("A", { delta: 5 });
    previousResults.set("B", { delta: 10 });

    const backEdgeValues = strategy.getBackEdgeValues(2, previousResults);
    
    expect(backEdgeValues.get("A.delta")).toBe(5);
    expect(backEdgeValues.get("B.delta")).toBe(10);
    expect(backEdgeValues.size).toBe(2);
  });

  it("getBackEdgeValues handles multiple output ports", () => {
    const strategy = new MultiPassStrategy(3);
    
    const previousResults = new Map<NodeId, any>();
    previousResults.set("A", { delta: 5, value: 100 });

    const backEdgeValues = strategy.getBackEdgeValues(2, previousResults);
    
    expect(backEdgeValues.get("A.delta")).toBe(5);
    expect(backEdgeValues.get("A.value")).toBe(100);
    expect(backEdgeValues.size).toBe(2);
  });

  it("getBackEdgeValues ignores non-numeric values", () => {
    const strategy = new MultiPassStrategy(3);
    
    const previousResults = new Map<NodeId, any>();
    previousResults.set("A", { delta: 5, text: "hello", value: 100 });

    const backEdgeValues = strategy.getBackEdgeValues(2, previousResults);
    
    expect(backEdgeValues.get("A.delta")).toBe(5);
    expect(backEdgeValues.get("A.value")).toBe(100);
    expect(backEdgeValues.has("A.text")).toBe(false);
    expect(backEdgeValues.size).toBe(2);
  });

  it("getBackEdgeValues returns empty map when previousResults is undefined", () => {
    const strategy = new MultiPassStrategy(3);
    const backEdgeValues = strategy.getBackEdgeValues(2, undefined);
    expect(backEdgeValues.size).toBe(0);
  });
});

