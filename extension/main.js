const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { Trie } = require('../lib/trie');
const { getSenses, truncate, compareWords, insertTextFor, buildFullEntry } = require('../lib/word-text');
const { shouldSuppress, getWordAtCursor, getCompletionPrefix } = require('../lib/context');

const HINT_DATA_DIR = path.join(__dirname, '../hint_data');
const FORMS_DIR = path.join(HINT_DATA_DIR, 'forms');
const DOCUMENT_SELECTOR = ['markdown', 'latex', 'plaintext'];
const DEFAULT_LANGUAGES = ['markdown', 'latex', 'plaintext'];
const CONFIG_SECTION = 'englishWordHint';

// 少于该长度的前缀不触发补全（单字母会命中数千条，淹没候选列表）
const DEFAULT_MIN_PREFIX_LENGTH = 2;
// 单次返回的最大候选数，超出的部分通过 isIncomplete 让 VS Code 继续输入时重新请求
const DEFAULT_MAX_RESULTS = 100;
const MAX_RESULTS_LIMIT = 1000;
const MAX_CACHED_TRIES = 5;
const MAX_COMPLETION_CACHE = 100;
const MAX_COMPLETION_DOC_CHARS = 400;
const MAX_HOVER_SENSES = 6;
const MAX_HOVER_CHARS_PER_SENSE = 600;

const trieChunkCache = new Map();
const trieLoading = new Map();
const formsCache = new Map();
const formsLoading = new Map();
const completionCache = new Map();
let outputChannel;

function logError(message, error) {
    if (!outputChannel) outputChannel = vscode.window.createOutputChannel('English Word Hint');
    const detail = error ? `: ${error.stack || error.message || error}` : '';
    outputChannel.appendLine(`[${new Date().toISOString()}] ${message}${detail}`);
}

function getConfig() {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const minPrefixLength = Number(config.get('minPrefixLength', DEFAULT_MIN_PREFIX_LENGTH));
    const maxResults = Number(config.get('maxResults', DEFAULT_MAX_RESULTS));
    const languages = config.get('languages', DEFAULT_LANGUAGES);
    const userWords = config.get('userWords', []);
    const ignoredWords = config.get('ignoredWords', []);
    return {
        enabled: config.get('enabled', true) !== false,
        completionEnabled: config.get('completionEnabled', true) !== false,
        hoverEnabled: config.get('hoverEnabled', true) !== false,
        languages: Array.isArray(languages)
            ? languages.filter(language => typeof language === 'string')
            : DEFAULT_LANGUAGES,
        userWords: Array.isArray(userWords)
            ? userWords.filter(word => typeof word === 'string' && word.trim()).map(word => word.trim())
            : [],
        ignoredWords: Array.isArray(ignoredWords)
            ? ignoredWords.filter(word => typeof word === 'string' && word.trim()).map(word => word.trim())
            : [],
        minPrefixLength: Number.isFinite(minPrefixLength) && minPrefixLength >= 1 ? minPrefixLength : DEFAULT_MIN_PREFIX_LENGTH,
        maxResults: Number.isFinite(maxResults) && maxResults >= 1 ? Math.min(maxResults, MAX_RESULTS_LIMIT) : DEFAULT_MAX_RESULTS
    };
}

function getCachedTrie(letter) {
    const trie = trieChunkCache.get(letter);
    if (!trie) return null;
    trieChunkCache.delete(letter);
    trieChunkCache.set(letter, trie);
    return trie;
}

function cacheTrie(letter, trie) {
    trieChunkCache.set(letter, trie);
    while (trieChunkCache.size > MAX_CACHED_TRIES) {
        trieChunkCache.delete(trieChunkCache.keys().next().value);
        // 结果缓存引用着被淘汰分片的词对象，清空以免它们继续占用内存
        completionCache.clear();
    }
}

async function loadTrieForPrefix(prefix) {
    const letter = prefix[0] ? prefix[0].toLowerCase() : '';
    if (!/[a-z]/.test(letter)) return null;
    const cached = getCachedTrie(letter);
    if (cached) return cached;
    if (trieLoading.has(letter)) return trieLoading.get(letter);
    const loading = (async () => {
        try {
            const data = await fs.promises.readFile(path.join(HINT_DATA_DIR, `${letter}.json`), 'utf8');
            const trie = new Trie();
            JSON.parse(data).forEach(word => trie.insert(word));
            cacheTrie(letter, trie);
            return trie;
        } catch (error) {
            logError(`无法加载词典分片 ${letter}.json，请运行 npm run build 后重试`, error);
            return null;
        } finally {
            trieLoading.delete(letter);
        }
    })();
    trieLoading.set(letter, loading);
    return loading;
}

function getCompletionFromCache(prefix) {
    const cached = completionCache.get(prefix);
    if (!cached) return undefined;
    completionCache.delete(prefix);
    completionCache.set(prefix, cached);
    return cached;
}

function setCompletionCache(prefix, result) {
    completionCache.set(prefix, result);
    while (completionCache.size > MAX_COMPLETION_CACHE) {
        completionCache.delete(completionCache.keys().next().value);
    }
}

async function searchHintCompletionItems(keyword) {
    if (!keyword) return [];
    let cached = getCompletionFromCache(keyword);
    if (cached) return cached;
    let trie = await loadTrieForPrefix(keyword);
    if (!trie) return [];
    let items = trie.search(keyword);
    if (items.length === 0 && keyword.toLowerCase() !== keyword) {
        items = trie.search(keyword.toLowerCase());
    }
    // 短词优先（通常更常用），同长度按字母序，保证候选顺序可预期
    items = items.slice().sort(compareWords);
    setCompletionCache(keyword, items);
    return items;
}

async function findHintItem(wordname) {
    if (!wordname) return null;
    let trie = await loadTrieForPrefix(wordname);
    if (!trie) return null;
    return trie.find(wordname) || null;
}

async function loadFormsFor(word) {
    const letter = word[0] ? word[0].toLowerCase() : '';
    if (!/[a-z]/.test(letter)) return null;
    if (formsCache.has(letter)) return formsCache.get(letter);
    if (formsLoading.has(letter)) return formsLoading.get(letter);
    const loading = (async () => {
        try {
            const data = await fs.promises.readFile(path.join(FORMS_DIR, `${letter}.json`), 'utf8');
            const forms = JSON.parse(data);
            formsCache.set(letter, forms);
            return forms;
        } catch (error) {
            logError(`无法加载词形索引 forms/${letter}.json`, error);
            formsCache.set(letter, {});
            return {};
        } finally {
            formsLoading.delete(letter);
        }
    })();
    formsLoading.set(letter, loading);
    return loading;
}

async function findFormBase(word) {
    const forms = await loadFormsFor(word);
    if (!forms) return null;
    return forms[word.toLowerCase()] || null;
}

async function findHintItemForHover(word) {
    const exact = await findHintItem(word) || await findHintItem(word.toLowerCase());
    if (exact) return exact;
    const base = await findFormBase(word);
    if (!base || base.toLowerCase() === word.toLowerCase()) return null;
    return (await findHintItem(base)) || (await findHintItem(base.toLowerCase()));
}

async function resolveEntry(word, config) {
    if (config.ignoredWords.some(ignored => ignored.toLowerCase() === word.toLowerCase())) return null;
    const item = await findHintItemForHover(word);
    if (item) return item;
    const userWord = config.userWords.find(candidate => candidate.toLowerCase() === word.toLowerCase());
    return userWord ? { name: userWord, set: '', senses: [{ desc: 'User dictionary word' }] } : null;
}

function getWordAtActiveCursor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;
    const position = editor.selection.active;
    const lineText = editor.document.lineAt(position.line).text;
    return getWordAtCursor(lineText, position.character);
}

async function addUserWord() {
    const word = getWordAtActiveCursor();
    if (!word) {
        vscode.window.showInformationMessage('English Word Hint: place the cursor on a word first.');
        return;
    }
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const current = config.get('userWords', []);
    const words = Array.isArray(current) ? current : [];
    if (!words.some(existing => existing.toLowerCase() === word.toLowerCase())) {
        await config.update('userWords', [...words, word], vscode.ConfigurationTarget.Global);
    }
    vscode.window.showInformationMessage(`English Word Hint: added "${word}" to the user dictionary.`);
}

async function ignoreWord() {
    const word = getWordAtActiveCursor();
    if (!word) {
        vscode.window.showInformationMessage('English Word Hint: place the cursor on a word first.');
        return;
    }
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const current = config.get('ignoredWords', []);
    const words = Array.isArray(current) ? current : [];
    if (!words.some(existing => existing.toLowerCase() === word.toLowerCase())) {
        await config.update('ignoredWords', [...words, word], vscode.ConfigurationTarget.Global);
    }
    vscode.window.showInformationMessage(`English Word Hint: ignored "${word}".`);
}

async function showFullEntry() {
    const word = getWordAtActiveCursor();
    if (!word) {
        vscode.window.showInformationMessage('English Word Hint: place the cursor on a word first.');
        return;
    }
    const item = await resolveEntry(word, getConfig());
    if (!item) {
        vscode.window.showInformationMessage(`English Word Hint: no entry found for "${word}".`);
        return;
    }
    const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: buildFullEntry(item)
    });
    await vscode.window.showTextDocument(document, { preview: true });
}

function buildCompletionDocumentation(word) {
    const senses = getSenses(word);
    const markdown = new vscode.MarkdownString();
    markdown.appendText(truncate(senses[0].desc, MAX_COMPLETION_DOC_CHARS));
    if (senses[0].usage) {
        markdown.appendMarkdown('\n\n');
        markdown.appendText(truncate(senses[0].usage, 120));
    }
    if (senses.length > 1) {
        markdown.appendMarkdown(`\n\n*共 ${senses.length} 条释义，悬停查看全部*`);
    }
    return markdown;
}

function buildHover(word) {
    const senses = getSenses(word);
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown('**');
    markdown.appendText(word.name);
    markdown.appendMarkdown('**');
    if (word.set) {
        markdown.appendMarkdown('  \n*');
        markdown.appendText(word.set);
        markdown.appendMarkdown('*');
    }
    const shown = senses.slice(0, MAX_HOVER_SENSES);
    shown.forEach((sense, index) => {
        markdown.appendMarkdown('\n\n');
        if (senses.length > 1) markdown.appendMarkdown(`${index + 1}. `);
        markdown.appendText(truncate(sense.desc, MAX_HOVER_CHARS_PER_SENSE));
        if (sense.usage) {
            markdown.appendMarkdown('\n\n');
            markdown.appendText(truncate(sense.usage, 200));
        }
    });
    if (senses.length > shown.length) {
        markdown.appendMarkdown(`\n\n*还有 ${senses.length - shown.length} 条释义未显示*`);
    }
    return new vscode.Hover(markdown);
}

function activate(context) {
    outputChannel = vscode.window.createOutputChannel('English Word Hint');
    context.subscriptions.push(outputChannel);

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
            provideCompletionItems: async (document, position) => {
                try {
                    const config = getConfig();
                    if (!config.enabled || !config.completionEnabled) return [];
                    if (!config.languages.includes(document.languageId)) return [];
                    const lineText = document.lineAt(position).text;
                    if (shouldSuppress({
                        lineText,
                        character: position.character,
                        languageId: document.languageId,
                        lineIndex: position.line,
                        lineAt: index => document.lineAt(index).text
                    })) return [];
                    const keyword = getCompletionPrefix(lineText, position.character);
                    if (!keyword || keyword.length < config.minPrefixLength) {
                        // 空/过短前缀返回空但不完整的列表，继续输入后 VS Code 会重新请求
                        return new vscode.CompletionList([], true);
                    }
                    const items = await searchHintCompletionItems(keyword);
                    const lowerKeyword = keyword.toLowerCase();
                    const ignored = new Set(config.ignoredWords.map(word => word.toLowerCase()));
                    const userWords = config.userWords.filter(word =>
                        word.toLowerCase().startsWith(lowerKeyword) && !ignored.has(word.toLowerCase())
                    );
                    const userKeys = new Set(userWords.map(word => word.toLowerCase()));
                    const entries = [
                        ...userWords.map(name => ({ name, set: '', senses: [{ desc: 'User dictionary word' }] })),
                        ...items.filter(word =>
                            !ignored.has(word.name.toLowerCase()) && !userKeys.has(word.name.toLowerCase())
                        )
                    ];
                    let completionItems = entries.slice(0, config.maxResults).map((word, index) => {
                        let item = new vscode.CompletionItem(word.name, vscode.CompletionItemKind.Text);
                        item.documentation = buildCompletionDocumentation(word);
                        item.detail = word.set;
                        item.filterText = word.name;
                        item.insertText = insertTextFor(word.name);
                        item.sortText = ('0000' + index).slice(-4);
                        return item;
                    });
                    // 超过上限时标记不完整，让 VS Code 在继续输入时重新请求并拿到更精确的结果
                    return new vscode.CompletionList(completionItems, entries.length > config.maxResults);
                } catch (error) {
                    logError('补全请求失败', error);
                    return [];
                }
            },
            resolveCompletionItem: (item) => item
        })
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
            provideHover: async (document, position) => {
                try {
                    const config = getConfig();
                    if (!config.enabled || !config.hoverEnabled) return null;
                    if (!config.languages.includes(document.languageId)) return null;
                    const lineText = document.lineAt(position).text;
                    if (shouldSuppress({
                        lineText,
                        character: position.character,
                        languageId: document.languageId,
                        lineIndex: position.line,
                        lineAt: index => document.lineAt(index).text
                    })) return null;
                    const word = getWordAtCursor(lineText, position.character);
                    if (!word) return null;
                    const item = await resolveEntry(word, config);
                    return item ? buildHover(item) : null;
                } catch (error) {
                    logError('悬停释义请求失败', error);
                    return null;
                }
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('englishWordHint.addUserWord', addUserWord),
        vscode.commands.registerCommand('englishWordHint.ignoreWord', ignoreWord),
        vscode.commands.registerCommand('englishWordHint.showFullEntry', showFullEntry)
    );
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;
