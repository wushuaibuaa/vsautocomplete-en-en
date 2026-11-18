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

function documentFor(line, languageId) {
    return {
        languageId: languageId || 'markdown',
        lineCount: 1,
        lineAt() {
            return { text: line };
        }
    };
}

function documentFromLines(lines, languageId) {
    return {
        languageId: languageId || 'markdown',
        lineCount: lines.length,
        lineAt(target) {
            const index = typeof target === 'number' ? target : target.line;
            return { text: lines[index] || '' };
        }
    };
}

function completeOn(document, line, character) {
    return completionProvider.provideCompletionItems(document, new vscode.Position(line, character));
}

function hoverOn(document, line, character) {
    return hoverProvider.provideHover(document, new vscode.Position(line, character));
}

function complete(line) {
    return completeOn(documentFor(line), 0, line.length);
}

function hover(line) {
    return hoverOn(documentFor(line), 0, line.length);
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

test('suggestions are capped and marked incomplete', async () => {
    const list = await complete('st');
    assert.equal(list.items.length, 100);
    assert.equal(list.isIncomplete, true);
    for (let index = 1; index < list.items.length; index++) {
        assert.ok(list.items[index - 1].sortText < list.items[index].sortText);
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

test('frequency ranks common words first', async () => {
    const list = await complete('th');
    assert.equal(list.items[0].label, 'the');
});

test('hover resolves inflected forms through the form index', async () => {
    for (const [form, base] of [['children', 'child'], ['studies', 'study'], ['known', 'know']]) {
        const result = await hover(form);
        assert.ok(result, `${form} should resolve`);
        assert.ok(
            result.contents.value.startsWith(`**${base}**`),
            `${form} should resolve to ${base}, got ${result.contents.value.slice(0, 30)}`
        );
    }
    assert.equal(await hover('ted'), null);
    const contraction = await hover("don't");
    assert.ok(contraction);
    assert.ok(contraction.contents.value.startsWith("**don't**"));
});

test('context suppression skips markdown code, frontmatter and latex math', async () => {
    const inline = documentFor('use `children` here');
    assert.equal((await completeOn(inline, 0, 8)).length, 0);
    assert.equal(await hoverOn(inline, 0, 8), null);

    const fenced = documentFromLines(['```', 'children', '```']);
    assert.equal((await completeOn(fenced, 1, 8)).length, 0);
    assert.equal(await hoverOn(fenced, 1, 8), null);

    const frontmatter = documentFromLines(['---', 'title: children', '---', 'body children']);
    assert.equal(await hoverOn(frontmatter, 1, 15), null);
    assert.ok(await hoverOn(frontmatter, 3, 13));

    const math = documentFor('$children$', 'latex');
    assert.equal(await hoverOn(math, 0, 6), null);

    const command = documentFor('\\section', 'latex');
    assert.equal((await completeOn(command, 0, 4)).length, 0);
});

test('completion and hover toggles are independent', async () => {
    try {
        state.settings['englishWordHint.completionEnabled'] = false;
        const disabledCompletion = await complete('st');
        assert.ok(Array.isArray(disabledCompletion));
        assert.equal(disabledCompletion.length, 0);
        assert.ok(await hover('have'));
        state.settings['englishWordHint.completionEnabled'] = true;

        state.settings['englishWordHint.hoverEnabled'] = false;
        assert.ok((await complete('st')).items.length > 0);
        assert.equal(await hover('have'), null);
    } finally {
        delete state.settings['englishWordHint.completionEnabled'];
        delete state.settings['englishWordHint.hoverEnabled'];
    }
});

test('language setting gates providers', async () => {
    try {
        state.settings['englishWordHint.languages'] = ['latex'];
        assert.equal((await complete('st')).length, 0);
        assert.equal(await hover('have'), null);
        assert.ok(await hoverOn(documentFor('children', 'latex'), 0, 8));
    } finally {
        delete state.settings['englishWordHint.languages'];
    }
});

test('user words and ignored words affect completion and hover', async () => {
    try {
        state.settings['englishWordHint.userWords'] = ['xyzzyword'];
        const list = await complete('xyzz');
        assert.equal(list.items[0].label, 'xyzzyword');
        assert.ok(await hover('xyzzyword'));

        state.settings['englishWordHint.ignoredWords'] = ['xyzzyword', 'have'];
        assert.equal((await complete('xyzz')).items.length, 0);
        assert.equal(await hover('xyzzyword'), null);
        assert.equal(await hover('have'), null);
    } finally {
        delete state.settings['englishWordHint.userWords'];
        delete state.settings['englishWordHint.ignoredWords'];
    }
});

test('multiword completions insert spaces', async () => {
    const list = await complete('commander');
    const item = list.items.find(candidate => candidate.label === 'commander-in-chief');
    assert.ok(item, 'commander-in-chief should be suggested');
    assert.equal(item.insertText, 'commander in chief');
    assert.equal(item.kind, vscode.CompletionItemKind.Text);
});

test('commands update settings and open the full entry', async () => {
    state.activeTextEditor = {
        document: documentFor('children'),
        selection: { active: new vscode.Position(0, 8) }
    };
    try {
        await state.commands['englishWordHint.addUserWord']();
        assert.deepEqual(state.settings['englishWordHint.userWords'], ['children']);

        state.openedDocuments.length = 0;
        await state.commands['englishWordHint.showFullEntry']();
        assert.equal(state.openedDocuments.length, 1);
        assert.match(state.openedDocuments[0].document.content, /^# child/);

        await state.commands['englishWordHint.ignoreWord']();
        assert.deepEqual(state.settings['englishWordHint.ignoredWords'], ['children']);
    } finally {
        state.activeTextEditor = null;
        delete state.settings['englishWordHint.userWords'];
        delete state.settings['englishWordHint.ignoredWords'];
        state.openedDocuments.length = 0;
        state.messages.length = 0;
    }
});

test('quoted strings are ignored', async () => {
    const list = await complete('"it\'s st');
    assert.ok(Array.isArray(list));
    assert.equal(list.length, 0);
    assert.equal(await hover('"it\'s have'), null);
});
