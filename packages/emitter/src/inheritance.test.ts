import * as Emitter from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

type MyWebsocketEvents = {
  open: [],
  message: [ message: string ],
  close: [ code: number | string, reason: string ]
} & Emitter.Events

class MyWebsocket<T extends MyWebsocketEvents> extends Emitter.Class<T> {
  constructor() {
    super()
    this.emit('open')
  }
}

type MyClientEvents = {
  connect: [ url: string ],
  disconnect: [ reason: string ]
} & MyWebsocketEvents

class MyClient extends MyWebsocket<MyClientEvents> {
  constructor() {
    super()
    this.emit('connect', 'my-url')
  }
}

await test('should pass', async () => {
  const client: Emitter.Interface<MyClientEvents> = new MyClient()
  Emitter.after(10, () => {
    client.emit('message', 'did-login')
  })
  assert.deepEqual(await client.eventuallyIf('message', message => message.startsWith('did')), [ 'did-login' ])
})
