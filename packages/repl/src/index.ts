import Module from 'node:module'
import Util from 'node:util'
import Vm from 'node:vm'

export const builtinModules = await (async () => {
  const names = Module.builtinModules.filter(_ => _[0] !== '_' && _.indexOf('/') === -1)
  const result: Record<string, unknown> = {}
  for (const name of names) {
    try {
      result[name] = await import(name)
    } catch {
      // Some modules may not be importable (e.g., 'sea' in non-SEA contexts)
    }
  }
  return result
})()

export const builtinGlobals: Record<string, unknown> = {
  fetch,
  Buffer,
  URL,
  URLSearchParams,
  AbortController,
  AbortSignal,
  Event,
  EventTarget,
  TextEncoder,
  TextDecoder,
  TransformStream,
  TransformStreamDefaultController,
  WritableStream,
  WritableStreamDefaultController,
  WritableStreamDefaultWriter,
  ReadableStream,
  ReadableStreamDefaultReader,
  ReadableStreamBYOBReader,
  ReadableStreamBYOBRequest,
  ReadableByteStreamController,
  ReadableStreamDefaultController,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy,
  TextEncoderStream,
  TextDecoderStream,
  CompressionStream,
  DecompressionStream,
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
  queueMicrotask,
  structuredClone,
  atob,
  btoa,
  BroadcastChannel,
  MessageChannel,
  MessagePort,
  Blob,
  File,
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
  PerformanceObserver,
  PerformanceObserverEntryList,
  PerformanceResourceTiming,
  performance,
  FormData,
  Headers,
  Request,
  Response,
  MessageEvent,
  WebSocket,
  clearImmediate,
  setImmediate,
  DOMException
}

for (const builtinGlobal of Object.keys(builtinGlobals)) {
  if (builtinModules[builtinGlobal]) {
    throw new Error(`Expected builtin global ${builtinGlobal} to not appear in the list of builtin modules.`)
  }
}

for (const builtinModule of Object.keys(builtinModules)) {
  if (builtinGlobals[builtinModule]) {
    throw new Error(`Expected builtin module ${builtinModule} to not appear in the list of builtin globals.`)
  }
}

export async function runInContext(
  code: string,
  context: Vm.Context = Vm.createContext({ ...builtinGlobals, ...builtinModules }),
  options?: Vm.RunningCodeOptions
): Promise<unknown> {
  return Vm.runInContext(code, context, options)
}

export const extractRegExp = /```!(js|javascript)\n([\s\S]*?)\n```\n/gm

export function extractCode(markdown: string): string[] {
  return Array.from(markdown.matchAll(extractRegExp)).map(([, _language, code]) => code)
}

export async function* extractAndRun(
  markdown: string,
  context: Vm.Context = Vm.createContext({ ...builtinGlobals, ...builtinModules }),
  options?: Vm.RunningCodeOptions
): AsyncGenerator<unknown> {
  for (const code of extractCode(markdown)) {
    yield await runInContext(code, context, options).catch(err => Util.inspect(err))
  }
}
