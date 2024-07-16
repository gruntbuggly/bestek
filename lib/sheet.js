
import Key from './key.js'

import tree from './tree.mjs'

export default sheet

function sheet (file, header, extras, data, warn) {
  this.file = file
  this.header = header
  this.extras = extras
  this.data = data
  this.warn = warn

  this.diff = new tree ()
}

sheet.prototype.keys = function () {
  return this.data.map(({path}) => path).filter(x => x)
}

sheet.prototype.add = function (path, title) {
  this.diff.add(path, {mark:1, title})
  return this
}

sheet.prototype.remove = function (path) {
  this.diff.add(path, {mark: 0})
  return this
}

sheet.read = async function (file) {
  const rows = await window.readXlsxFile(file)

  const header  = []
  const extras = []
  const data    = []
  const warn = []

  let valueIndex = 0
  const kt_cols = 3
  rows.forEach((row, i) => {

    if (row.every(v => !v))
      return

    if (data.length === 0) {
      if (!(Key.test(row[0]))) {
        const info = row.slice(0, kt_cols)
        extras.push(row.slice(kt_cols).filter(t => t).join(' '))

        if (info[0])
          header.push({key: info[0], values: [info.slice(1).filter(x => x).join(' ')]})
        else
          header.at(-1).values.push(info.slice(1).filter(x => x).join(' '))
        return
      }
      else {
        console.log('data from row', i+1)
        valueIndex = rows.at(i-1).slice(kt_cols).findIndex((x,i,xs) => x === null && xs[i+1] !== null) + 1
        console.log('valueIndex', valueIndex)

        extras.pop()
        extras.pop()
        header.pop()
        header.pop()
      }
    }

    const [key, , title, ...values] = row
    const path = Key.parse(key) || undefined

    if (!title)
      return

    if (path === undefined)
      warn.push(`row ${i+1} does not look like an article number`)
    data.push({key, path, title, values: values.slice(valueIndex)})

  })


  return new sheet (file.name, header, extras, data, warn)
}

sheet.prototype.name = function () {
  return this.file
}

sheet.prototype.outputName = function () {
  return this.file.replace(/\.xlsx$/i, '.modified.xlsx')
}

sheet.prototype.save = function (blob=false) {
  const present = new tree ()

  const rows = []
  for (const row of this.data) {
    const path = row.path
    try {
      const {value} = this.diff.get(path)
      if (value.mark === 1)
        throw 1
    } catch (e) {
      rows.push(row)
      if (path) present.add(path)
    }
  }

  this.diff.traverse((value, path) => {
    if (value && value.mark === 1 && !present.has(path))
      rows.push({path, title: value.title, values: []})
  })

  rows.sort(sort)

  const columns = [col({width: 10}), col({width: 10}), col({width: 10}), col({width: 60}), col({width: 12}), col({width: 12}), col({width: 12}) ]
  const cells = []

  const headers = this.header.flatMap(({key,values}) => values.map((value, i) => [empty(), i > 0 ? empty() : str(key, {fontWeight: 'bold'}), empty(), str(value)]))

  const valueTypes = [{type: String}, {type: String}, {type: Number, format: '0.00'}, {type:Number, format: '0.00'}, {type:Number, format: '0.00'}]
  rows.forEach(({path, title, values, key}, R) => {
    const K = path ? Key.format(path) : key
    const style = {}
    if (path && path.length === 1) {
      style.fontWeight = 'bold'
      cells.push([empty()])
    }
    const row = [ empty(), str(K, style), empty(), str(title, style), ...fill.raw(5, values).map((value,i) => value !== null ? raw(value, valueTypes[i]) : empty(valueTypes[i]))]
    if (row.length > columns.length)
      columns.push(...Array(row.length - columns.length).fill(0).map(() => ({width: 12})))
    cells.push(row)
  })

  const N = columns.length
  cells.forEach(cell => fill(N, cell))
  headers.forEach(header => fill(N, header))

  headers[0][4] = str('Architect', {fontWeight: 'bold'})
  this.extras.forEach((extra,i) => headers[i][5] = str(extra))

  cells.unshift(
    fill(N, []),
    ...headers.map(h => grey(h)),
    fill(N, []),
    fill(N, grey([empty(), str('ArtikelNr.', {fontWeight: 'bold'}), empty(), str('Omschrijving', {fontWeight: 'bold'}), str('AvO', {fontWeight: 'bold'}), str('Eenheid', {fontWeight: 'bold'}), str('Totaal', {fontWeight: 'bold'}), str('Eenheidsprijs', {fontWeight: 'bold'}), str('Totaalprijs', {fontWeight: 'bold'}) ])),
    fill(N, [])
  )

  const L = cells.length

  cells.push(
    fill(N, []),
    fill(N, []),
    fill(N, []),
    fill(N, []),
    fill(N, []),
    fill(N, []),
  )

  cells.at(-5)[6] = str("Bedrag exlusief BTW", {fontWeight: 'bold'})
  cells.at(-3)[6] = str("BTW %", {fontWeight: 'bold'})
  cells.at(-1)[6] = str("Bedrag inlusief BTW", {fontWeight: 'bold'})

  cells.at(-3)[7] = num(0.21, {fontWeight: 'bold', format: '0%'})

  cells.at(-5)[8] = frm(`SUM(I10:I${L})` , {fontWeight: 'bold', type: 'Formula', format:'0.00'})
  cells.at(-3)[8] = frm(`H${L+4}*I${L+2}`, {fontWeight: 'bold', type: 'Formula', format:'0.00'})
  cells.at(-1)[8] = frm(`I${L+2}+I${L+4}`, {fontWeight: 'bold', type: 'Formula', format:'0.00'})

  grey.modify(cells.at(-5))
  grey.modify(cells.at(-3))
  grey.modify(cells.at(-1))

  const opts = {columns}
  if (!blob)
    opts.filePath = this.outputName()

  return window.writeXlsxFile(cells, opts)
}

sheet.prototype.blob = function () {
  const blob = this.save(true)
  return blob
}

function fill (N, row) {
  row.push(...Array(N - row.length).fill(0).map(() => empty()))
  return row
}

fill.raw = function (N, row) {
  row.push(...Array(N - row.length).fill(0).map(() => null))
  return row
}

function col (rest={}) {
  return ({fontFamily: 'Swiss 721 Light Condensed BT', fontSize: 10, ...rest})
}

function str (value, rest={}) {
  return raw(value, {type: String, ...rest})
}

function num (value, rest={}) {
  return raw(value, {type: Number, ...rest})
}
function frm (value, rest={}) {
  return raw(value, {type: 'Formula', ...rest})
}

function raw (value, rest = {}) {
  return ({value, ...rest})
}

function grey (row) {
  return row.map((x, i) => i > 0 ? ({...x, backgroundColor: grey.rgb}) : x)
}

grey.rgb = '#cccccc'

grey.modify = function (row) {
  row.forEach((x, i) => i > 0 && (row[i] = ({...x, backgroundColor: grey.rgb})))
  return row
}

function empty (rest={}) {
  return raw(null, rest)
}

function sort (a, b) {
  const A = a.path
  const B = b.path
  if (A && B) {
    let i = 0
    while (i < A.length && i < B.length) {
      const d = A[i] - B[i]
      ++i
      if (d === 0) continue
      return d
    }
    return A.length - B.length
  }
  else {
    if (A)
      return -1
    else if (B)
      return 1
    else
      return 0
  }
}
