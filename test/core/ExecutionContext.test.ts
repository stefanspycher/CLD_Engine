import { describe, it, expect } from "vitest";
import { BasicExecutionContext } from "../../src/core/ExecutionContext";
import type { NodeId } from "../../src/core/types";

describe("BasicExecutionContext", () => {
  it("exposes nodeId and iteration as read-only properties", () => {
    const stateMap = new Map<NodeId, { value: number }>();
    stateMap.set("node1", { value: 1 });

    const ctx = new BasicExecutionContext("node1", 3, stateMap);

    expect(ctx.nodeId).toBe("node1");
    expect(ctx.iteration).toBe(3);
  });

  it("reads and writes state via getState/setState", () => {
    const stateMap = new Map<NodeId, { value: number }>();
    stateMap.set("node1", { value: 1 });

    const ctx = new BasicExecutionContext("node1", 1, stateMap);

    const initial = ctx.getState();
    expect(initial).toEqual({ value: 1 });

    ctx.setState({ value: 42 });
    const updated = ctx.getState();

    expect(updated).toEqual({ value: 42 });
    expect(stateMap.get("node1")).toEqual({ value: 42 });
  });
});

