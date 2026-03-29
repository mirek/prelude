export type ScopedArray<T> = Record<string, undefined | T[]>

export type Node<N, E> = {
  id: string,
  data: N,
  edges: ScopedArray<Edge<N, E>>
}

export type Edge<N, E> = {
  type: string,
  id: string,
  data: E,
  to: Record<string, undefined | Node<N, E>>,
  weight: number
}

export type Graph<N, E> = {
  nodes: Record<string, undefined | Node<N, E>>,
  edges: Record<string, undefined | Edge<N, E>>
}

export const of =
  <N, E>() => ({
    nodes: {},
    edges: {}
  } as Graph<N, E>)

export const addNode =
  <N, E>(graph: Graph<N, E>, node: Node<N, E>) => {
    graph.nodes[node.id] = node
    return graph
  }
