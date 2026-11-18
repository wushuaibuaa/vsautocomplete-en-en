const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadExtension, vscode } = require('../test-support/load-extension');

const extension = loadExtension();
extension.activate({ subscriptions: [] });
const state = vscode.__state;
const completionProvider = state.registered.completion[0].provider;
const hoverProvider = state.registered.hover[0].provider;

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

function hover(line) {
    return hoverProvider.provideHover(documentFor(line), new vscode.Position(0, line.length));
}

function readChunk(letter) {
    const file = path.join(__dirname, '..', 'hint_data', `${letter}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('built chunks exist', () => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'hint_data', 's.json')), 'run npm run build first');
});

test('short prefixes are suppressed and marked incomplete', async () => {
    const list = await complete('a');
    assert.equal(list.items.length, 0);
    assert.equal(list.isIncomplete, true);
});

test('suggestions are capped, ranked and marked incomplete', async () => {
    const list = await complete('st');
    assert.equal(list.items.length, 100);
    assert.equal(list.isIncomplete, true);
    for (let index = 1; index < list.items.length; index++) {
        const previous = list.items[index - 1];
        const current = list.items[index];
        assert.ok(previous.sortText < current.sortText);
        assert.ok(previous.label.length <= current.label.length);
        if (previous.label.length === current.label.length) {
            assert.ok(previous.label <= current.label);
        }
    }
});

test('duplicate senses merge into one completion item', async () => {
    const have = readChunk('h').find(word => word.name === 'have');
    assert.ok(have.senses.length > 1);
    const list = await complete('have');
    const items = list.items.filter(item => item.label === 'have');
    assert.equal(items.length, 1);
    assert.ok(items[0].documentation instanceof vscode.MarkdownString);
    assert.match(items[0].documentation.value, new RegExp(`共 ${have.senses.length} 条释义`));
});

test('hover shows merged senses with a remainder note', async () => {
    const have = readChunk('h').find(word => word.name === 'have');
    assert.ok(have.senses.length > 6);
    const result = await hover('have');
    assert.ok(result instanceof vscode.Hover);
    const markdown = result.contents;
    assert.ok(markdown instanceof vscode.MarkdownString);
    assert.ok(markdown.value.startsWith('**have**'));
    assert.match(markdown.value, new RegExp(`还有 ${have.senses.length - 6} 条释义未显示`));
    assert.ok(markdown.appendTextCalls >= 6);
});

test('settings control prefix length, result count and enabled state', async () => {
    try {
        state.settings['englishWordHint.minPrefixLength'] = 3;
        const suppressed = await complete('st');
        assert.equal(suppressed.items.length, 0);
        assert.equal(suppressed.isIncomplete, true);
        state.settings['englishWordHint.minPrefixLength'] = 2;

        state.settings['englishWordHint.maxResults'] = 5;
        const limited = await complete('st');
        assert.equal(limited.items.length, 5);
        assert.equal(limited.isIncomplete, true);
        state.settings['englishWordHint.maxResults'] = 100;

        state.settings['englishWordHint.enabled'] = false;
        const disabled = await complete('st');
        assert.ok(Array.isArray(disabled));
        assert.equal(disabled.length, 0);
        assert.equal(await hover('have'), null);
        state.settings['englishWordHint.enabled'] = true;
    } finally {
        delete state.settings['englishWordHint.minPrefixLength'];
        delete state.settings['englishWordHint.maxResults'];
        delete state.settings['englishWordHint.enabled'];
    }
});

test('quoted strings are ignored', async () => {
    const list = await complete('"it\'s st');
    assert.ok(Array.isArray(list));
    assert.equal(list.length, 0);
    assert.equal(await hover('"it\'s have'), null);
});
