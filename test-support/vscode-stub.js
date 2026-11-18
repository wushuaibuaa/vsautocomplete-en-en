class Position {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}

class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

class CompletionItem {
    constructor(label, kind) {
        this.label = label;
        this.kind = kind;
    }
}

class CompletionList {
    constructor(items, isIncomplete) {
        this.items = items;
        this.isIncomplete = isIncomplete;
    }
}

class Hover {
    constructor(contents) {
        this.contents = contents;
    }
}

class MarkdownString {
    constructor(value) {
        this.value = value || '';
        this.appendTextCalls = 0;
    }
    appendText(text) {
        this.appendTextCalls++;
        this.value += text;
        return this;
    }
    appendMarkdown(markdown) {
        this.value += markdown;
        return this;
    }
}

const state = {
    settings: {},
    outputLines: [],
    registered: { completion: [], hover: [] }
};

module.exports = {
    Position,
    Range,
    CompletionItem,
    CompletionList,
    Hover,
    MarkdownString,
    CompletionItemKind: { Function: 2, Text: 1 },
    languages: {
        registerCompletionItemProvider(selector, provider) {
            state.registered.completion.push({ selector, provider });
            return { dispose() {} };
        },
        registerHoverProvider(selector, provider) {
            state.registered.hover.push({ selector, provider });
            return { dispose() {} };
        }
    },
    workspace: {
        getConfiguration(section) {
            return {
                get(key, fallback) {
                    const full = section ? `${section}.${key}` : key;
                    return state.settings[full] !== undefined ? state.settings[full] : fallback;
                }
            };
        }
    },
    window: {
        createOutputChannel(name) {
            return {
                name,
                appendLine(line) { state.outputLines.push(line); },
                dispose() {}
            };
        }
    },
    __state: state
};
