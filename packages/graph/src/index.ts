type Direction = 'in' | 'out' | 'none'

type Edge<T> = {
  to: T,
  direction: Direction,
  weight?: number
}

export type Graph<T> = {
  nodes: Set<T>,
  edges: Map<T, Edge<T>[]>
}
