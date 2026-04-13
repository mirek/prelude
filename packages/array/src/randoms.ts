export const randoms =
  (n: number): number[] =>
    Array.from({ length: n }, () => Math.random())

export default randoms
