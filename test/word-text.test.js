const test = require('node:test');
const assert = require('node:assert/strict');
const { getSenses, truncate, compareWords, rankOf, isMultiword, insertTextFor, buildFullEntry } = require('../lib/word-text');

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

test('compareWords ranks frequent words first', () => {
    const words = [
        { name: 'strabismus' },
        { name: 'star', rank: 899 },
        { name: 'st', rank: 2 },
        { name: 'start', rank: 500 }
    ];
    assert.deepEqual(words.sort(compareWords).map(word => word.name), ['st', 'start', 'star', 'strabismus']);
});

test('compareWords falls back to length then alphabet for unranked words', () => {
    const words = [{ name: 'bb' }, { name: 'a' }, { name: 'ab' }, { name: 'aa' }];
    assert.deepEqual(words.sort(compareWords).map(word => word.name), ['a', 'aa', 'ab', 'bb']);
});

test('rankOf treats missing ranks as lowest priority', () => {
    assert.equal(rankOf({ rank: 0 }), 0);
    assert.equal(rankOf({}), Number.MAX_SAFE_INTEGER);
    assert.equal(rankOf({ rank: '3' }), Number.MAX_SAFE_INTEGER);
});

test('multiword entries insert spaces while compounds stay hyphenated', () => {
    assert.equal(isMultiword('commander-in-chief'), true);
    assert.equal(insertTextFor('commander-in-chief'), 'commander in chief');
    assert.equal(insertTextFor('the-United-Kingdom'), 'the United Kingdom');
    assert.equal(insertTextFor('well-known'), 'well-known');
    assert.equal(insertTextFor('A-OK'), 'A-OK');
});

test('buildFullEntry renders every sense', () => {
    const text = buildFullEntry({
        name: 'have',
        set: 'phonetic',
        senses: [{ desc: 'one', usage: 'u1' }, { desc: 'two' }]
    });
    assert.match(text, /^# have/);
    assert.match(text, /## 1/);
    assert.match(text, /## 2/);
    assert.match(text, /u1/);
});
