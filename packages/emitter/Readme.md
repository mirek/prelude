# @prelude/emitter

A type-safe event emitter with generic support, inspired by Node.js EventEmitter but with strong TypeScript typing.

## Features

- Fully typed event handling with generic support
- Promise-based event waiting with `eventually` and `eventuallyIf`
- Conditional event listeners with predicates
- One-time event listeners
- Error handling with automatic propagation to error event
- Memory leak detection for excessive listeners
- Functional programming approach

## Installation

```bash
pnpm add -E @prelude/emitter
```

## Usage

```ts
import * as Emitter from '@prelude/emitter'

// Define your events
type MyEvents = Emitter.Events & {
  start: [ { timestamp: number } ],
  progress: [ progress: { percent: number } ],
  complete: [ { result: string } ],
  error: [ Error ]
} & Emitter.Events

// Create a typed emitter
const emitter = Emitter.of<MyEvents>()

// Register event listeners
const off = emitter.on('progress', ({ percent }) => {
  console.log(`Progress: ${percent}%`)
})

// One-time listeners
emitter.once('complete', ({ result }) => {
  console.log(`Completed with result: ${result}`)
})

// Conditional listeners
emitter.onceIf('progress', _ => _.percent > 50, () => {
  console.log('More than halfway done!')
})

// Promise-based waiting
try {
  const [ { result } ] = await emitter.eventually('complete', 5_000) // 5s timeout
  console.log(`Got result: ${result}`)
} catch (err) {
  console.error('Timed out waiting for completion')
}

// Emit events
emitter.emit('start', { timestamp: Date.now() })
emitter.emit('progress', { percent: 25 })

// Unregister listeners
off()
```

### Cancellation

`eventually(name, options)` and `eventuallyIf(name, predicate, options)` take a timeout in milliseconds or `{ timeout, signal }`. Aborting the signal removes the listener and the timer and rejects with `signal.reason`; a timeout rejects with an `Err` of code `timeout`.

```ts
const controller = new AbortController()
const [ payload ] = await emitter.eventually('ready', { timeout: 5_000, signal: controller.signal })
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
