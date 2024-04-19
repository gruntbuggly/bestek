

const rgx = /^\s*([0-9.]+)/

function parse (s) {
  const match = s.match(rgx)
  if (!match) return undefined
  else return match[1].split('.').filter(x => x).map(i => parseInt(i, 10))
}

function test (s) {
  return rgx.test(s)
}

module.exports = { rgx, parse, test }
