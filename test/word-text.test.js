const test = require('node:test');
const assert = require('node:assert/strict');
const { getSenses, truncate, compareWords, getHoverCandidates } = require('../lib/word-text');

test('getSenses prefers the merged senses array', () => {
    const senses = [{ desc: 'first', usage: '' }];
    assert.equal(getSenses({ senses }), senses);
});

test('getSenses falls back to legacy flat fields', () => {
    assert.deepEqual(getSenses({ desc: 'plain' }), [{ desc: 'plain', usage: '' }]);
    assert.deepEqual(getSenses({ desc: 'legacy', useage: 'old usage' }), [{ desc: 'legacy', usage: 'old usage' }]);
    assert.deepEqual(getSenses({ desc: 'new', usage: 'new usage' }), [{ desc: 'new', usage: 'new usage' }]);
});

test('truncate trims whitespace and appends an ellipsis only when needed', () => {
    assert.equal(truncate('  short  ', 20), 'short');
    assert.equal(truncate('abcdefghij', 5), 'abcde…');
    assert.equal(truncate('ab   ', 5), 'ab');
    assert.equal(truncate(null, 5), '');
});

test('compareWords orders by length then alphabetically', () => {
    const words = [{ name: 'bb' }, { name: 'a' }, { name: 'ab' }, { name: 'aa' }];
    assert.deepEqual(words.sort(compareWords).map(word => word.name), ['a', 'aa', 'ab', 'bb']);
});

test('getHoverCandidates covers case and plural/past forms', () => {
    assert.ok(getHoverCandidates('Have').includes('have'));
    assert.ok(getHoverCandidates('drills').includes('drill'));
    assert.ok(getHoverCandidates('drilled').includes('drill'));
    assert.ok(getHoverCandidates('boxes').includes('box'));
    assert.deepEqual(getHoverCandidates(''), []);
});
