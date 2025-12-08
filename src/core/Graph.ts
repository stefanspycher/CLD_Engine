import type { NodeId } from "./types";
import type { NodeDefinition } from "./Node";
import type { Edge } from "./Edge";
import type { PortDescriptor } from "./Port";

/**
 * Represents a graph containing nodes and edges.
 * 
 * Graphs are immutable - helper functions return new graph instances.
 * 
 * @public
 */
export interface Graph {
  /** Map of node IDs to node definitions */
  nodes: Map<NodeId, NodeDefinition>;
  /** Array of edges connecting nodes */
  edges: Edge[];
}

/**
 * Creates an empty graph.
 * 
 * @returns A new empty graph with no nodes or edges
 * @public
 * @example
 * ```typescript
 * let graph = createGraph();
 * graph = addNode(graph, myNode);
 * ```
 */
export function createGraph(): Graph {
  return {
    nodes: new Map<NodeId, NodeDefinition>(),
    edges: [],
  };
}

/**
 * Adds a node to the graph.
 * 
 * Returns a new graph with the node added. Does not mutate the original graph.
 * 
 * @param graph - The graph to add the node to
 * @param node - The node definition to add
 * @returns A new graph with the node added
 * @throws Error if a node with the same ID already exists
 * @public
 * @example
 * ```typescript
 * let graph = createGraph();
 * graph = addNode(graph, myNode);
 * ```
 */
export function addNode(graph: Graph, node: NodeDefinition): Graph {
  const nextNodes = new Map(graph.nodes);

  if (nextNodes.has(node.id)) {
    throw new Error(`Node with id "${node.id}" already exists in graph`);
  }

  nextNodes.set(node.id, node);

  return {
    nodes: nextNodes,
    edges: graph.edges.slice(),
  };
}

/**
 * Adds an edge to the graph.
 * 
 * Returns a new graph with the edge added. Does not mutate the original graph.
 * 
 * Note: This function does not validate that the edge references exist.
 * Call `validateGraph()` after building your graph to check for errors.
 * 
 * @param graph - The graph to add the edge to
 * @param edge - The edge to add
 * @returns A new graph with the edge added
 * @public
 * @example
 * ```typescript
 * let graph = createGraph();
 * graph = addNode(graph, nodeA);
 * graph = addNode(graph, nodeB);
 * graph = addEdge(graph, { 
 *   id: "e1", 
 *   fromNodeId: "A", 
 *   fromPortId: "out", 
 *   toNodeId: "B", 
 *   toPortId: "in" 
 * });
 * validateGraph(graph); // Validate after building
 * ```
 */
export function addEdge(graph: Graph, edge: Edge): Graph {
  // Defer deep validation to validateGraph to keep this helper lightweight.
  return {
    nodes: graph.nodes,
    edges: [...graph.edges, edge],
  };
}

/**
 * Validates graph invariants and throws if any are violated.
 * 
 * Checks:
 * - Node IDs are unique (guaranteed by Map structure)
 * - Port IDs are unique within each node
 * - Port kinds match their role (inputs must be "input", outputs must be "output")
 * - All edges reference existing nodes and ports
 *
 * @param graph - The graph to validate
 * @throws Error if any invariant is violated, with a descriptive message
 * @public
 * @example
 * ```typescript
 * let graph = createGraph();
 * graph = addNode(graph, nodeA);
 * graph = addEdge(graph, edge);
 * validateGraph(graph); // Throws if graph is invalid
 * ```
 */
export function validateGraph(graph: Graph): void {
  // Validate nodes and ports
  for (const [nodeId, node] of graph.nodes.entries()) {
    const inputPortIds = new Set<string>();
    const outputPortIds = new Set<string>();

    validatePorts(nodeId, "input", node.inputs, inputPortIds);
    validatePorts(nodeId, "output", node.outputs, outputPortIds);
  }

  // Validate edges
  for (const edge of graph.edges) {
    const fromNode = graph.nodes.get(edge.fromNodeId);
    if (!fromNode) {
      throw new Error(`Edge "${edge.id}" references missing fromNodeId "${edge.fromNodeId}"`);
    }

    const toNode = graph.nodes.get(edge.toNodeId);
    if (!toNode) {
      throw new Error(`Edge "${edge.id}" references missing toNodeId "${edge.toNodeId}"`);
    }

    const fromPortExists = Object.values(fromNode.outputs).some((p) => p.id === edge.fromPortId);
    if (!fromPortExists) {
      throw new Error(
        `Edge "${edge.id}" references missing output port "${edge.fromPortId}" on node "${edge.fromNodeId}"`,
      );
    }

    const toPortExists = Object.values(toNode.inputs).some((p) => p.id === edge.toPortId);
    if (!toPortExists) {
      throw new Error(
        `Edge "${edge.id}" references missing input port "${edge.toPortId}" on node "${edge.toNodeId}"`,
      );
    }
  }
}

function validatePorts(
  nodeId: NodeId,
  expectedKind: PortDescriptor["kind"],
  ports: Record<string, PortDescriptor>,
  seenIds: Set<string>,
): void {
  for (const [key, port] of Object.entries(ports)) {
    if (port.kind !== expectedKind) {
      throw new Error(
        `Port "${key}" on node "${nodeId}" has kind "${port.kind}", expected "${expectedKind}"`,
      );
    }

    if (seenIds.has(port.id)) {
      throw new Error(`Duplicate port id "${port.id}" in ${expectedKind} ports of node "${nodeId}"`);
    }

    seenIds.add(port.id);
  }
}

