
import Test   from 'node:test'
import path   from 'node:path'
import assert from 'node:assert'

import {glob} from 'glob'

const Assert = function (...xs) { return assert(...xs) }
Assert.same = assert.deepStrictEqual
Object.setPrototypeOf(Assert, assert)

const $1 = process.argv[2] || ''
const rgx = new RegExp(`${$1.replaceAll('.', '\\.')}.*`)

const testdir = path.join(import.meta.dirname, 'test')

function suite () {
  this.tests = []
  this.only = false
}

suite.prototype.test = function (...xs) {
  if (this.only === false)
    this.tests.push(xs)
}

suite.prototype.testOnly = function (...xs) {
  if (this.only === false)
      this.tests = []
  
  this.only = true
  this.tests.push(xs)
}

suite.prototype.run = function () {
  this.tests.forEach(xs => Test(...xs))
}


// run
glob(path.join(testdir, '**/*.{mjs,cjs,js}'))
  .then(files => Promise.all(files.flatMap(file => {
    const name = path.relative(testdir, file)
    return rgx.test(name) ? [import(file).then(m => m.default)] : []
  })))
  .then(tests => {
    const S = new suite ()
    function _test (...xs) {
      S.test(...xs)
    }

    _test.only = function (...xs) {
      S.testOnly(...xs)
    }
    
    tests.forEach(test => test(_test, Assert))

    S.run()
  })
