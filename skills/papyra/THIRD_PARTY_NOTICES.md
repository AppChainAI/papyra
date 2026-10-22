# Third-party notices

## Rough Notation

`assets/rough-notation-0.5.1.iife.js` is the unmodified, self-contained upstream browser distribution. Papyra's `annotations.js` and `annotations.css` integrate it into offline reading pages.

- Source: https://github.com/rough-stuff/rough-notation
- Version: 0.5.1
- Distribution: https://unpkg.com/rough-notation@0.5.1/lib/rough-notation.iife.js
- SHA256: `f90aa0090e361ff48694b74e0319e109856decb3e757c280dfe25e3607f35fac`
- Copyright 2020 Preet Shihn
- License: MIT; full text: [licenses/rough-notation-MIT.txt](licenses/rough-notation-MIT.txt).

When embedding the library in a generated HTML file, include this copyright and full license text in that file too.

## Impeccable

`references/visual-design.md` and `references/acceptance.md` contain material adapted from Impeccable's reading-mode, typography, layout, polish, and bounded-verification guidance. Papyra changes the guidance for Chinese document reading, system fonts, offline single-file output, and source-content fidelity; it does not bundle Impeccable's engine or launcher.

- Source: https://github.com/pbakaus/impeccable
- Reference commit: 508d7e8955de3b3caf2d8676e85206723d41a887
- Source files: `skill/SKILL.src.md`, `skill/reference/mode-read.md`, `skill/reference/typeset.md`, `skill/reference/layout.md`, `skill/reference/polish.md`
- Copyright 2025 Paul Bakaus
- License: Apache License 2.0; the complete license is distributed in [licenses/impeccable-Apache-2.0.txt](licenses/impeccable-Apache-2.0.txt).

The license applies to the adapted Impeccable material, not as a license declaration for the entire Papyra repository. Upstream `NOTICE.md` concerns iOS and Android references derived from ehmo's platform-design-skills; those references are not included or adapted here.

## oil-ui

`references/visual-design.md` contains material adapted from this source.

- Source: https://github.com/oil-oil/oil-ui
- Upstream skill version: 0.10.0
- Reference commit: d9510bdc13159b53b31dfb1902ad0a557c899fcd
- License: MIT

The following notice applies to the adapted oil-ui material, not as a license declaration for the entire Papyra repository.

MIT License

Copyright (c) 2026 oil-oil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Temml

Papyra bundles selected unmodified files from the actual npm package `temml@0.14.0`. The generation helper imports the ESM renderer locally and emits static MathML. The upstream browser build is available for hosts but is not required or embedded in generated static pages.

- Source: https://github.com/ronkok/Temml
- Package: https://registry.npmjs.org/temml/-/temml-0.14.0.tgz
- Version: 0.14.0; package declares Node >=18.13.0.
- Copyright (c) 2020 Ron Kok
- License: MIT; complete text: [licenses/temml-MIT.txt](licenses/temml-MIT.txt).
- Tarball SHA-256: `6be7cc75cd61af39a98fd1d88146732818b042ae665963cf0473b44a44b090e2`

Selected files, copied verbatim from `package/` in that tarball:

| Bundled path | Upstream path | SHA-256 |
| --- | --- | --- |
| `assets/temml-0.14.0/temml.mjs` | `dist/temml.mjs` | `09e55a0c364d35b8ef66be49486b90884240a7e66c463a825e096faf27b0d59d` |
| `assets/temml-0.14.0/temml.min.js` | `dist/temml.min.js` | `56b4338176d39170692503b8b7ec630d3edf8e10861895658deb74aefb66af9d` |
| `assets/temml-0.14.0/Temml-Local.css` | `dist/Temml-Local.css` | `544f4e3fee4c36f4568e4f145fa626dc9573c5f4c96c523aadcc433c3989a239` |
| `assets/temml-0.14.0/Temml.woff2` | `dist/Temml.woff2` | `fc70501355ae6d38ff0b80f825af153557d5f2f474198d6b9b7dd2d3a291a0cc` |
| `assets/temml-0.14.0/package.json` | `package.json` | `cfb9a87f7652247f99d09304913c91180fc1a05ee5fa74abdb0a138c912febf5` |
| `licenses/temml-MIT.txt` | `LICENSE` | `12b4e5592a12baaf50637881f2cb9d66667b26b8d51a73cd8f0d6bcefe176ab6` |

The original CSS and font remain unchanged in the bundle. For single-file HTML only, `scripts/render-math.mjs` replaces the CSS's one `url('Temml.woff2')` with a data URL containing the actual bundled font bytes; no other upstream CSS is rewritten. The stylesheet describes this font as a Unicode-codepoint-remapped clone of KaTeX_Script-Regular; it is supplied by Temml under the package's MIT license. MathML otherwise uses local system/browser math fonts, never online fonts.

Generated HTML must retain the complete Temml MIT copyright/license comment returned by the helper, even though no Temml JavaScript is shipped to readers. See [math integration](references/math.md) for the source-preservation, recognition, error and accessibility contracts.
