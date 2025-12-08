import { describe, it, expect } from "vitest";
import { ConvergenceStrategy } from "../../src/core/strategies/ConvergenceStrategy";
import { createGraph, addNode } from "../../src/core/Graph";
import { createVariableNode } from "../../src/nodes/VariableNode";
import type { NodeId } from "../../src/core/types";

describe("ConvergenceStrategy", () => {
  it("throws error if threshold is negative", () => {
    expect(() => new ConvergenceStrategy(-1)).toThrow("threshold must be non-negative");
  });

  it("throws error if maxIterations is less than 1", () => {
    expect(() => new ConvergenceStrategy(0.1, 0)).toThrow("maxIterations must be at least 1");
  });

  it("uses default maxIterations of 100", () => {
    const strategy = new ConvergenceStrategy(0.1);
    const results = new Map<NodeId, any>();
    // Should continue for iterations < 100
    expect(strategy.shouldContinue(99, results)).toBe(true);
    expect(strategy.shouldContinue(100, results)).toBe(false);
  });

  it("determines execution order using modifiedTopologicalSort", () => {
    const strategy = new ConvergenceStrategy(0.1);
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

  it("shouldContinue returns true for first iteration", () => {
    const strategy = new ConvergenceStrategy(0.1, 10);
    const results = new Map<NodeId, any>();
    results.set("A", { delta: 5 });

    expect(strategy.shouldContinue(1, results)).toBe(true);
  });

  it("shouldContinue returns false when maxIterations reached", () => {
    const strategy = new ConvergenceStrategy(0.1, 3);
    
    const iteration1 = new Map<NodeId, any>();
    iteration1.set("A", { delta: 5 });
    
    const iteration2 = new Map<NodeId, any>();
    iteration2.set("A", { delta: 6 }); // Different value so it doesn't converge

    expect(strategy.shouldContinue(1, iteration1)).toBe(true);
    expect(strategy.shouldContinue(2, iteration2)).toBe(true);
    
    const iteration3 = new Map<NodeId, any>();
    iteration3.set("A", { delta: 7 }); // Different value so it doesn't converge
    
    expect(strategy.shouldContinue(3, iteration3)).toBe(false); // Max iterations reached
  });

  it("shouldContinue returns false when values have converged", () => {
    const strategy = new ConvergenceStrategy(0.1, 10);
    
    const iteration1 = new Map<NodeId, any>();
    iteration1.set("A", { delta: 5.0 });
    
    const iteration2 = new Map<NodeId, any>();
    iteration2.set("A", { delta: 5.05 }); // Change of 0.05 < threshold 0.1

    expect(strategy.shouldContinue(1, iteration1)).toBe(true);
    expect(strategy.shouldContinue(2, iteration2)).toBe(false); // Converged
  });

  it("shouldContinue returns true when values have not converged", () => {
    const strategy = new ConvergenceStrategy(0.1, 10);
    
    const iteration1 = new Map<NodeId, any>();
    iteration1.set("A", { delta: 5.0 });
    
    const iteration2 = new Map<NodeId, any>();
    iteration2.set("A", { delta: 5.2 }); // Change of 0.2 >= threshold 0.1

    expect(strategy.shouldContinue(1, iteration1)).toBe(true);
    expect(strategy.shouldContinue(2, iteration2)).toBe(true); // Not converged
  });

  it("shouldContinue checks convergence for all nodes", () => {
    const strategy = new ConvergenceStrategy(0.1, 10);
    
    const iteration1 = new Map<NodeId, any>();
    iteration1.set("A", { delta: 5.0 });
    iteration1.set("B", { delta: 10.0 });
    
    const iteration2 = new Map<NodeId, any>();
    iteration2.set("A", { delta: 5.05 }); // Converged
    iteration2.set("B", { delta: 10.2 }); // Not converged

    expect(strategy.shouldContinue(1, iteration1)).toBe(true);
    expect(strategy.shouldContinue(2, iteration2)).toBe(true); // B not converged
  });

  it("getBackEdgeValues returns empty map for iteration 1", () => {
    const strategy = new ConvergenceStrategy(0.1);
    const backEdgeValues = strategy.getBackEdgeValues(1, undefined);
    expect(backEdgeValues.size).toBe(0);
  });

  it("getBackEdgeValues extracts values from previousResults for iteration 2+", () => {
    const strategy = new ConvergenceStrategy(0.1);
    
    const previousResults = new Map<NodeId, any>();
    previousResults.set("A", { delta: 5 });
    previousResults.set("B", { delta: 10 });

    const backEdgeValues = strategy.getBackEdgeValues(2, previousResults);
    
    expect(backEdgeValues.get("A.delta")).toBe(5);
    expect(backEdgeValues.get("B.delta")).toBe(10);
    expect(backEdgeValues.size).toBe(2);
  });
});

