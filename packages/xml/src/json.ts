import * as A from './array.js'
import * as Ast from './ast.js'
import * as Name from './name.js'

export const attributes =
  (element: Ast.Element, { prefix, qualified = true }: { prefix?: null | string, qualified?: boolean } = {}) =>
    Object.fromEntries(element.attributes.map(attribute => [
      Name.string(attribute.name, { prefix, format: qualified ? 'qualified' : 'local' }),
      attribute.value
    ]))

export const text =
  (element: Ast.Element) =>
    element.items
      .filter(item => item.type === 'Text' || item.type === 'Cdata')
      .map(item => item.value.trim())
      .join('') || undefined

export const json =
  (element: Ast.Element, options: {
    inlineAttributePrefix?: null | string,
    undefinedElementsIfEmpty?: boolean
  } = {}) =>
    ({
      type: Name.string(element.name),
      ...typeof options.inlineAttributePrefix === 'string' ?
        attributes(element, { prefix: options.inlineAttributePrefix }) :
        { attributes: attributes(element) },
      text: text(element),
      elements: A.maybeUndefinedIfEmpty(
        options.undefinedElementsIfEmpty ?? false,
        element.items
          .filter(item => item.type === 'Element')
          .map(item => json(item, options))
      )
    })

export const property =
  (mutableJson: any, path: string[]) => {
    if (path.length < 1) {
      return
    }
    const key = path[0]
    if (mutableJson.type !== key) {
      return
    }
    if (path.length > 2) {
      const rest = path.slice(1)
      for (const element of mutableJson.elements ?? []) {
        property(element, rest)
      }
      return
    }
    const property_ = path[1]
    const elements = mutableJson.elements ?? []
    const index = elements.findIndex(element => element.type === property_)
    if (index < 0) {
      return
    }
    mutableJson[property_] = elements[index].elements
    mutableJson.elements.splice(index, 1)
    if (mutableJson.elements.length === 0) {
      delete mutableJson.elements
    }
  }

export default json
