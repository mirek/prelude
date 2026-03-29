type Direction = 'in' | 'out' | 'none';

type Weight = number | 1;  // Use '1' to represent an unweighted graph

interface Edge<T> {
  to: T;
  direction: Direction;
  weight?: Weight;
}

interface Graph<T> {
  nodes: Set<T>;
  edges: Map<T, Edge<T>[]>;
}
