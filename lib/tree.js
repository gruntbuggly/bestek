module.exports = tree

function tree (parent, key, value) {
  this.parent = parent
  this.key    = key
  this.value  = value
  this.keys   = []
  this.levels = {}
  this.nonint = 0

  if (!parent)
    this.next = undefined
  else {
    parent.levels[key] = this
    if (typeof key !== 'number')
      ++this.parent.nonint
    this.parent.keys.push(key)
    this.parent.keys.sort(this.parent.nonint === 0 ? nsort : undefined)
  }
}

function nsort (a,b) {
  return a - b
}

tree.prototype.add = function (path, value) {
  let i = 0
  let current = this
  while (i < path.length) {
    const p = path[i]
    current = (current.levels[p] || new tree (current, p))
    ++i
  }

  current.value = value

  return this
}

tree.prototype.get = function (path) {
  let i = 0
  let current = this
  while (i < path.length && current) {
    const p = path[i]
    current = current.levels[p]
    ++i
  }

  if (!current)
    throw new Error ("not found")
  else
    return current
}

Object.defineProperty(tree.prototype, 'next', { get () {
  const keys   = this.parent.keys
  const levels = this.parent.levels

  const i = keys.findIndex(key => key == this.key)
  const key = keys[i+1]
  return levels[key]
}})

Object.defineProperty(tree.prototype, 'length', { get () {
  return this.keys.length
}})

tree.prototype.unlink = function () {
  if (this.parent) {
    const i = this.parent.keys.indexOf(this.key)
    this.parent.keys.splice(i, 1)
    delete this.parent.levels[this.key]
    if (typeof this.key !== 'number')
      --this.parent.nonint
  }

  return this
} 

tree.prototype.forEachChild = function (f) {
  return [...this.keys].forEach(key => f(this.levels[key]))
}

tree.prototype.walk = function (path, f) {
  let i = 0
  let current = this
  let cont = true
  while (i < path.length && cont) {
    const p = path[i]
    current = current.levels[p]
    cont = current && f(current, p, i)
    ++i
  }

  return this
}