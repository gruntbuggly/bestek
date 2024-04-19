
module.exports = docx

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom')

const xpath = require('./xpath.js')
const ooxml = require('./ooxml.js')
const tree  = require('./tree.js')
const Key   = require('./key.js')

const DEFAULT_MAX = 5

function docx (doc, max=DEFAULT_MAX) {
  this.doc = doc

  const xml = doc.text('word/document.xml')
  this.dom = new DOMParser().parseFromString(xml, 'text/xml')
  this.max = max
  this.xpath = new xpath (this.dom.documentElement._nsMap)
}

docx.from = async function (input, max=DEFAULT_MAX) {
  return ooxml.read(input).then(doc => new docx (doc, max))
}

docx.prototype.xml = function () {
  return ooxml.write(this.dom)
}

docx.prototype.sections = function () {
  if (this._sections) return this._sections

  const T = this._sections = new tree ()

  const x_levels = Array(this.max).fill(0).map((_,i) => `@w:val='Kop${i+1}'`)
  const x_headers = `/w:document/w:body/w:p/w:pPr/w:pStyle[${x_levels.join(' or ')}]/../..`
  const nodes = this.xpath.search(x_headers, this.dom)

  for (const node of nodes) {
    //const level = [...this.xpath.search(`./w:pPr/w:pStyle/@w:val`, node)].map(n => n.value)
    const title = this.text(node)

    const match = title.match(Key.rgx)
    if (!match) continue

    const [,num] = match
    const path = num.split('.').filter(x => x).map(x => parseInt(x, 10))
    T.add(path, node)
  }

  return T
}

docx.prototype.text = function (node) {
  return [...this.xpath.search(`./w:r/w:t`, node)].map(n => n.firstChild.nodeValue).join(' ')
}

docx.prototype.remove = function (path) {
  const sections = this.sections()

  const E0 = sections.get(path instanceof Array ? path : [path])

  this.removeSection(E0)

  return this
}

docx.prototype.removeSection = function (E0) {
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
docx.prototype.mark = function (path) {
  this._marks = (this._marks || new WeakMap ())

  this.sections()
      .walk(path, (tree, key, i) => {
        const m = i === path.length - 1 ? 2 : 1
        const n = this._marks.get(tree) || 0
        const M = Math.max(m,n)
        this._marks.set(tree, M)

        return M !== 2
      })

  return this
}

// mark 0 = unmarked (default)
// mark 1 = passed
// mark 2 = selected
docx.prototype.select = function () {
  const marks = this._marks = (this._marks || new WeakMap ())

  const queue = [{path: [], current: this.sections()}]

  while (queue.length > 0) {
    const {path, current} = queue.shift()

    current.forEachChild(tree => {
      const M = marks.get(tree) || 0
      switch (M) {
        case 0:
          //console.log('remove', [...path, tree.key].join('.'))
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

docx.prototype.save = function () {
  const xml = new XMLSerializer ().serializeToString(this.dom)
  this.doc.replace('word/document.xml', xml)
  return this.doc.save()
}
