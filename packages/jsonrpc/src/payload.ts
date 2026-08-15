/**
 * Decodes UTF-8 with the platform decoder (WHATWG semantics: overlong forms, encoded surrogates
 * and truncated sequences each become U+FFFD; the bytes after a bad sequence are still decoded).
 */
const utf8 = new TextDecoder('utf-8')

function decodeUtf8(bytes: Uint8Array) {
  return utf8.decode(bytes)
}

function eventData(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return value
  }
  return eventData((value as { readonly data: unknown }).data)
}

/** Normalizes strings, WebSocket event objects, buffers, and array-buffer views. */
export function payloadText(payload: unknown): string {
  const value = eventData(payload)
  if (typeof value === 'string') {
    return value
  }
  if (value instanceof ArrayBuffer) {
    return decodeUtf8(new Uint8Array(value))
  }
  if (ArrayBuffer.isView(value)) {
    return decodeUtf8(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
  }
  throw new TypeError('Unsupported JSON-RPC transport payload.')
}

export default payloadText
