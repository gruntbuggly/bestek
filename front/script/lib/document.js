
export default document

import ooxml from './ooxml.js'
import xpath from './xpath.js'
import tree  from './tree.js'
import Key   from './key.js'

const DEFAULT_MAX = 5

function document (file, doc, dom, max=DEFAULT_MAX) {
  this.file = file
  this.doc = doc
  this.dom = dom
  this.max = max
  this.xpath = new xpath ()
}

document.read = async function (file, max=DEFAULT_MAX) {
  const doc  = await ooxml.readFile(file)
  const text = await doc.text('word/document.xml')
  const dom = new DOMParser().parseFromString(text, 'text/xml')
  return new document (file, doc, dom, max)
}

/*
document.prototype.xml = function () {
  return ooxml.write(this.dom)
}
*/

document.prototype.sections = function () {
  if (this._sections) return this._sections

  const T = this._sections = new tree ()

  const x_levels = Array(this.max).fill(0).map((_,i) => `@w:val='Kop${i+1}' or @w:val='Heading${i+1}'`)
  const x_headers = `/w:document/w:body/w:p/w:pPr/w:pStyle[${x_levels.join(' or ')}]/../..`
  const nodes = this.xpath.search(x_headers, this.dom)

  for (const node of nodes) {
    const title = this.text(node)

    const path = Key.parse(title)
    if (path)
      T.add(path, node)
  }

  return T
}

function distance (node) {
  let d = 0
  while (node) {
    d++
    node = node.parentNode
  }

  return d
}

document.prototype.text = function (node) {
  return [...this.xpath.search(`./w:r/w:t`, node)].map(n => n.firstChild.nodeValue).join(' ')
}

document.prototype.remove = function (path) {
  const sections = this.sections()

  const E0 = sections.get(path instanceof Array ? path : [path])

  this.removeSection(E0)

  return this
}

document.prototype.removeSection = function (E0) {
  const E1 = E0.next

  const el0 = E0.value
  const el1 = E1 ? E1.value : null

  const P = el0.parentNode

  let el = el0
  do {
    const next = el.nextSibling
    P.removeChild(el)
    el = next
  } while (el && el !== el1)

}

// mark 0 = unmarked (default)
// mark 1 = passed
// mark 2 = selected
document.prototype.mark = function (path) {
  this._marks = (this._marks || new WeakMap ())

  this.sections()
      .walk(path, (tree, _path) => {
        const m = path.length == _path.length ? 2 : 1
        const n = this._marks.get(tree) || 0
        const M = Math.max(m,n)
        this._marks.set(tree, M)

        if (M === 2) {
          console.log('marked', _path)
          return false
        }
        else {
          return true
        }
      })

  return this
}

// mark 0 = unmarked (default)
// mark 1 = passed
// mark 2 = selected
document.prototype.select = function () {
  const marks = this._marks = (this._marks || new WeakMap ())

  const queue = [{path: [], current: this.sections()}]

  while (queue.length > 0) {
    const {path, current} = queue.shift()

    current.forEachChild(tree => {
      const M = marks.get(tree) || 0
      switch (M) {
        case 0:
          console.log('remove', [...path, tree.key].join('.'))
          tree.value && this.removeSection(tree)
          tree.unlink()
          break;
        case 1:
          queue.push({path: [...path, tree.key], current: tree})
          break
        case 2:
        default:
          break
      }
    })

    //if (current.length === 0)
    // current.unlink()
  }

  return this

}

document.prototype.save = function () {
  const xml = new XMLSerializer ().serializeToString(this.dom)

  this.doc.replace('word/document.xml', xml)
  return this.doc.save()
}

document.prototype.list = function () {
  const list = []
  const sections = this.sections()
  sections.traverse((node, path) => {
    const text = this.text(node).replace(Key.rgx, path.join('.')+'.')
    list.push({path, text})
  })
  
  return list
}

document.prototype.name = function () {
  return this.file.name
}