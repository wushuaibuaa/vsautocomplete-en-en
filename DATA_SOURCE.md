# Dictionary data source and licensing

## Current data

`hint_data/words.json` is inherited from the upstream project, and the upstream README describes it as Oxford dictionary content. Each record looks like:

```json
{ "name": "word", "set": "phonetic or short gloss", "useage": "", "desc": "definition text" }
```

`scripts/split-words.js` cleans headwords, merges duplicate senses and writes `hint_data/[a-z].json`. The original `words.json` is kept only as build input (`npm run build`).

## Licensing risk

- The extension **code** is GPL-3.0 (see `LICENSE`).
- That license does **not** grant rights to the dictionary text.
- Redistributing this data (including inside a marketplace package) may therefore infringe the publisher's rights, even though the code is open source.

This is not legal advice. Before publishing or redistributing:

1. Replace the data with a dataset whose license permits redistribution, or
2. Obtain an explicit license from the data owner, or
3. Ship without data and let users supply their own `hint_data/words.json`.

## Replacement candidates (verify the current license yourself)

- **ECDICT** — Chinese-English dictionary with a permissive license; check the repository license and attribution requirements.
- **WordNet 3.0** — Princeton WordNet License; English definitions.
- **Moby Word Lists / Moby Thesaurus** — public domain.
- **Wiktionary dumps** — CC BY-SA; attribution and share-alike obligations apply.

## Drop-in schema

Keep the source file shape so the build keeps working:

```json
[
  { "name": "example", "set": "short gloss or phonetic", "useage": "", "desc": "definition" }
]
```

`useage` is the historical (misspelled) field name used by the upstream data; the build also accepts `usage`. After replacing the file run:

```bash
npm run build
npm test
```

## Frequency data

Completion ranking uses a SUBTLEX-derived frequency list provided by the [`subtlex-word-frequencies`](https://www.npmjs.com/package/subtlex-word-frequencies) package (ISC license, 74,286 entries). It is a development dependency used only by `npm run build`; the package itself is not included in the VSIX. Only numeric ranks derived from the list are written into the generated chunks. Attribution is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
