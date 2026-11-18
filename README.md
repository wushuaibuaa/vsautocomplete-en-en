# English Word Hint

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/wushuaiBUAA.autocomplete-english-word?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=wushuaiBUAA.autocomplete-english-word)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/wushuaiBUAA.autocomplete-english-word)](https://marketplace.visualstudio.com/items?itemName=wushuaiBUAA.autocomplete-english-word)
[![CI](https://github.com/wushuaibuaa/vsautocomplete-en-en/actions/workflows/ci.yml/badge.svg)](https://github.com/wushuaibuaa/vsautocomplete-en-en/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/LICENSE)

English word completion and instant definitions for **Markdown**, **LaTeX** and **plain text**. Runs fully offline, with no telemetry and no runtime dependencies.

## Features

- **Frequency-ranked completion** — suggestions start after 2 characters, are capped at 100 by default, and put common words first (`th` → `the`, `that`, `this`, …).
- **One entry per headword** — duplicate dictionary senses are merged; `have` is one suggestion with all 15 senses instead of 15 copies.
- **Definitions on hover** — shows the phonetic gloss and up to six senses; use **Show Full Entry** for the full stored entry.
- **Inflected-form lookup** — `children` → `child`, `studies` → `study`, `known` → `know`, contractions and pronouns included.
- **Context aware** — no suggestions or hover inside quoted strings, Markdown frontmatter/code/link targets, LaTeX comments/math/commands, URLs or emails.
- **Case-insensitive matching** — typing `apple` finds `Apple`; exact case wins when both exist.
- **Multiword headwords insert naturally** — `commander-in-chief` inserts `commander in chief`, while `well-known` stays hyphenated.
- **Your own words** — add words to a user dictionary or hide words you never want to see, from the editor context menu.
- **Configurable** — independent completion/hover switches, language list, minimum prefix and result cap.

## Installation

### From the Marketplace

1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for **English word hint** and install it:
   <https://marketplace.visualstudio.com/items?itemName=wushuaiBUAA.autocomplete-english-word>

### From a VSIX

```bash
code --install-extension /path/to/extension-0.4.1.vsix
```

Requires **VS Code 1.75 or newer**.

## Quick start

1. Open a Markdown, LaTeX or plain-text file and start typing an English word.
2. Pick a suggestion; its definition appears in the suggestion details.
3. Hover any word to see its definition.
4. Right-click a word for **Show Full Entry**, **Add Word to User Dictionary** or **Ignore Word**.

Quick suggestions are enabled for Markdown and plain text by default through `configurationDefaults`. If you have explicitly disabled them, re-enable them:

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

## Commands

| Command | ID | Description |
| --- | --- | --- |
| English Word Hint: Show Full Entry | `englishWordHint.showFullEntry` | Opens all stored senses of the word under the cursor in a Markdown document. |
| English Word Hint: Add Word to User Dictionary | `englishWordHint.addUserWord` | Adds the word under the cursor to `englishWordHint.userWords` (user settings). |
| English Word Hint: Ignore Word | `englishWordHint.ignoreWord` | Adds the word under the cursor to `englishWordHint.ignoredWords` (user settings). |

All three are available from the editor context menu in supported languages and from the Command Palette.

## How it works

1. **Build time** (`npm run build`) — `hint_data/words.json` is cleaned, duplicate senses are merged, frequency ranks are joined from a SUBTLEX-derived list, and the result is written as per-letter chunks. A form index (plurals, past/gerund, irregulars, contractions, pronouns) is generated alongside it.
2. **Runtime** — only the letter chunk needed for the current prefix is loaded and indexed with a trie; an LRU cache keeps the five most recent letters. Form chunks load on demand for hover.
3. **Rendering** — suggestions are filtered by context, ranked by frequency, capped, and rendered with `MarkdownString` so dictionary text is escaped safely.

The dictionary currently contains about **38,000 headwords / 43,000 senses** and about **90,000 generated word forms**. Generated data is not committed; run `npm run build` after cloning.

## Data and licensing

- Extension **code**: [GPL-3.0](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/LICENSE).
- Bundled **dictionary text**: covered separately — the current data is inherited from the upstream project and is not licensed by GPL-3.0. Read [DATA_SOURCE.md](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/DATA_SOURCE.md) before redistributing or publishing.
- **Frequency ranks**: derived from [`subtlex-word-frequencies`](https://www.npmjs.com/package/subtlex-word-frequencies) (ISC); attribution in [THIRD_PARTY_NOTICES.md](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/THIRD_PARTY_NOTICES.md).

## Privacy

The extension runs entirely locally: it reads JSON files shipped with the extension and never sends text, words or telemetry anywhere. The user-dictionary and ignore-list commands write to your VS Code settings.

## Development

Requirements: **Node.js 20+**, npm, and VS Code 1.75+.

```bash
npm install
npm run build     # clean words.json, join frequency ranks, write chunks + form index
npm test          # runs the build (pretest), then unit + integration tests
npm run package   # produce a .vsix (vscode:prepublish runs the build)
```

Project layout:

```text
extension/main.js            VS Code glue: providers, caches, settings, commands, logging
lib/trie.js                  Trie (case-insensitive, exact-case preference)
lib/word-text.js             senses, truncation, ranking, insert text, full-entry rendering
lib/context.js               Markdown/LaTeX/URL context suppression and word extraction
scripts/split-words.js       build: clean, merge, rank, split, form index
scripts/lib/clean-headword.js  headword cleaning rules
scripts/lib/word-forms.js    inflection and irregular-form generation
test/                        node:test unit + integration tests
test-support/                minimal vscode API stub used by integration tests
hint_data/words.json         dictionary source (build input, excluded from the VSIX)
hint_data/[a-z].json         generated per-letter chunks (included in the VSIX)
hint_data/forms/             generated form index (included in the VSIX)
```

The test suite covers the trie, context rules, form generation, ranking, settings, user/ignored words, commands and cache/load-failure behavior. CI runs `npm ci && npm test` and packages the extension on every push.

### Releasing

```bash
# bump the version and update CHANGELOG.md first
npx vsce login wushuaiBUAA
npx vsce publish --packagePath extension-0.4.1.vsix
```

## Known limitations

- Supported language IDs are **markdown**, **latex** and **plaintext**; arbitrary languages would need a broader activation strategy.
- Form generation is rule-based; it may generate non-words, which are only used as a fallback when an exact headword is missing.
- Multiword spacing uses a function-word heuristic; some dictionary phrasings (for example `go-back`) remain hyphenated.
- Hover is intentionally capped (six senses, 600 characters each); use **Show Full Entry** for the full stored entry.
- The bundled dictionary's licensing is unresolved; see [DATA_SOURCE.md](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/DATA_SOURCE.md).

## Contributing

Issues and pull requests are welcome at <https://github.com/wushuaibuaa/vsautocomplete-en-en>. Run `npm test` before submitting; changes to the data pipeline should include the build summary and updated tests.

See [CHANGELOG.md](https://github.com/wushuaibuaa/vsautocomplete-en-en/blob/master/CHANGELOG.md) for release notes.

## Author

[Wushuai](https://github.com/wushuaibuaa)
