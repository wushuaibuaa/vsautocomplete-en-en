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
    updatedSettings: [],
    outputLines: [],
    messages: [],
    openedDocuments: [],
    commands: {},
    activeTextEditor: null,
    registered: { completion: [], hover: [] }
};

const windowApi = {
    createOutputChannel(name) {
        return {
            name,
            appendLine(line) { state.outputLines.push(line); },
            dispose() {}
        };
    },
    showInformationMessage(message) {
        state.messages.push(message);
    },
    showTextDocument(document, options) {
        state.openedDocuments.push({ document, options });
        return document;
    },
    get activeTextEditor() {
        return state.activeTextEditor;
    }
};

module.exports = {
    Position,
    Range,
    CompletionItem,
    CompletionList,
    Hover,
    MarkdownString,
    CompletionItemKind: { Function: 2, Text: 1 },
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
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
    commands: {
        registerCommand(name, handler) {
            state.commands[name] = handler;
            return { dispose() {} };
        }
    },
    workspace: {
        getConfiguration(section) {
            return {
                get(key, fallback) {
                    const full = section ? `${section}.${key}` : key;
                    return state.settings[full] !== undefined ? state.settings[full] : fallback;
                },
                update(key, value, target) {
                    const full = section ? `${section}.${key}` : key;
                    state.settings[full] = value;
                    state.updatedSettings.push({ key: full, value, target });
                }
            };
        },
        openTextDocument(options) {
            return options;
        }
    },
    window: windowApi,
    __state: state
};
