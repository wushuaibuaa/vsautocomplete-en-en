# Changelog

## 0.4.0

### Added

- Build-time form index covering plurals, past/gerund forms, comparatives, common irregulars, contractions and pronouns; hover now resolves `children`, `studies`, `known` and similar forms.
- Context-aware suppression: Markdown frontmatter, inline code, fenced code, link targets; LaTeX comments, math and command names; URLs and emails.
- Frequency-based completion ranking from a SUBTLEX-derived word list (build-time only); common words such as `the`, `still`, `stop` surface first.

### Changed

- Hover resolution is now exact headword → form index; the previous `s`/`es`/`ed` suffix guessing was removed.
- Word extraction keeps apostrophes and hyphens, so `don't` and `well-known` are treated as one token.
- Dictionary chunks and form chunks are written as compact JSON.

### Fixed

- Hover no longer mis-resolves typos such as `ted` or `don't` to the single-letter entry `t`.
- Hover inside quoted strings, code, frontmatter and math is suppressed consistently.

## 0.3.1

- Release build: regenerated the cleaned dictionary chunks (37,903 headwords / 43,396 senses) and packaged the VSIX.
- No code changes since 0.3.0.

## 0.3.0

### Added

- Per-letter dictionary chunks loaded on demand and indexed with a trie.
- Settings: `englishWordHint.enabled`, `englishWordHint.minPrefixLength`, `englishWordHint.maxResults`.
- Markdown quick suggestions enabled by default through `contributes.configurationDefaults`.
- Unit and integration tests (`node:test`) plus a GitHub Actions CI workflow.
- Data cleaning and sense-merging build pipeline with a sanity guard.

### Changed

- Duplicate headwords are merged into a single entry with all senses; completion shows one item per headword.
- Suggestions require a minimum prefix, are capped, and are ranked shortest-first.
- Hover and completion documentation use `MarkdownString` with per-sense truncation.
- The trie cache is LRU-limited (5 chunks) and concurrent loads of one chunk are deduplicated.
- Generated chunks are build artifacts and are no longer committed.
- Minimum VS Code version raised to 1.75.

### Fixed

- `useage` / `usage` field mismatch that made usage text disappear.
- Invalid `CompletionItem.usage` assignment removed.
- Failed chunk loads no longer cache an empty trie forever; errors are logged to the "English Word Hint" output channel.
- Hover no longer returns an invalid empty array inside quoted strings.

## 0.2.0

- Unreleased working version with per-letter chunk loading.

## 0.1.6

- Last upstream release.
