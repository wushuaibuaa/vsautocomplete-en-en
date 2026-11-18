# English word hint (auto-completion) for Visual Studio Code


## Installation

1. Press Ctrl+Shift+X to open the Extensions tab
2. Type **English word hint** to find the extension
3. Click the Install button, then the Enable button

## Hint Support

1. When editing a **markdown** file and **latex** file in Code with **English word hint** installed, any type of English words will trigger a hint of word and give the explanation.
2. Suggestions appear after the configured minimum prefix (**2 characters** by default), return at most **100** candidates by default, shortest words first, and merge all senses of a headword into one entry.

## Usage

The extension enables quick suggestions for markdown by default through `configurationDefaults`, so no manual setup is required. If you have explicitly disabled `editor.quickSuggestions` for markdown, re-enable it:

```json
"[markdown]": {
        "editor.quickSuggestions": true
    }
```

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `englishWordHint.enabled` | `true` | Enable completion and hover hints. |
| `englishWordHint.minPrefixLength` | `2` | Characters required before suggestions appear. |
| `englishWordHint.maxResults` | `100` | Maximum suggestions returned at once. |

## Data

The bundled dictionary data is described in [DATA_SOURCE.md](DATA_SOURCE.md). Read it before redistributing the extension: the current source data is not covered by the GPL-3.0 code license.

## Development

```bash
npm install
npm test          # builds hint_data/a-z.json, then runs unit + integration tests
npm run package   # produces a .vsix (vscode:prepublish runs the build)
```

Project layout:

- `extension/main.js` — VS Code glue: providers, caches, settings, logging
- `lib/` — pure logic (`trie.js`, `word-text.js`) with unit tests
- `scripts/split-words.js` — cleans `hint_data/words.json` and writes per-letter chunks
- `scripts/lib/clean-headword.js` — headword cleaning rules used by the build
- `test/` — `node:test` unit and integration tests; `test-support/` holds a minimal `vscode` stub
- `hint_data/[a-z].json` — generated build artifacts (not committed); run `npm run build` after cloning

## Declaration

1. Open source license of the extension code is [GPL-3.0](LICENSE). Bundled dictionary data is covered separately; see [DATA_SOURCE.md](DATA_SOURCE.md).

## Author

[Wushuai](https://github.com/wushuaibuaa)
