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

## Declaration

1. Open source license of this extension is [GPL-3.0](LICENSE)

## Contributing to the Extension

File description:

- `extension/main.js` extension main script files
- `hint_data/words.json` hint data json file from Oxford dictionary.
- `split_words.js` build script that splits `words.json` into `hint_data/a.json` … `hint_data/z.json` for lazy loading.

## Development

```bash
npm install
npm run build   # generate hint_data/a-z.json from hint_data/words.json
```

Then press `F5` to launch the Extension Development Host. `vsce package` runs `npm run build` automatically through `vscode:prepublish`, and the generated chunks are the only hint data included in the VSIX.

## Author

[Wushuai](https://github.com/wushuaibuaa)
