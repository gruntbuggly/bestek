
import Key from './key.js'

import tree from './tree.js'

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


sheet.prototype.selection = function () {
  if (this.list) return this.list
  const t = new tree ()
  for (const key of this.keys())
    t.add(key)

  this.list = t.leafs().map(({path}) => path)
  return this.list
}
