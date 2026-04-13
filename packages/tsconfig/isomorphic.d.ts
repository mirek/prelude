// Isomorphic ambient declarations.
//
// Globals here MUST be available in every JavaScript runtime — Node, the
// browser, Deno, Bun, workers, edge runtimes — without pulling in
// platform-specific lib (`DOM`) or types (`@types/node`). Anything narrower
// than that belongs in a backend-only or browser-only typing layer instead.

// ---------------------------------------------------------------------------
// Timers
//
// Node's setTimeout returns NodeJS.Timeout; the DOM's returns number.
// Isomorphic code cannot depend on either concrete type. We widen to
// `number | object` so handles from either runtime — and from libraries
// typed against either — flow through setTimeout/clearTimeout without
// friction. Use `ReturnType<typeof setTimeout>` in isomorphic code.
//
// The handler is typed `(...args: any[]) => void` to match how both Node and
// the DOM declare it. Anything stricter (e.g. `unknown[]`) breaks the common
// `new Promise(resolve => setTimeout(resolve, ms))` pattern, because Promise
// `resolve` has a specific parameter type that can't accept `unknown`.

type TimerHandle = number | object;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function setTimeout(handler: (...args: any[]) => void, ms?: number, ...args: any[]): TimerHandle;
declare function clearTimeout(handle: TimerHandle | undefined): void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function setInterval(handler: (...args: any[]) => void, ms?: number, ...args: any[]): TimerHandle;
declare function clearInterval(handle: TimerHandle | undefined): void;

// ---------------------------------------------------------------------------
// Console
//
// Universally available in every JS runtime. We declare a minimal surface —
// the methods used widely in library code — so isomorphic packages can log
// without pulling in DOM or Node types.

interface Console {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trace(...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dir(item: any, options?: any): void;
  group(label?: string): void;
  groupCollapsed(label?: string): void;
  groupEnd(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table(data: any, columns?: readonly string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert(condition?: boolean, ...data: any[]): void;
  count(label?: string): void;
  countReset(label?: string): void;
  clear(): void;
}

declare const console: Console;
