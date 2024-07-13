
export default xpath

function xpath () {
  const namespaces = {w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', w14: 'http://schemas.microsoft.com/office/word/2010/wordml' }
  this.lns = n => namespaces[n]
}

xpath.prototype.search = function * (query, node, type) {
  const results = window.document.evaluate(query, node, this.lns, type || XPathResult.ANY_TYPE, null)
  let current
  while (current = results.iterateNext())
    yield current
}

xpath.prototype.search1 = function (...xs) {
  for (const x of this.search(...xs))
    return x
}

xpath.prototype.searchMany = function * (query, nodes, resultType) {
  for (const node of nodes)
    yield * this.search(query, node, resultType)
}
