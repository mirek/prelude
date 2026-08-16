[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=bugs)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=coverage)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=preludejs_jsonrpc&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=preludejs_jsonrpc)

---

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

```
MIT License

Copyright 2021 Mirek Rusin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
