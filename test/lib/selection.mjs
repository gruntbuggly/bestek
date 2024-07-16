
import selection from '../../lib/selection.mjs'

export default function (test, assert) {

  test('selection/empty', () => {
    const s = new selection ()
    assert(s instanceof selection)

    assert.same(s.list(), [])
  })


  test('selection/add', () => {
    const s = new selection ()
    const d1 = s.add([1,2])
    const d2 = s.add([1,3])

    assert.same(s.list(), [[1], [1,0], [1,2], [1,3]])
    assert.same(d1, [[1], [1,2], [1,0]])
    assert.same(d2, [[1,3]])
  })


  test('selection/add-fakeroots', () => {
    const s = new selection ()
    const d1 = s.add([81,51,42])

    assert.same(s.list(), [[81], [81,0], [81,50], [81,51], [81,51,0], [81,51,40], [81,51,42]])
  })


  test('selection/remove', () => {
    const s = new selection ()
    s.add([1,2])
    s.add([1,3])
    const d1 = s.remove([1,3])
    
    assert.same(s.list(), [[1], [1,0], [1,2]])
    assert.same(d1, [[1,3]])
  })


  test('selection/remove-none', () => {
    const s = new selection ()
    s.add([1,2])
    s.add([1,3])
    const d1 = s.remove([1])
    
    assert.same(s.list(), [[1], [1, 0], [1,2], [1,3]])
    assert.same(d1, [])
  })


  test('selection/remove-all', () => {
    const s = new selection ()
    s.add([1,2])
    s.add([1,3])
    s.remove([1,3])
    s.remove([1,2])

    assert.same(s.list(), [])
  })

/*
tmp disabled, no prio
  test('selection/remove-no-root', () => {
    const s = new selection ()
    s.add([1,2])
    s.add([1,3])
    s.add([1])

    s.remove([1,3])
    s.remove([1,2])

    assert.same(s.list(), [[1]])
  })


  test('selection/remove-explicit-parent', () => {
    const s = new selection ()
    s.add([1,2])
    s.remove([1,2])
    assert.same(s.list(), [])


    const t = new selection ()
    t.add([1,2])
    t.add([1])
    t.remove([1,2])
    assert.same(t.list(), [[1]])
  })
*/
}
