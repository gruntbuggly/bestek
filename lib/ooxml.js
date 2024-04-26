
export default ooxml

const { Reader , Writer }  = window.conflux

function ooxml (file, entries, index) {
  this.file = file
  this.entries = entries
  this.index = index
}

ooxml.readFile = async function (file) {
  const entries = []
  const index = {}
  const reading = Reader(file)
  for await (const entry of reading) {
    const name = entry.name
    index[name] = entries.length
    entries.push(entry)
  }

  return new ooxml (file, entries, index)
}

ooxml.prototype.text = function (name) {
  if (!(name in this.index)) throw new Error (`No such entry: ${name}`)

  return this.entries[this.index[name]].text()
}

ooxml.prototype.replace = function (name, contents) {
  if (!(name in this.index)) throw new Error (`No such entry: ${name}`)

  const blob = new Blob([ contents ], {type: 'text/plain'})
  this.entries[this.index[name]] = Object.create({name, fake:true, stream: () => blob.stream()}, blob)

  return this
}

ooxml.prototype.save = async function () {
  const now = new Date ()
  const {writable, readable} = new Writer ()

  const writer = writable.getWriter()

  const response = new Response(readable)

  for (const entry of this.entries) {
    writer.write(({name: entry.name, lastModified: now, stream: () => entry.stream() }))
  }

  writer.close()

  return response.blob()
}
