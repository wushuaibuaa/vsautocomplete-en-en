const test = require('node:test');
const assert = require('node:assert/strict');
const {
    shouldSuppress,
    getWordAtCursor,
    getCompletionPrefix
} = require('../lib/context');

function options(lineText, character, languageId, lines, lineIndex) {
    const all = lines || [lineText];
    return {
        lineText,
        character,
        languageId: languageId || '',
        lineIndex: lineIndex || 0,
        lineAt: index => all[index]
    };
}

test('getWordAtCursor keeps apostrophes and hyphens', () => {
    assert.equal(getWordAtCursor("don't", 5), "don't");
    assert.equal(getWordAtCursor('don’t', 5), "don't");
    assert.equal(getWordAtCursor('well-known', 10), 'well-known');
    assert.equal(getWordAtCursor('word-', 5), 'word');
    assert.equal(getWordAtCursor("'quoted'", 8), 'quoted');
});

test('getCompletionPrefix only returns the trailing letters', () => {
    assert.equal(getCompletionPrefix('abc', 3), 'abc');
    assert.equal(getCompletionPrefix('well-k', 6), 'k');
    assert.equal(getCompletionPrefix('a-', 2), '');
});

test('suppresses inside quoted strings but not inside apostrophes', () => {
    assert.equal(shouldSuppress(options('"hello', 6, 'markdown')), true);
    assert.equal(shouldSuppress(options("don't", 5, 'markdown')), false);
    assert.equal(shouldSuppress(options("He said 'hi", 11, 'markdown')), true);
});

test('suppresses URLs and emails', () => {
    assert.equal(shouldSuppress(options('see https://example.com/x', 15, 'markdown')), true);
    assert.equal(shouldSuppress(options('mail me@example.com', 13, 'markdown')), true);
    assert.equal(shouldSuppress(options('email me', 5, 'markdown')), false);
});

test('suppresses markdown inline code', () => {
    const line = 'use `child` here';
    assert.equal(shouldSuppress(options(line, 7, 'markdown')), true);
    assert.equal(shouldSuppress(options(line, 0, 'markdown')), false);
});

test('suppresses markdown fenced code blocks', () => {
    const lines = ['```js', 'const child = 1', '```', 'after child'];
    assert.equal(shouldSuppress(options(lines[1], 8, 'markdown', lines, 1)), true);
    assert.equal(shouldSuppress(options(lines[3], 8, 'markdown', lines, 3)), false);
});

test('suppresses markdown frontmatter', () => {
    const lines = ['---', 'title: child', '---', 'body child'];
    assert.equal(shouldSuppress(options(lines[1], 8, 'markdown', lines, 1)), true);
    assert.equal(shouldSuppress(options(lines[3], 8, 'markdown', lines, 3)), false);
});

test('suppresses markdown link targets', () => {
    const line = '[x](child)';
    assert.equal(shouldSuppress(options(line, 7, 'markdown')), true);
});

test('suppresses latex math, commands and comments', () => {
    assert.equal(shouldSuppress(options('$child$', 3, 'latex')), true);
    assert.equal(shouldSuppress(options('\\(child\\)', 4, 'latex')), true);
    assert.equal(shouldSuppress(options('\\[child\\]', 4, 'latex')), true);
    assert.equal(shouldSuppress(options('\\section', 4, 'latex')), true);
    assert.equal(shouldSuppress(options('% child', 4, 'latex')), true);
});

test('suppresses multiline latex math environments', () => {
    const lines = ['\\begin{equation}', 'x = child', '\\end{equation}', 'after child'];
    assert.equal(shouldSuppress(options(lines[1], 7, 'latex', lines, 1)), true);
    assert.equal(shouldSuppress(options(lines[3], 8, 'latex', lines, 3)), false);
});

test('normal prose is not suppressed', () => {
    assert.equal(shouldSuppress(options('a normal sentence about children', 28, 'markdown')), false);
    assert.equal(shouldSuppress(options('a normal sentence', 8, 'latex')), false);
    assert.equal(shouldSuppress(options('a normal sentence', 8, '')), false);
});
