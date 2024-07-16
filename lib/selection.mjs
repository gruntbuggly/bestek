
export default selection

import tree from './tree.mjs'

function selection () {
  this.tree = new tree ()
  this.value = 0
}

Object.defineProperty(selection.prototype, 'size', { get () { return this.tree.size }})

const MARK_PASSED = 1
const MARK_DIRECT = 2

selection.prototype.add = function (path, implied=true) {
  const diff = []
  this.tree.add(path)
  this.tree.walk(path, (current, _path) => {
    if (current.value === undefined) {
      diff.push(_path)
      current.value = 0
    }
    current.value |= (implied || _path.length < path.length) ? MARK_PASSED : MARK_DIRECT
  })

  return diff.flatMap(d => { const fr = fakeroot(d); return fr ? [d, ...this.add(fr, true)] : [d] })
}

function fakeroot (path) {
  if (path.length === 1)
    return undefined

  const p  = path.at(-1)
  const p0 = fakeroot.next(p)

  if (p !== p0)
    return [...path.slice(0,-1), p0]
  else
    return undefined
}

fakeroot.next = function (n) {
  return parseInt((n+'').replace(/[^0](0*)$/, (s,$1) => `${0}${$1}`), 10)
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
      if ((child.value & MARK_DIRECT) !== MARK_DIRECT && children(tree, key) === 0) {
        delete tree.levels[key]
        diff.push([..._path, child.key])
      }
    }
  })

  return diff.flatMap(d => { const fr = fakeroot(d); return fr ? [d, ...this.remove(fr)] : [d] })
}

function children (tree, key) {
  const self = tree.levels[key]

  if (!self)
    return 0

  else if (key % 10 === 0) {
    const key0 = key+''
    const K = key0.replace(/0*$/, '')
    return self.size + Object.keys(tree.levels).filter(k => k.startsWith(K) && k !== key0).length
  }
  else
    return self.size
}

selection.prototype.list = function () {
  const list = []
  this.tree.traverse((tree, path) => list.push(path))

  return list
}
