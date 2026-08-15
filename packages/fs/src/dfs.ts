import * as Fs from 'node:fs'
import * as Path from 'node:path'

export type DfsEntry = {
  path: string,
  dirent: Fs.Dirent,
  parent: string,
  link?: string,
  linkpath?: string
}

export type DfsOptions = {
  /** Follow directory symbolic links. Defaults to true. */
  followLinks?: boolean,
  /** Permit followed links to resolve outside the requested root. Defaults to false. */
  allowOutsideRoot?: boolean
}

const maybeLink =
  async (dirent: Fs.Dirent, parent: string) =>
    dirent.isSymbolicLink() ?
      await Fs.promises.readlink(Path.join(parent, dirent.name)) :
      undefined

const maybeAbsolute =
  (parent: string, target?: string) => {
    if (!target) {
      return undefined
    }
    return Path.normalize(Path.isAbsolute(target) ? target : Path.join(parent, target))
  }

const isInside =
  (root: string, target: string) => {
    const relative = Path.relative(root, target)
    return relative === '' ||
      (!Path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${Path.sep}`))
  }

const isUnfollowableLinkError =
  (error: unknown) => {
    const code = (error as NodeJS.ErrnoException | undefined)?.code
    return code === 'ENOENT' || code === 'ENOTDIR' || code === 'ELOOP'
  }

const aux =
  async function* (
    parent: string,
    root: string,
    recurse: (entry: DfsEntry) => boolean,
    options: Required<DfsOptions>,
    visited: Set<string>
  ): AsyncGenerator<DfsEntry> {
    const dirents = await Fs.promises.readdir(parent, { withFileTypes: true })
    dirents.sort((left, right) => left.name.localeCompare(right.name))

    for (const dirent of dirents) {
      const path = Path.join(parent, dirent.name)
      const link = await maybeLink(dirent, parent)
      const linkpath = maybeAbsolute(parent, link)
      const entry = { path, dirent, parent, link, linkpath }
      yield entry

      if (!recurse(entry)) {
        continue
      }

      if (dirent.isDirectory()) {
        const realpath = await Fs.promises.realpath(path)
        if (visited.has(realpath)) {
          continue
        }
        visited.add(realpath)
        yield* aux(path, root, recurse, options, visited)
        continue
      }

      if (!dirent.isSymbolicLink() || !options.followLinks) {
        continue
      }

      try {
        const [ realpath, stats ] = await Promise.all([
          Fs.promises.realpath(path),
          Fs.promises.stat(path)
        ])
        if (!stats.isDirectory()) {
          continue
        }
        if (!options.allowOutsideRoot && !isInside(root, realpath)) {
          continue
        }
        if (visited.has(realpath)) {
          continue
        }
        visited.add(realpath)
        yield* aux(path, root, recurse, options, visited)
      } catch (error: unknown) {
        if (!isUnfollowableLinkError(error)) {
          throw error
        }
      }
    }
  }

/**
 * Traverses a directory depth-first in deterministic name order.
 *
 * Directory links are followed once by canonical target identity, preventing
 * cycles and duplicate traversal. Links resolving outside the requested root are
 * yielded but not followed unless `allowOutsideRoot` is explicitly enabled.
 */
export const dfs =
  async function* (
    parent = '.',
    recurse: (entry: DfsEntry) => boolean = () => true,
    options: DfsOptions = {}
  ): AsyncGenerator<DfsEntry> {
    const root = await Fs.promises.realpath(parent)
    const visited = new Set([ root ])
    yield* aux(parent, root, recurse, {
      followLinks: options.followLinks ?? true,
      allowOutsideRoot: options.allowOutsideRoot ?? false
    }, visited)
  }

export default dfs
