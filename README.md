# English word hint (auto-completion) for Visual Studio Code


## Installation

1. Press Ctrl+Shift+X to open the Extensions tab
2. Type **English word hint** to find the extension
3. Click the Install button, then the Enable button

## Hint Support

1. When editing a **markdown** file and **latex** file in Code with **English word hint** installed, any type of English words will trigger a hint of word and give the explanation.
2. Suggestions appear after at least **2 characters** and return at most **100** candidates, shortest words first.


## Usage

Because the markdown does not support quick suggestions in default. Therefore, the hint will not appear when type in markdown file. Below configure should be set by user.

```json
"[markdown]": {
        "editor.quickSuggestions": true
    }
```

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
