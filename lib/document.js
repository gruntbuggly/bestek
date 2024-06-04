
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
  this.meta = new WeakMap ()
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
    if (path) {
      T.add(path, node)
      this.meta.set(node, { path, mark: 0 })
    }
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

// mark 0 = unmarked
// mark 1 = selected
document.prototype.mark = function (path) {
  const Meta = this.meta

  this.sections()
      .walk(path, (tree, _path) => {
        const node = tree.value
        const meta = Meta.get(node)
        meta.mark = 1
      })

  return this
}

// action 0 = remove
// action 1 = save
document.prototype.select = function () {
  const Meta  = this.meta
  const body  = this.xpath.search1('/w:document/w:body', this.dom)
  const state = {node: body.firstChild, action: 1}
  while (state.node) {
    const node = state.node
    state.node = node.nextSibling

    let meta = Meta.get(node)
    if (meta)
      state.action = Math.min(meta.mark, 1)

    if (state.action === 0) {
      if (meta) console.log('remove', meta.path.join('.'))
      body.removeChild(node)
    }
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