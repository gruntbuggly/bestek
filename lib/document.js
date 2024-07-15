
export default document

import ooxml from './ooxml.js'
import xpath from './xpath.js'
import tree  from './tree.mjs'
import Key   from './key.js'

const DEFAULT_MAX = 5

function document (file, doc, dom, max=DEFAULT_MAX) {
  this.file = file
  this.doc = doc
  this.dom = dom
  this.max = max
  this.meta = new WeakMap ()
  this.xpath = new xpath ()
  this.style = 'Kop'

  this.$title = this.xpath.search1(`/w:document/w:body/w:p/w:pPr/w:pStyle[@w:val='Header' or @w:val='Koptekst']/../..`, this.dom)

  let maxpid = -1
  for (const node of this.xpath.search(`/w:document/w:body/w:p/@w14:paraId`, this.dom))
    maxpid = Math.max(maxpid, parseInt(node.value, 16))

  this.maxpid = maxpid
  console.log('maxpid', maxpid)
  this.extra = []
 
}

document.read = async function (file, max=DEFAULT_MAX) {
  const doc  = await ooxml.readFile(file)
  const text = await doc.text('word/document.xml')
  const dom = new DOMParser().parseFromString(text, 'text/xml')
  const d = new document (file, doc, dom, max)
  d.sections()
  return d
}

/*
document.prototype.xml = function () {
  return ooxml.write(this.dom)
}
*/

const Styles = ['Kop','Heading']
document.prototype.sections = function () {
  if (this._sections) return this._sections

  const T = this._sections = new tree ()

  const x_levels = Array(this.max).fill(0).map((_,i) => i+1)
  const x_styles = Styles.flatMap(style => x_levels.map(i => `@w:val='${style}${i}'`)).join(' or ')
  const x_headers = `/w:document/w:body/w:p/w:pPr/w:pStyle[${x_styles}]/../..`
  const nodes = this.xpath.search(x_headers, this.dom)

  const limits = {min: +Infinity, max: 0}
  for (const node of nodes) {
    const title = this.text(node)

    const path = Key.parse(title)
    if (path) {
      T.add(path, node)
      this.meta.set(node, { path, mark: 0 })

      if (path.length === 1) {
        limits.min = Math.min(limits.min, path[0])
        limits.max = Math.max(limits.max, path[0])
      }
    }
  }

  this.$proto = this.xpath.search1(x_headers, this.dom)
  this.limits = limits

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

document.prototype.text = function (node, join='') {
  return [...this.xpath.search(`./w:r/w:t`, node)].map(n => n.firstChild.nodeValue).join(join)
}

// mark 0 = unmarked
// mark 1 = selected
document.prototype.mark = function (path) {
  const Meta = this.meta

  let marked = false

  this.sections()
      .walk(path, (tree, _path) => {
        const node = tree.value
        const meta = Meta.get(node)
        meta.mark = 1
        marked = _path.length === path.length
      })
  
  const p0 = path[0]
  if (!marked && p0 >= this.limits.min && p0 <= this.limits.max) {
    console.warn('add', path)
  }

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

document.prototype.removeTOC = function () {
  const title = this.$title

  if (!title) {
    console.warn('no ToC detected in file', this.file.name)
    return this
  }
  else
    console.log('Title', this.text(title))

  let toc = title.nextSibling
  let i = 0
  const Meta = this.meta
  while (toc && !this.meta.has(toc)) {
    Meta.set(toc, {mark:0, path:['toc', ++i]})
    toc = toc.nextSibling
  }

  return this
}

document.prototype.filterTOC = function () {

  return this
}

document.prototype.save = function () {
  const xml = new XMLSerializer ().serializeToString(this.dom)

  this.doc.replace('word/document.xml', xml)
  return this.doc.save()
}

document.prototype.lookup = function (path) {
  try {
    const {value} = this.sections().get(path)
    return Key.after(this.text(value))
  }
  catch (e) { return undefined }
}

document.prototype.list = function () {
  const list = []
  const sections = this.sections()
  sections.traverse((node, path) => {
    const title = Key.after(this.text(node))
    list.push({path, title})
  })
  
  return list
}

document.prototype.name = function () {
  return this.file.name
}