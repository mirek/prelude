const interpolate =
  (lhs: number, rhs: number, rhsWeight: number): number =>
    (lhs * (1 - rhsWeight)) + (rhs * rhsWeight)

export default interpolate
