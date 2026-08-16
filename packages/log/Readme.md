# Log package

A lightweight, flexible TypeScript logging library with configurable severity levels and pluggable log targets.

## Features

- Simple, intuitive API
- Configurable log severity levels (trace, debug, info, warn, error, fatal)
- Pluggable log targets (console, memory, or custom)
- Namespace support for easy identification of log sources
- Environment variable control for log levels
- Error handling utilities with rescue pattern
- TypeScript support with strict typing

## Usage

```bash
pnpm i -E @prelude/log
```

```ts
import * as Fs from 'node:fs/promises'
import Log from '@prelude/log'

// Create a logger with namespace
const log = new Log('my-module')

// Log at different severity levels
log.info('application started')
log.debug('processing request', { id: 123 })

// Use the rescue pattern for error handling
const file = await Fs
  .readFile('config.json', 'utf-8')
  .catch(log.rescue('error', 'Error while trying to read file', undefined))

// Continue with file if available
if (file) {
  // Process file
}
```

Use with:
```bash
LOG=debug tsx my-script.ts
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
