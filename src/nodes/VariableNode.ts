import type { NodeDefinition } from "../core/Node";
import type { ExecutionContext } from "../core/ExecutionContext";
import type { PortDescriptor } from "../core/Port";

/**
 * State for a VariableNode.
 */
export interface VariableNodeState {
  value: number;
}

/**
 * Inputs for a VariableNode.
 */
export interface VariableNodeInputs {
  delta: number;
}

/**
 * Outputs for a VariableNode.
 */
export interface VariableNodeOutputs {
  delta: number;
}

/**
 * Reference implementation of a CLD variable node.
 *
 * - State: `{ value: number }` - maintains current value
 * - Inputs: `{ delta: number }` - receives delta changes
 * - Outputs: `{ delta: number }` - emits delta changes
 *
 * The calculate function adds the input delta to the current state value
 * and emits the same delta as output (pass-through behavior).
 */
export function createVariableNode(
  id: string,
  initialValue: number = 0,
): NodeDefinition<VariableNodeState, VariableNodeInputs, VariableNodeOutputs> {
  const deltaPort: PortDescriptor = {
    id: "delta",
    name: "delta",
    kind: "input",
  };

  const outputPort: PortDescriptor = {
    id: "delta",
    name: "delta",
    kind: "output",
  };

  return {
    id,
    type: "variable",
    state: { value: initialValue },
    inputs: {
      delta: deltaPort,
    },
    outputs: {
      delta: outputPort,
    },
    calculate(
      inputValues: VariableNodeInputs,
      ctx: ExecutionContext<VariableNodeState>,
    ): VariableNodeOutputs {
      const currentState = ctx.getState();
      const delta = inputValues.delta ?? 0;

      // Update state: add delta to current value
      const newValue = currentState.value + delta;
      ctx.setState({ value: newValue });

      // Emit the same delta as output
      return { delta };
    },
  };
}

