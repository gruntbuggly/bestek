
export default selection

import tree from './tree.mjs'

function selection () {
  this.tree = new tree ()
  this.value = 0
}

Object.defineProperty(selection.prototype, 'size', { get () { return this.tree.size }})

const MARK_PASSED = 1
const MARK_DIRECT = 2

selection.prototype.add = function (path) {
  const diff = []
  this.tree.add(path)
  this.tree.walk(path, (current, _path) => {
    if (current.value === undefined) {
      diff.push(_path)
      current.value = 0
    }
    current.value |= _path.length < path.length ? MARK_PASSED : MARK_DIRECT
  })

  const fr = fakeroot(path)
  if (fr)
    diff.push(...this.add(fr))

  return diff
}

function fakeroot (path) {
  const p_1 = path.at(-1)
  if ((p_1 % 10) > 0)
    return [...path.slice(0,-1), p_1 - (p_1%10)]
  else
    return undefined
}

selection.prototype.has = function (path) {
  try {
    this.tree.get(path)
    return true
  }
  catch (e) {
    if (e instanceof tree.Error)
      return false
    else
      throw e
  }
}


selection.prototype.remove = function (path) {
  const diff = []
  this.tree.walkReverse(path, (tree, _path) => {
    if (_path.length === path.length) {
      tree.value &= ~MARK_DIRECT
    }
    else {
      const key   = path[_path.length]
      const child = tree.levels[key]
      if ((child.value & MARK_DIRECT) !== MARK_DIRECT && child.size === 0) {
        delete tree.levels[key]
        diff.push([..._path, child.key])
      }
    }
  })

  const fr = fakeroot(path)
  if (fr)
    diff.push(...this.remove(fr))

  return diff
}


selection.prototype.list = function () {
  const list = []
  this.tree.traverse((tree, path) => list.push(path))

  return list
}
