# JSON-RPC 2.0 module

# Usage

```bash
npm i -E @prelude/jsonrpc
```

```ts
import * as Jsonrpc from '@prelude/jsonrpc'
```

## Server-side handling

`handle()` attaches to a WebSocket-like transport with `send`, `on`, and `removeListener` or `off` methods. It accepts string payloads, event objects with a `data` property, `ArrayBuffer`, and array-buffer views such as Node buffers.

```ts
const detach = Jsonrpc.handle(socket, {
  async call(method, params) {
    if (method === 'sum' && Array.isArray(params)) {
      return params.reduce((total, value) => total + Number(value), 0)
    }
    throw new Jsonrpc.JsonRpcError(Jsonrpc.ErrorCode.methodNotFound)
  },
  async notification(method, params) {
    // Notifications are dispatched but never receive a response.
  }
})
```

The handler accepts omitted, positional, or named params and string, numeric, or null IDs. It emits standard Parse Error, Invalid Request, Method Not Found, Invalid Params, and Internal Error objects. Mixed batches and notification-only batches follow JSON-RPC 2.0 response rules.

`processMessage()` exposes the protocol layer without a transport, which is useful for HTTP endpoints and tests; `processMessageText()` returns the same response already serialised, so it can be written to the wire without a second `JSON.stringify` pass over handler results.

## Correlated client

```ts
const client = new Jsonrpc.Client(socket, { timeout: 5_000 })

const result = await client.call<number>('sum', [ 1, 2, 3 ])
await client.notify('changed', { path: '/tmp/value' })

client.dispose()
```

The client allocates IDs, correlates success and error responses, rejects remote errors as `RemoteError`, and removes pending calls after response, timeout, abort, transport close/error, or send failure. Duplicate and unknown responses do not create pending state.

## Public protocol types

The package exports explicit `Request`, `Notification`, `SuccessResponse`, `ErrorResponse`, `ErrorObject`, `Response`, `Params`, and `Id` types. Error objects use the standard `{ code, message, data? }` shape; no transport-specific fields are added.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
