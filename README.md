## Installatie
Op commandolijn, in een map naar keuze:
```
git clone https://github.com/gruntbuggly/bestek .
```
Als je geen git zou hebben, raad ik GitHub Desktop aan: https://desktop.github.com.
Je kunt ook de sources downloaden in een ZIP op https://github.com/gruntbuggly/bestek/archive/refs/heads/main.zip

Na download moet je nog de dependencies installeren:
```
npm install
```

Als je nog geen nodejs zou hebben moet je eerst node installeren https://nodejs.org/en.


## Gebruik
Maak een submap `examples` en plaats er de relevante word/excel files in.
In de hoofdmap, voer uit:
```
node main.js examples/wordfile-1.docx examples/wordfile-2.docx examples/excelfile.xlsx
```
Nieuwe files komen naast de oude als `oude-file.selection.docx`.

Gebruik voorwaartse slashes `/` in bestandsnamen. De volgorde van de word- en excelbestanden speelt geen rol. Voeg optioneel cijfers toe om extra blokken te selecteren in de nieuwe file
```
node main.js examples/...   4.20  69  3.14.15
```
