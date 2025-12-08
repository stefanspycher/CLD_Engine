/**
 * @fileoverview Public API exports for CLD-Engine
 * 
 * CLD-Engine is a headless execution engine for Causal Loop Diagrams (CLDs).
 * It supports delta-based propagation, cyclic graphs, and pluggable execution strategies.
 * 
 * @example
 * ```typescript
 * import { 
 *   CLDEngine, 
 *   SinglePassStrategy, 
 *   createGraph, 
 *   addNode, 
 *   addEdge 
 * } from "cld-engine";
 * 
 * // Create a graph
 * let graph = createGraph();
 * graph = addNode(graph, myNode);
 * graph = addEdge(graph, myEdge);
 * 
 * // Execute with single-pass strategy
 * const engine = new CLDEngine(new SinglePassStrategy());
 * const result = await engine.execute(graph);
 * ```
 */

/**
 * Unique identifier for a node in the graph.
 * @public
 */
export type { NodeId } from "./core/types";

/**
 * Unique identifier for a port (input or output) on a node.
 * @public
 */
export type { PortId } from "./core/types";

/**
 * Describes a port (input or output) on a node.
 * 
 * @public
 * @example
 * ```typescript
 * const inputPort: PortDescriptor = {
 *   id: "delta",
 *   name: "delta",
 *   kind: "input"
 * };
 * ```
 */
export type { PortDescriptor } from "./core/Port";

/**
 * Represents a directed edge connecting an output port to an input port.
 * 
 * @public
 * @example
 * ```typescript
 * const edge: Edge = {
 *   id: "e1",
 *   fromNodeId: "A",
 *   fromPortId: "delta",
 *   toNodeId: "B",
 *   toPortId: "delta"
 * };
 * ```
 */
export type { Edge } from "./core/Edge";

/**
 * Represents a graph containing nodes and edges.
 * Use helper functions `createGraph()`, `addNode()`, `addEdge()` to build graphs.
 * 
 * @public
 * @see createGraph
 * @see addNode
 * @see addEdge
 * @see validateGraph
 */
export type { Graph } from "./core/Graph";

/**
 * Creates an empty graph.
 * 
 * @public
 * @see Graph
 */
export { createGraph, addNode, addEdge, validateGraph } from "./core/Graph";

/**
 * Definition of a node in the graph.
 * 
 * Nodes have:
 * - An ID and type
 * - Internal state
 * - Input and output ports
 * - A calculate function that processes inputs and returns outputs
 * 
 * @public
 * @example
 * ```typescript
 * const node: NodeDefinition = {
 *   id: "A",
 *   type: "variable",
 *   state: { value: 0 },
 *   inputs: { delta: { id: "delta", name: "delta", kind: "input" } },
 *   outputs: { delta: { id: "delta", name: "delta", kind: "output" } },
 *   calculate(inputs, ctx) {
 *     const newValue = ctx.getState().value + inputs.delta;
 *     ctx.setState({ value: newValue });
 *     return { delta: inputs.delta };
 *   }
 * };
 * ```
 */
export type { NodeDefinition } from "./core/Node";

/**
 * Execution context provided to node calculate functions.
 * Provides access to node ID, iteration number, and state management.
 * 
 * @public
 */
export type { ExecutionContext } from "./core/ExecutionContext";

/**
 * Strategy interface for determining execution order and iteration control.
 * 
 * Implementations:
 * - {@link SinglePassStrategy} - Executes once
 * - {@link MultiPassStrategy} - Executes fixed number of iterations
 * - {@link ConvergenceStrategy} - Executes until convergence or max iterations
 * 
 * @public
 */
export type { IExecutionStrategy } from "./core/IExecutionStrategy";

/**
 * Single-pass execution strategy.
 * 
 * Executes the graph exactly once. Back-edges receive zero values.
 * 
 * @public
 * @example
 * ```typescript
 * const strategy = new SinglePassStrategy();
 * const engine = new CLDEngine(strategy);
 * ```
 */
export { SinglePassStrategy } from "./core/strategies/SinglePassStrategy";

/**
 * Multi-pass execution strategy with fixed iteration count.
 * 
 * Executes the graph up to `maxIterations` times. Back-edges receive
 * values from the previous iteration.
 * 
 * @public
 * @example
 * ```typescript
 * const strategy = new MultiPassStrategy(5); // 5 iterations
 * const engine = new CLDEngine(strategy);
 * ```
 */
export { MultiPassStrategy } from "./core/strategies/MultiPassStrategy";

/**
 * Convergence-based execution strategy.
 * 
 * Executes the graph until values converge (change by less than threshold)
 * or until `maxIterations` is reached.
 * 
 * @public
 * @example
 * ```typescript
 * const strategy = new ConvergenceStrategy(0.01, 100); // 0.01 threshold, max 100 iterations
 * const engine = new CLDEngine(strategy);
 * ```
 */
export { ConvergenceStrategy } from "./core/strategies/ConvergenceStrategy";

/**
 * Core CLD execution engine.
 * 
 * Executes a graph according to a given execution strategy.
 * Handles state management, input gathering, and output propagation.
 * 
 * @public
 * @example
 * ```typescript
 * const engine = new CLDEngine(new SinglePassStrategy());
 * const result = await engine.execute(graph);
 * console.log(result.outputs); // Map of node outputs
 * console.log(result.state);   // Map of final node states
 * console.log(result.iterations); // Number of iterations executed
 * ```
 */
export { CLDEngine } from "./core/engine/CLDEngine";

/**
 * Result of executing a graph through the CLD engine.
 * 
 * @public
 * @example
 * ```typescript
 * const result: ExecutionResult = await engine.execute(graph);
 * // result.state: Map<NodeId, any> - Final node states
 * // result.outputs: Map<NodeId, any> - Node outputs from last iteration
 * // result.iterations: number - Number of iterations executed
 * ```
 */
export type { ExecutionResult } from "./core/engine/CLDEngine";





