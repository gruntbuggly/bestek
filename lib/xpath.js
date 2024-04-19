
const xpath = require('xpath')

module.exports = search

function search (namespaces) {
  this.lns = {lookupNamespaceURI: n => namespaces[n] }
}

search.prototype.search = function * (query, node, type) {
  const results = xpath.evaluate(query, node, this.lns, type || xpath.XPathResult.ANY_TYPE, null)
  let current
  while (current = results.iterateNext())
    yield current
}

search.prototype.searchMany = function * (query, nodes, resultType) {
  for (const node of nodes)
    yield * this.search(query, node, resultType)
}

search.XPathResult = xpath.XPathResult
