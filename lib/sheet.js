
import Key from './key.js'

import tree from './tree.mjs'

export default sheet

function sheet (file,records) {
  this.file = file
  this.records = records || []
}

sheet.read = async function (file) {
  const rows = await window.readXlsxFile(file)
  const records = rows.filter(row => Key.test(row[0]))
                      .map(([key,,text]) => ({key: Key.parse(key), text}))
  return new sheet (file, records)
}

sheet.prototype.keys = function () {
  return this.records.map(({key}) => key)
}

sheet.prototype.name = function () {
  return this.file.name
}
