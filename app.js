
import bestek from './lib/bestek.js'
import Key from './lib/key.js'

const App = {}
App.bestek = new bestek ()
App.index  = new Map ()

App.class = {}
App.class.marked   = ['bg-neutral-200', 'selected']
App.class.download = 'download'
App.class.zip = 'zip'

const $dropArea = document.getElementById('drop-area')

$dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation()
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
})

$dropArea.addEventListener('drop', (event) => {
  event.stopPropagation()
  event.preventDefault()
  const files = event.dataTransfer.files
  handleFiles(files)
})

$dropArea.addEventListener('click', () => {
  document.getElementById('fileElem').click()
})

document.getElementById('fileElem').addEventListener('change', (event) => {
  const files = event.target.files
  handleFiles(files)
})

document.getElementById('col-sections').addEventListener('click', event => {
  const $target = event.target
  if ($target.dataset.section) {
    toggleSection($target)
    App.bestek.outputs().then(showOutputs)
  }
})

document.getElementById('col-output').addEventListener('click', event => {
  const $target = event.target
  if ($target.dataset.file) {
    getOutput($target.dataset.file)
  }
})

function handleFiles(files) {
  for (let i = 0; i < files.length; ++i) {
    const file = files[i]
    App.bestek.addFile(file)
  }

  App.bestek.sections().then(list => {
    const $sections = document.querySelector('#sections')

    const $lis = list.map(({path, text}) => {
      const marked = App.bestek.marked(path)
      const $li = document.createElement('li')
      const key = path.join('.')
      $li.dataset.section = key
      App.index[key] = $li
      const $t  = document.createTextNode(text)
      $li.classList.add(`pl-${path.length}`, ...(marked ? App.class.marked : []))
      if (path.length === 1)
          $li.classList.add('mt-2','font-medium')
      $li.appendChild($t)

      return $li
    })

    $sections.replaceChildren(...$lis)
  })

  App.bestek.inputs().then(({documents, sheets, unknowns}) => {
    const $documents = document.querySelector('#documents')
    const $sheets    = document.querySelector('#sheets')
    const $unknowns  = document.querySelector('#unknowns')

    showInput($documents, documents)
    showInput($sheets   , sheets)
    showInput($unknowns , unknowns)

    
  })

  App.bestek.outputs().then(showOutputs)
}

function showInput ($el, list) {
  if (list.length === 0) {
    $el.replaceChildren()
  }
  else {
    const $lis = list.map(input => {
      const $li = document.createElement('li')
      const $t  = document.createTextNode(input.name())
      $li.appendChild($t)
      $li.classList.add('pl-2')
      return $li
    })
    $el.replaceChildren(...$lis)
  }

}

function showOutputs (documents) {
  const $outputs = document.getElementById('outputs')
  if (documents.length === 0) {
    $outputs.replaceChildren()
  }
  else {
    const $lis = documents.map(input => {
      const $li = document.createElement('li')
      const original = input.name()
      const name = targetFile(original)
      const $t  = document.createTextNode(name)
      $li.dataset.file = original
      $li.appendChild($t)
      return $li
    })

    const $zip = document.createElement('li')
    $zip.classList.add(App.class.zip)
    const $t = document.createTextNode('bestek.zip')
    $zip.dataset.file = 'bestek.zip'
    $zip.appendChild($t)

    $outputs.replaceChildren($zip, ...$lis)
  }
}

function targetFile (file) {
  return file.replace(/(\.docx)$/i, ext => '.modified'+ext)
}

function toggleSection ($li) {
  const path = Key.parse($li.dataset.section)
  const ar = App.bestek.toggle(path)
  const {remove,add} = ar
  remove.forEach(path => {
    const key = path.join('.')
    const $li = App.index[key]
    if ($li)
      $li.classList.remove(...App.class.marked)
  })
  add.forEach(path => {
    const key = path.join('.')
    const $li = App.index[key]
    if ($li)
      $li.classList.add(...App.class.marked)
  })
}

function getOutput (name) {
  App.bestek.output(name).then(blob => {
    //return

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.classList.add(App.class.download)
    anchor.href = url
    anchor.download = targetFile(name)
    document.body.appendChild(anchor)  
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  })
}
