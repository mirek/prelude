/** Function decorator precondition on parameter arguments. */
function rpc<Args extends unknown[]>(predicate: (args: unknown) => args is Args) {
  return <This, Return>(
    value: (this: This, ...args: Args) => Return,
    _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ): ((this: This, ...args: Args) => Return) =>
    function (this: This, ...args: Args): Return {
      if (!predicate(args)) {
        throw new TypeError('Invalid argument(s).')
      }
      return value.apply(this, args)
    }
}

export default rpc
