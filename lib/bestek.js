
export default bestek

import docu  from './document.js'
import sheet from './sheet.js'

import selection from './selection.mjs'

function bestek () {
  this.files     = {}
  this.documents = []
  this.sheets    = []
  this.unknowns  = []

  this.selection = new selection ()
  this.Q = Promise.resolve()
}

bestek.prototype.queue = function (f) {
  return this.Q.then(f, e => console.error(e))
}

const _new = {lastModified : -Infinity}
bestek.prototype.addFile = function (file) {
  if ((this.files[file.name] || _new).lastModified >= file.lastModified)
    return
  else
    this.files[file.name] = file
  
  let input
  if (/\.docx$/i.test(file.name)) {
    input = docu.read(file)
                 .then(doc => {
                  this.documents.push(doc);
                  this.documents.sort(docsort)
                })
  } else if (/\.xlsx$/i.test(file.name)) {
    input = sheet.read(file)
                 .then(sheet => {
      this.sheets.push(sheet)
      sheet.keys().map(path => this.toggle(path, false))
    })
  } else {
    this.unknowns.push(new unknown (file))
  }

  this.Q = Promise.all([this.Q, input])

  return this
}

function docsort (a, b) {
  return a.limits.min - b.limits.min
}

bestek.prototype.sections = function () {
  return this.queue(() => {
    const lists = this.documents.map(doc => doc.list()).filter(list => list.length > 0)
    lists.sort((A,B) => A[0].path[0] - B[0].path[0])

    return lists.flat()
  })
}

bestek.prototype.marked = function (path) {
  return this.selection.has(path)
}

bestek.prototype.inputs = function () {
  return this.queue(() => {
    return { documents: this.documents, sheets: this.sheets, unknowns: this.unknowns }
  })
}

bestek.prototype.outputs = function () {
  return this.queue(() => {
    if (this.sheets.length > 0 || this.selection.size > 0)
      return ({documents:this.documents, sheets: this.sheets})
    else
      return ({documents:[], sheets:[]})
  })
}

bestek.prototype.toggle = function (path, toggle=true) {
  if (this.selection.has(path)) {
    if (toggle) {
      const ds = this.selection.remove(path)
      ds.forEach(d => this.sheets.forEach(sheet => sheet.remove(d)))
      return diff.rm(ds)
    }
    else
      return diff.add([])
  }
  else {
    const ds = this.selection.add(path)
    ds.forEach(d => {
      let title
      this.documents.some(doc => title = doc.lookup(d))
      if (title) this.sheets.forEach(sheet => sheet.add(d, title))
    })
    return diff.add(ds)
  }
}

const diff =
  { rm : xs => ({remove: xs, add: []})
  , add: xs => ({remove: [], add: xs})
  }

bestek.prototype.output = function (name) {
  return this.queue(() => {
    const sections = this.selection.list()
    if (name.endsWith('.zip')) {
      return zip(this.documents, sections, this.sheets)
    }
    else if (name.endsWith('.xlsx')) {
      const sheet = this.sheets.find(doc => doc.name() === name)
      return sheet.save()
    }
    else {
      const doc = this.documents.find(doc => doc.name() === name)
      return save(doc, sections)
    }
  })
}

function save (doc, sections) {
  sections.forEach(section => doc.mark(section))
  //doc.filterTOC()
  //doc.removeTOC()
  doc.select()
  return doc.save()
}


const { Writer }  = window.conflux
async function zip (documents, sections, sheets) {
  const now = new Date ()
  const {writable, readable} = new Writer ()

  const writer = writable.getWriter()

  const response = new Response(readable)

  writer.write({name: 'bestek/', lastModified: now, directory: true})

  for await (const doc of documents) {
    const name = doc.name()
    const blob = await save(doc, sections)
    writer.write(({name: `bestek/${name}`, lastModified: now, stream: () => blob.stream() }))
  }

  for await (const sht of sheets) {
    const name = sht.name()
    const blob = await sht.blob()
    writer.write(({name: `bestek/${name}`, lastModified: now, stream: () => blob.stream() }))
  }

  writer.close()

  return response.blob()
}

function unknown (file) {
  this.file = file
}

unknown.prototype.name = function () {
  return this.file.name
}
