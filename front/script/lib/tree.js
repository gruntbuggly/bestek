export default tree

function tree (key, value) {
  this.key    = key
  this.value  = value
  this.levels = {}
}

tree.prototype.add = function (path, value) {
  const t = path.reduce((t, key) => t.levels[key] || (t.levels[key] = new tree (key)), this)
  t.value = value

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

tree.prototype.forEachChild = function (f) {
  return Object.values(this.levels).forEach(child => f(child))
}

tree.prototype.walk = function (path, f) {
  let i = 0
  let current = this
  let cont = true
  let _path = []
  while (i < path.length && cont) {
    const p = path[i]
    current = current.levels[p]
    if (current) {
      _path = [..._path, current.key]
      cont = f(current, _path)
    }
    else
      cont = current
    ++i
  }

  return this
}

tree.prototype.traverse = function (f) {
  traverse(this, f, [], this)
}

function traverse (tree, f, path, root) {
  tree.forEachChild(child => { 
    const path2 = [...path, child.key]
    f(child.value, path2, root)
    traverse(child, f, path2, root)
  })
}
