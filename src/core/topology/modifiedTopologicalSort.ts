import type { Graph } from "../Graph";
import type { NodeId } from "../types";

/**
 * Find all successors of a node (nodes this node connects to via edges)
 */
function getSuccessors(graph: Graph, nodeId: NodeId): NodeId[] {
  const successors: NodeId[] = [];
  for (const edge of graph.edges) {
    if (edge.fromNodeId === nodeId) {
      successors.push(edge.toNodeId);
    }
  }
  return successors;
}

/**
 * Find strongly connected components using Tarjan's algorithm
 */
function findSCCs(graph: Graph): NodeId[][] {
  let index = 0;
  const stack: NodeId[] = [];
  const nodeData = new Map<
    NodeId,
    {
      id: NodeId;
      index: number;
      lowLink: number;
      onStack: boolean;
    }
  >();
  const sccs: NodeId[][] = [];

  // Initialize all nodes
  for (const nodeId of graph.nodes.keys()) {
    nodeData.set(nodeId, {
      id: nodeId,
      index: -1,
      lowLink: -1,
      onStack: false,
    });
  }

  function strongConnect(nodeId: NodeId): void {
    const node = nodeData.get(nodeId)!;
    node.index = index;
    node.lowLink = index;
    index++;
    stack.push(nodeId);
    node.onStack = true;

    // Get successors (nodes this node connects to)
    const successors = getSuccessors(graph, nodeId);
    for (const successorId of successors) {
      const successor = nodeData.get(successorId);
      if (!successor) {
        // Skip if successor doesn't exist in graph (shouldn't happen in valid graph)
        continue;
      }

      if (successor.index === -1) {
        // Not yet visited
        strongConnect(successorId);
        node.lowLink = Math.min(node.lowLink, successor.lowLink);
      } else if (successor.onStack) {
        // In current SCC
        node.lowLink = Math.min(node.lowLink, successor.index);
      }
    }

    // Root of SCC
    if (node.lowLink === node.index) {
      const scc: NodeId[] = [];
      let w: NodeId | undefined;
      do {
        w = stack.pop();
        if (w) {
          nodeData.get(w)!.onStack = false;
          scc.push(w);
        }
      } while (w !== nodeId);
      sccs.push(scc);
    }
  }

  // Run Tarjan for all unvisited nodes
  for (const nodeId of graph.nodes.keys()) {
    const node = nodeData.get(nodeId)!;
    if (node.index === -1) {
      strongConnect(nodeId);
    }
  }

  return sccs;
}

/**
 * Build component graph (DAG) where nodes are SCCs
 * Returns a map from component ID to set of successor component IDs
 */
function buildComponentGraph(
  sccs: NodeId[][],
  graph: Graph,
): Map<number, Set<number>> {
  const componentGraph = new Map<number, Set<number>>();
  const nodeToComponent = new Map<NodeId, number>();

  // Map nodes to component IDs
  sccs.forEach((scc, componentId) => {
    componentGraph.set(componentId, new Set());
    scc.forEach((nodeId) => {
      nodeToComponent.set(nodeId, componentId);
    });
  });

  // Add edges between components
  for (const edge of graph.edges) {
    const fromComponent = nodeToComponent.get(edge.fromNodeId);
    const toComponent = nodeToComponent.get(edge.toNodeId);

    // Skip if either component is undefined (shouldn't happen in valid graph)
    if (fromComponent === undefined || toComponent === undefined) {
      continue;
    }

    // Only add edge if components are different
    if (fromComponent !== toComponent) {
      const successors = componentGraph.get(fromComponent);
      if (successors) {
        successors.add(toComponent);
      }
    }
  }

  return componentGraph;
}

/**
 * Topologically sort components (guaranteed to be a DAG)
 * Returns array of component IDs in topological order
 */
function topologicalSortComponents(
  componentGraph: Map<number, Set<number>>,
): number[] {
  const inDegree = new Map<number, number>();

  // Initialize in-degrees
  for (const componentId of componentGraph.keys()) {
    inDegree.set(componentId, 0);
  }

  // Calculate in-degrees
  for (const [, successors] of componentGraph) {
    for (const successor of successors) {
      inDegree.set(successor, (inDegree.get(successor) || 0) + 1);
    }
  }

  // Start with zero in-degree components
  const queue: number[] = [];
  for (const [componentId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(componentId);
    }
  }

  const result: number[] = [];
  while (queue.length > 0) {
    const component = queue.shift()!;
    result.push(component);

    const successors = componentGraph.get(component) || new Set();
    for (const successor of successors) {
      const newDegree = (inDegree.get(successor) || 0) - 1;
      inDegree.set(successor, newDegree);
      if (newDegree === 0) {
        queue.push(successor);
      }
    }
  }

  return result;
}

/**
 * Modified topological sort using SCC detection and component DAG sorting.
 *
 * Algorithm:
 * 1. Find strongly connected components (SCCs) using Tarjan's algorithm
 * 2. Build component graph (DAG) where nodes are SCCs
 * 3. Topologically sort components
 * 4. Flatten to node order (nodes within each SCC maintain stable order)
 *
 * @param graph The graph to analyze
 * @returns Array of node IDs in execution order
 */
export function modifiedTopologicalSort(graph: Graph): NodeId[] {
  // Step 1: Find SCCs
  const sccs = findSCCs(graph);

  // Step 2: Build component graph
  const componentGraph = buildComponentGraph(sccs, graph);

  // Step 3: Topologically sort components
  const componentOrder = topologicalSortComponents(componentGraph);

  // Step 4: Flatten to node order
  const nodeOrder: NodeId[] = [];
  for (const componentId of componentOrder) {
    const scc = sccs[componentId];
    if (scc) {
      // Nodes within SCC maintain stable order (as returned by Tarjan)
      nodeOrder.push(...scc);
    }
  }

  return nodeOrder;
}

