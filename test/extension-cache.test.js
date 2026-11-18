const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadExtension, vscode } = require('../test-support/load-extension');

const extension = loadExtension();
extension.activate({ subscriptions: [] });
const state = vscode.__state;
const completionProvider = state.registered.completion[0].provider;

function documentFor(line) {
    return {
        getText(range) {
            return line.slice(range.start.character, range.end.character);
        },
        lineAt() {
            return { text: line };
        }
    };
}

function complete(line) {
    return completionProvider.provideCompletionItems(documentFor(line), new vscode.Position(0, line.length));
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('concurrent requests for the same chunk read it once', async () => {
    const originalReadFile = fs.promises.readFile.bind(fs.promises);
    const reads = [];
    fs.promises.readFile = async (file, encoding) => {
        reads.push(String(file));
        await sleep(20);
        return originalReadFile(file, encoding);
    };
    try {
        const [first, second] = await Promise.all([complete('qu'), complete('qu')]);
        assert.equal(first.items.length, second.items.length);
        assert.equal(reads.filter(file => file.endsWith('q.json')).length, 1);
    } finally {
        fs.promises.readFile = originalReadFile;
    }
});

test('trie cache evicts least recently used chunks', async () => {
    const originalReadFile = fs.promises.readFile.bind(fs.promises);
    const reads = [];
    fs.promises.readFile = async (file, encoding) => {
        reads.push(String(file));
        return originalReadFile(file, encoding);
    };
    try {
        for (const prefix of ['aa', 'bb', 'cc', 'dd', 'ee', 'ff']) await complete(prefix);
        assert.equal(reads.filter(file => file.endsWith('a.json')).length, 1);
        await complete('aa');
        assert.equal(reads.filter(file => file.endsWith('a.json')).length, 2);
    } finally {
        fs.promises.readFile = originalReadFile;
    }
});

test('chunk load failures are logged and retried', async () => {
    const originalReadFile = fs.promises.readFile.bind(fs.promises);
    fs.promises.readFile = async (file, encoding) => {
        if (String(file).endsWith('y.json')) throw new Error('simulated missing chunk');
        return originalReadFile(file, encoding);
    };
    try {
        const failed = await complete('yz');
        assert.equal(failed.items.length, 0);
        assert.ok(state.outputLines.some(line => line.includes('无法加载词典分片 y.json')));
    } finally {
        fs.promises.readFile = originalReadFile;
    }
    const retried = await complete('yz');
    assert.equal(retried.items.length, 0);
});
