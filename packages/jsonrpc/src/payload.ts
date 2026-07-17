function decodeUtf8(bytes: Uint8Array) {
  let result = ''

  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++]
    if (first < 0x80) {
      result += String.fromCodePoint(first)
      continue
    }

    let codePoint: number
    let remaining: number
    if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f
      remaining = 1
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f
      remaining = 2
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07
      remaining = 3
    } else {
      result += '\uFFFD'
      continue
    }

    if (index + remaining > bytes.length) {
      result += '\uFFFD'
      break
    }

    let valid = true
    for (let offset = 0; offset < remaining; offset += 1) {
      const next = bytes[index++]
      if ((next & 0xc0) !== 0x80) {
        valid = false
        index -= 1
        break
      }
      codePoint = (codePoint << 6) | (next & 0x3f)
    }

    if (!valid ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      result += '\uFFFD'
      continue
    }
    result += String.fromCodePoint(codePoint)
  }

  return result
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
