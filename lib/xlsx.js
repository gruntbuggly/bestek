
const X = require('read-excel-file/node')

const Key = require('./key.js')

module.exports = xlsx

function xlsx (records=[]) {
  this.records = records
}

xlsx.prototype.append = function (that) {
  return new xlsx ([...this.records, ...that.records])
}

xlsx.prototype.keys = function () {
  return this.records.map(({key}) => key)
}

xlsx.from = async function (input) {
  const rows = await X(input)
  const records = rows.filter(row => Key.test(row[0]))
                      .map(([key,,text]) => ({key: Key.parse(key), text}))
  return new xlsx (records)
}
