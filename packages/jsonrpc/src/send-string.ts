import type { Sendable } from './prelude.js'

const sendString =
  (transport: Sendable, payload: string): Promise<void> =>
    new Promise((resolve, reject) => {
      let settled = false
      const done = (error?: Error) => {
        if (settled) {
          return
        }
        settled = true
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      try {
        const result = transport.send(payload, done)
        if (result && typeof result.then === 'function') {
          void result.then(() => done(), error => done(error instanceof Error ? error : new Error(String(error))))
        } else if (transport.send.length < 2) {
          done()
        }
      } catch (error: unknown) {
        done(error instanceof Error ? error : new Error(String(error)))
      }
    })

export default sendString
