import type { Frame, Transport } from './prelude.js'
import { isFrame } from './prelude.js'

/**
 * Two connected in-memory transports. Frames are delivered asynchronously (on
 * a microtask) and by reference — no cloning takes place, so this is a test
 * and in-process tool, not a serialisation check.
 */
export function pair(): [ Transport, Transport ] {
  const listeners: [ Set<(frame: Frame) => void>, Set<(frame: Frame) => void> ] = [ new Set(), new Set() ]
  const end =
    (mine: 0 | 1): Transport => {
      const theirs = mine === 0 ? 1 : 0
      return {
        post(frame) {
          return Promise
            .resolve()
            .then(() => {
              for (const listener of listeners[theirs]) {
                listener(frame)
              }
            })
        },
        subscribe(listener) {
          listeners[mine].add(listener)
          return () => {
            listeners[mine].delete(listener)
          }
        }
      }
    }
  return [ end(0), end(1) ]
}

/** The subset of MessagePort / Worker / BroadcastChannel this package needs. */
export interface PortLike {
  postMessage(data: unknown): void
  addEventListener(type: 'message', listener: (event: { readonly data: unknown }) => void): void
  removeEventListener(type: 'message', listener: (event: { readonly data: unknown }) => void): void
  start?(): void
}

/** Adapts a MessagePort-like object (browser or Node) into a {@link Transport}. */
export function fromPort(port: PortLike): Transport {
  return {
    post(frame) {
      port.postMessage(frame)
    },
    subscribe(listener) {
      const onMessage =
        (event: { readonly data: unknown }) => {
          if (isFrame(event.data)) {
            listener(event.data)
          }
        }
      port.addEventListener('message', onMessage)
      port.start?.()
      return () => port.removeEventListener('message', onMessage)
    }
  }
}

/**
 * Multiplexes several actors over one transport: frames posted through the
 * returned transport are tagged with `key`, and only frames tagged with `key`
 * are delivered to its subscribers. Use one key per served actor, and one
 * {@link RemoteActor} per key on the other side.
 */
export function channel(transport: Transport, key: string): Transport {
  return {
    post(frame) {
      return transport.post({ ...frame, channel: key })
    },
    subscribe(listener) {
      return transport.subscribe(frame => {
        if (frame.channel === key) {
          listener(frame)
        }
      })
    }
  }
}
