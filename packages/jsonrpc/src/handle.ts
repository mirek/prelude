import payloadText from './payload.js'
import { ErrorCode, processMessageText, standardError } from './protocol.js'
import sendJson from './send-json.js'
import sendString from './send-string.js'
import type { EventTransport, HandleOptions } from './prelude.js'

export async function handlePayload(
  transport: EventTransport,
  payload: unknown,
  options: HandleOptions = {}
) {
  let value: unknown
  try {
    value = JSON.parse(payloadText(payload))
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      await sendJson(transport, standardError(ErrorCode.parseError))
      return
    }
    options.exception?.(error)
    return
  }

  const text = await processMessageText(value, options)
  if (text !== undefined) {
    await sendString(transport, text)
  }
}

const handle =
  (transport: EventTransport, options: HandleOptions = {}): (() => void) => {
    const listener = (payload?: unknown) => {
      void handlePayload(transport, payload, options).catch(error => {
        options.exception?.(error)
      })
    }

    transport.on('message', listener)
    return () => {
      if (transport.off) {
        transport.off('message', listener)
      } else {
        transport.removeListener?.('message', listener)
      }
    }
  }

export default handle
