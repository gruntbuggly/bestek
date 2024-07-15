export default tree

function tree (key, value) {
  this.key    = key
  this.value  = value
  this.levels = {}
}

tree.prototype.add = function (path, value) {
  const t = path.reduce((t, key) => t.levels[key] || (t.levels[key] = new tree (key)), this)
  if (arguments.length > 1)
    t.value = value

  return this
}

Object.defineProperty(tree.prototype, 'size', { get () { return Object.keys(this.levels).length } })

tree.prototype.get = function (path) {
  let i = 0
  let current = this
  while (i < path.length && current) {
    const p = path[i]
    current = current.levels[p]
    ++i
  }

  if (!current)
    throw new TreeError ("not found")
  else
    return current
}

tree.prototype.has = function (path) {
  let i = 0
  let current = this
  while (i < path.length && current) {
    const p = path[i]
    current = current.levels[p]
    ++i
  }

  return !!current
}

class TreeError extends Error {}

tree.Error = TreeError

tree.prototype.forEachChild = function (f) {
  return Object.values(this.levels).forEach(child => f(child))
}

tree.prototype.walk = function (path, f) {
  let i = 0
  let current = this
  let _path = []
  while (i < path.length && current) {
    const p = path[i]
    current = current.levels[p]
    if (current) {
      ++i
      _path = [..._path, current.key]
      f(current, _path)
    }
  }

  return this
}

tree.prototype.approach = function (path) {
  let i = 0
  let current = this
  while (i < path.length) {
    const p = path[i]
    if (!p)
      break
    
    i++
    current = p
  }

  return current
}

tree.prototype.walkReverse = function (path, f) {
  const levels = [[this, []]]
  this.walk(path, (tree, path) => levels.push([tree, path]))
  levels.reverse()

  levels.forEach(([tree, path]) => f(tree, path))

  return this
}

function traverse (tree, f, path, root) {
  tree.forEachChild(child => { 
    const path2 = [...path, child.key]
    f(child, path2, root)
    traverse(child, f, path2, root)
  })
}

tree.prototype.traverse = function (f) {
  traverse(this, (tree, path) => f(tree.value, path), [], this)
}

tree.prototype.leafs = function () {
  const ls = []
  traverse(this, (tree, path) => Object.keys(tree.levels).length === 0 ? ls.push({tree, path}) : 0, [], this)
  return ls
}
