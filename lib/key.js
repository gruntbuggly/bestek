
const rgx = /^\s*([0-9. ]+)(.*)/

function parse (s) {
  const match = (s || '').match(rgx)
  if (!match) return undefined
  else return match[1].replaceAll(' ','').split('.').filter(x => x).map(i => parseInt(i, 10))
}

function format (xs) {
  return xs.map(x => (''+x).padStart(2, '0')).join('.') + '.'
}

function test (s) {
  return rgx.test(s)
}

function after (s) {
  const match = (s || '').match(rgx)
  if (!match) return s
  else return match[2].replace('|', ' |')
}

export default { rgx, parse, test, format, after }
