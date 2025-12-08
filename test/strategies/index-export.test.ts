import { describe, it, expect } from "vitest";
import { SinglePassStrategy, type IExecutionStrategy } from "../../src/index";
import { createGraph, addNode } from "../../src/core/Graph";
import type { NodeDefinition } from "../../src/core/Node";
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

/**
 * Phase 2 acceptance test: Strategy compiles and can be instantiated from src/index.ts
 */
describe("Index exports (Phase 2 acceptance)", () => {
  it("can instantiate SinglePassStrategy from index.ts", () => {
    const strategy = new SinglePassStrategy();
    expect(strategy).toBeInstanceOf(SinglePassStrategy);
  });

  it("can use SinglePassStrategy from index.ts to determine execution order", () => {
    const strategy = new SinglePassStrategy();
    const graph = createGraph();

    const nodeA = makeNode("A");
    const nodeB = makeNode("B");
    const nodeC = makeNode("C");

    const graphWithNodes = addNode(addNode(addNode(graph, nodeA), nodeB), nodeC);

    const order = strategy.determineExecutionOrder(graphWithNodes);

    expect(order).toEqual(["A", "B", "C"]);
  });

  it("exports IExecutionStrategy type", () => {
    // Type check: SinglePassStrategy should implement IExecutionStrategy
    const strategy: IExecutionStrategy = new SinglePassStrategy();
    expect(strategy).toBeDefined();
  });
});





