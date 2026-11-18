# English word hint (auto-completion) for Visual Studio Code


## Installation

1. Press Ctrl+Shift+X to open the Extensions tab
2. Type **English word hint** to find the extension
3. Click the Install button, then the Enable button

## Hint Support

1. When editing a **markdown** file and **latex** file in Code with **English word hint** installed, any type of English words will trigger a hint of word and give the explanation.
2. Suggestions appear after the configured minimum prefix (**2 characters** by default), return at most **100** candidates by default, are ranked by word frequency, and merge all senses of a headword into one entry.
3. Hover resolves inflected forms (`children` → `child`, `studies` → `study`, `known` → `know`) through a build-time form index.
4. Suggestions and hover are suppressed inside quoted strings, Markdown code/frontmatter/link targets, LaTeX comments/math/commands, URLs and emails.
5. Also works in **plaintext**; completion and hover can be toggled independently.
6. Right-click commands: **Add Word to User Dictionary**, **Ignore Word**, **Show Full Entry**. User words are offered first; ignored words are hidden; the full entry opens as a Markdown document with every sense.
7. Multiword headwords insert with spaces (`commander-in-chief` → `commander in chief`) while hyphenated compounds such as `well-known` stay unchanged.

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
| `englishWordHint.enabled` | `true` | Master switch for the extension. |
| `englishWordHint.completionEnabled` | `true` | Enable completion suggestions. |
| `englishWordHint.hoverEnabled` | `true` | Enable hover definitions. |
| `englishWordHint.languages` | `["markdown", "latex", "plaintext"]` | Language IDs where the extension is active. |
| `englishWordHint.userWords` | `[]` | Extra words offered in completion and hover. |
| `englishWordHint.ignoredWords` | `[]` | Words suppressed from completion and hover. |
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
- `lib/` — pure logic (`trie.js`, `word-text.js`, `context.js`) with unit tests
- `scripts/split-words.js` — cleans `hint_data/words.json`, ranks words, and writes per-letter chunks plus the form index
- `scripts/lib/clean-headword.js` — headword cleaning rules used by the build
- `scripts/lib/word-forms.js` — inflection/irregular form generation used by the build
- `test/` — `node:test` unit and integration tests; `test-support/` holds a minimal `vscode` stub
- `hint_data/[a-z].json` and `hint_data/forms/` — generated build artifacts (not committed); run `npm run build` after cloning

## Declaration

1. Open source license of the extension code is [GPL-3.0](LICENSE). Bundled dictionary data is covered separately; see [DATA_SOURCE.md](DATA_SOURCE.md).

## Author

[Wushuai](https://github.com/wushuaibuaa)
