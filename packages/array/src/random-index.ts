export const randomIndex =
  (length: number): number => {
    // NaN and Infinity slip past `length < 1` and yield a NaN index.
    if (!(length >= 1) || !Number.isFinite(length)) {
      throw new Error(`Can't get random index for length ${length}.`)
    }
    return Math.min(length - 1, Math.floor(Math.random() * length))
  }

export default randomIndex
