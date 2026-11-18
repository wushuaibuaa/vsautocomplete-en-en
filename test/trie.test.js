const test = require('node:test');
const assert = require('node:assert/strict');
const { Trie } = require('../lib/trie');

test('search returns every word sharing the prefix', () => {
    const trie = new Trie();
    ['star', 'start', 'stark', 'stop', 'a'].forEach(name => trie.insert({ name }));
    assert.deepEqual(
        trie.search('st').map(word => word.name).sort(),
        ['star', 'stark', 'start', 'stop']
    );
    assert.deepEqual(trie.search('zzz'), []);
});

test('find returns exact matches only', () => {
    const trie = new Trie();
    ['star', 'start'].forEach(name => trie.insert({ name }));
    assert.equal(trie.find('start').name, 'start');
    assert.equal(trie.find('sta'), null);
    assert.equal(trie.find('nope'), null);
});

test('search result is the node word list, not a copy', () => {
    const trie = new Trie();
    trie.insert({ name: 'star' });
    const first = trie.search('st');
    first.push({ name: 'injected' });
    assert.ok(trie.search('st').some(word => word.name === 'injected'));
});
