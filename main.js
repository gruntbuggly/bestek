
const fs = require('fs')

const docx = require('./lib/docx.js')
const xlsx = require('./lib/xlsx.js')
const key  = require('./lib/key.js')

const args = process.argv.slice(2)

const xs = args.filter(arg => arg.endsWith('.xlsx'))
               .map(path => xlsx.from(fs.createReadStream(path)).then(table => ({table, path})))

const ws = args.filter(arg => arg.endsWith('.docx'))
               .map(path => docx.from(fs.createReadStream(path)).then(doc => ({doc, path})))

const keys = args.filter(arg => key.test(arg)).map(key.parse)

Promise.all([Promise.all(xs), Promise.all(ws)]).then(([tables, docs]) => {
  const sections = [...tables.flatMap(({table}) => table.keys()), ...keys]
  docs.forEach(({doc, path}) => {
    sections.reduce((doc, section) => doc.mark(section), doc)
            .select()
            .save()
            .pipe(fs.createWriteStream(path + '.selection.docx'))
  })
})
