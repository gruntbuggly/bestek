
const fs = require('fs')
const docx = require('./lib/docx.js')

const path = process.argv[2]
const sections = process.argv.slice(3).map(x => x.split('.').filter(x => x).map(k => parseInt(k, 10)))

console.log('saving sections', sections.map(s => s.join('.')))

docx.from(fs.createReadStream(path))
    .then(doc => {
        sections.reduce((doc, section) => doc.mark(section), doc)
          .select()
          .save()
          .pipe(fs.createWriteStream(path + '.mod.docx'))
    })
