
module.exports = ooxml

const stream = require('stream')

const unzipper = require('unzipper')
const archiver = require('archiver')

const tree = require('./tree.js')

function ooxml (contents) {
  this.contents = contents
}

ooxml.read = function (input) {
  return read(input).then(contents => new ooxml (contents))
}

ooxml.prototype.text = function (path) {
  return this.contents.get([path]).value.join('')
}

ooxml.prototype.replace = function (path, text) {
  this.contents.get([path]).value = Buffer.from(text, 'utf-8')
}


ooxml.prototype.save = function (path) {
  const archive = archiver('zip', { zlib: {level: 9}})
  Object.entries(this.contents.levels).forEach(([name, {value}]) =>
    archive.append(value instanceof Array ? stream.Readable.from(value) : value, {name}))
  archive.finalize()

  archive.on('warning', e => console.error(e))
  return archive
}

function read (binary) {
  if (! (binary instanceof stream))
    binary = stream.readable.from([binary])

  const T = new tree ()
  const p = []

  return new Promise ((resolve, reject) => {
    binary.pipe(unzipper.Parse())
          .on('entry', entry => {
            p.push(capture(entry).then(text => T.add([entry.path], text)))
          })
          .on('end', () => Promise.all(p).then(() => resolve(T)))
          .on('error', reject)
  })
}

async function capture (chunks) {
  const list = []
  for await (const chunk of chunks)
    list.push(chunk)

  return list
}
