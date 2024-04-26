
export default bestek

import docu  from './document.js'
import sheet from './sheet.js'
import Key   from './key.js'

function bestek () {
  this.files     = {}
  this.documents = []
  this.sheets    = []
  this.unknowns  = []

  this.toggles = new Set ()
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
                 .then(doc => this.documents.push(doc))
  } else if (/\.xlsx$/i.test(file.name)) {
    input = sheet.read(file)
                 .then(sheet => this.sheets.push(sheet))
  } else {
    this.unknowns.push(new unknown (file))
  }

  this.Q = Promise.all([this.Q, input])

  return this
}

bestek.prototype.sections = function () {
  return this.queue(() => {
    const lists = this.documents.map(doc => doc.list()).filter(list => list.length > 0)
    lists.sort((A,B) => A[0].path[0] - B[0].path[0])

    return lists.flat()
  })
}

bestek.prototype.inputs = function () {
  return this.queue(() => {
    return { documents: this.documents, sheets: this.sheets, unknowns: this.unknowns }
  })
}

bestek.prototype.outputs = function () {
  return this.queue(() => {
    if (this.sheets.length > 0 || this.toggles.size > 0)
      return this.documents
    else
      return []
  })
}

bestek.prototype.toggle = function (section) {
  if (this.toggles.has(section))
    this.toggles.delete(section)
  else
    this.toggles.add(section)
  return this
}

bestek.prototype.output = function (name) {
  return this.queue(() => {
    const toggles  = [...this.toggles].map(Key.parse)
    const sections = [...toggles, ...this.sheets.flatMap(sheet => sheet.selection())]
    console.log('output', name)
    if (name.endsWith('.zip')) {
      return zip(this.documents, sections)

    }
    else {
      const doc = this.documents.find(doc => doc.name() === name)
      return save(doc, sections)
    }
  })
}

function save (doc, sections) {
  sections.forEach(section => doc.mark(section))
  return doc.select().save()
}


const { Writer }  = window.conflux
async function zip (documents, sections) {
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

  writer.close()

  return response.blob()
}

function unknown (file) {
  this.file = file
}

unknown.prototype.name = function () {
  return this.file.name
}
