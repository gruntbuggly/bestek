
import bestek from './lib/bestek.js'
import Key from './lib/key.js'

const App = {}
App.bestek = new bestek ()
App.index  = new Map ()
App.previous = undefined

App.class = {}
App.class.marked   = ['bg-neutral-200', 'selected']
App.class.download = 'download'

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
    if (event.shiftKey && App.previous) {
      if (App.previous.offsetTop <= $target.offsetTop)
        toggleSection.shift(App.previous, $target)
      else
        toggleSection.shift($target, App.previous)
    }
    else
      toggleSection($target)
    App.previous = $target
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

    const $lis = list.map(({path, title}) => {
      const marked = App.bestek.marked(path)
      const $li = document.createElement('li')
      const key = Key.format(path)
      $li.dataset.section = key
      App.index[key] = $li
      const $t  = document.createTextNode(`${key} ${title}`)
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

function showOutputs ({documents, sheets}) {
  const $outputZip    = document.getElementById('output-zip')
  const $outputSheets = document.getElementById('output-sheets')
  const $outputDocs   = document.getElementById('output-documents')
  if (documents.length === 0) {
    [$outputZip, $outputSheets, $outputDocs].forEach($output => $output.replaceChildren)
  }
  else {
    const $docs = documents.map(input => {
      const $li = document.createElement('li')
      const original = input.name()
      const name = targetFile(original)
      const $t  = document.createTextNode(name)
      $li.dataset.file = original
      $li.appendChild($t)
      return $li
    })

    $outputDocs.replaceChildren(...$docs)

    const $zip = document.createElement('li')
    const name = 'bestek.zip'
    $zip.dataset.file = name
    $zip.appendChild(document.createTextNode(name))

    $outputZip.replaceChildren($zip)

    const $shts = sheets.map(sheet => {
      const $li = document.createElement('li')
      const name = sheet.name()
      $li.dataset.file = name
      $li.appendChild(document.createTextNode(sheet.outputName()))
      return $li
    })

    $outputSheets.replaceChildren(...$shts)
  }
}

function targetFile (file) {
  return file.replace(/(\.(docx|xlsx))$/i, ext => '.modified'+ext)
}

function toggleSection ($li, mode='toggle') {
  const path = Key.parse($li.dataset.section)
  console.log('toggle', path, mode)
  const ar = App.bestek.toggle(path, mode === 'toggle')
  const {remove,add} = ar
  remove.forEach(path => {
    const key = Key.format(path)
    const $li = App.index[key]
    if ($li)
      $li.classList.remove(...App.class.marked)
  })
  add.forEach(path => {
    const key = Key.format(path)
    const $li = App.index[key]
    if ($li)
      $li.classList.add(...App.class.marked)
  })
}

toggleSection.shift = function ($from, $to) {
  while ($from !== $to) {
    toggleSection($from, 'leave-on')
    $from = $from.nextSibling
  }
  toggleSection($to, 'leave-on')
}

function getOutput (name) {
  console.log('output', name)
  App.bestek.output(name).then(blob => {

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
