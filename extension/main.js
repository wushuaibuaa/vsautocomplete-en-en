/// <reference path="../vscode.d.ts" />
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const HINT_DATA_DIR = path.join(__dirname, '../hint_data');
const DOCUMENT_SELECTOR = ['markdown', 'latex'];
const QUOTES = '\'\"';

// 少于该长度的前缀不触发补全（单字母会命中数千条，淹没候选列表）
const MIN_PREFIX_LENGTH = 2;
// 单次返回的最大候选数，超出的部分通过 isIncomplete 让 VS Code 继续输入时重新请求
const MAX_RESULTS = 100;

// 缓存已加载的 Trie { a: Trie, b: Trie, ... }
let trieChunkCache = {};
// 补全结果缓存
const completionCache = new Map();
const MAX_CACHE_SIZE = 100;

function getTextBeforeCursor(document, position) {
    var start = new vscode.Position(position.line, 0);
    var range = new vscode.Range(start, position);
    return document.getText(range);
}

function getTextAroundCursor(document, position) {
    let lineText = document.lineAt(position).text,
        pos = position.character;
    let beforeText = lineText.slice(0, pos),
        afterText = lineText.slice(pos);
    beforeText = (beforeText.match(/\w*$/) || [''])[0];
    afterText = (afterText.match(/^\w*/) || [''])[0];
    return beforeText + afterText;
}

function isCursorInTheString(textBeforeCursor) {
    if (textBeforeCursor.indexOf(QUOTES[0]) == -1 ||
        textBeforeCursor.indexOf(QUOTES[1]) == -1) return false;
    let len = textBeforeCursor.length, i = -1, inStr = false, char, qType;
    while (++i < len) {
        char = textBeforeCursor[i];
        if (char == '\\')
            i++;
        else if ((qType = QUOTES.indexOf(char)) >= 0)
            inStr = inStr == QUOTES[qType] ? false : QUOTES[qType];
    }
    return inStr;
}

// Trie 实现
class TrieNode {
    constructor() {
        this.children = {};
        this.words = [];
    }
}
class Trie {
    constructor() {
        this.root = new TrieNode();
    }
    insert(wordObj) {
        let node = this.root;
        for (let char of wordObj.name) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
            node.words.push(wordObj);
        }
    }
    search(prefix) {
        let node = this.root;
        for (let char of prefix) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }
        return node.words;
    }
    find(wordname) {
        let node = this.root;
        for (let char of wordname) {
            if (!node.children[char]) return null;
            node = node.children[char];
        }
        // 精确匹配
        return node.words.find(w => w.name === wordname) || null;
    }
}

// 异步加载分块并构建 Trie
async function loadTrieForPrefix(prefix) {
    const letter = prefix[0] ? prefix[0].toLowerCase() : '';
    if (!letter.match(/[a-z]/)) return null;
    if (trieChunkCache[letter]) return trieChunkCache[letter];
    try {
        const chunkPath = path.join(HINT_DATA_DIR, `${letter}.json`);
        const data = await fs.promises.readFile(chunkPath, 'utf8');
        const words = JSON.parse(data);
        const trie = new Trie();
        words.forEach(word => trie.insert(word));
        trieChunkCache[letter] = trie;
        return trie;
    } catch (e) {
        trieChunkCache[letter] = new Trie();
        return trieChunkCache[letter];
    }
}

function getCompletionFromCache(prefix) {
    return completionCache.get(prefix);
}
function setCompletionCache(prefix, result) {
    if (completionCache.size > MAX_CACHE_SIZE) {
        const firstKey = completionCache.keys().next().value;
        completionCache.delete(firstKey);
    }
    completionCache.set(prefix, result);
}

async function searchHintCompletionItems(keyword) {
    if (!keyword) return [];
    // 查缓存
    let cached = getCompletionFromCache(keyword);
    if (cached) return cached;
    // 异步加载 Trie
    let trie = await loadTrieForPrefix(keyword);
    if (!trie) return [];
    // 支持大小写、前缀匹配
    let items = trie.search(keyword);
    if (items.length === 0 && keyword.toLowerCase() !== keyword) {
        items = trie.search(keyword.toLowerCase());
    }
    // 短词优先（通常更常用），同长度按字母序，保证候选顺序可预期
    items = items.slice().sort((a, b) =>
        a.name.length - b.name.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    );
    setCompletionCache(keyword, items);
    return items;
}

async function findHintItem(wordname) {
    if (!wordname) return null;
    const letter = wordname[0] ? wordname[0].toLowerCase() : '';
    let trie = await loadTrieForPrefix(wordname);
    if (!trie) return null;
    let item = trie.find(wordname);
    return item || null;
}

function activate(context) {
    var subscriptions = context.subscriptions;

    subscriptions.push(
        vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
            provideCompletionItems: async (document, position) => {
                let beforeText = getTextBeforeCursor(document, position);
                if (isCursorInTheString(beforeText)) return [];
                let keyword = (beforeText.match(/^.*?\b(\w*)$/) || ['', ''])[1];
                if (!keyword || keyword.length < MIN_PREFIX_LENGTH) {
                    // 空/过短前缀返回空但不完整的列表，继续输入后 VS Code 会重新请求
                    return new vscode.CompletionList([], true);
                }
                let items = await searchHintCompletionItems(keyword);
                let completionItems = items.slice(0, MAX_RESULTS).map((word, index) => {
                    let item = new vscode.CompletionItem(word.name, vscode.CompletionItemKind.Function);
                    let documentation = word.desc || '';
                    let usage = word.useage || word.usage || '';
                    if (usage) documentation += `\n\n${usage}`;
                    item.documentation = documentation;
                    item.detail = word.set;
                    item.sortText = ('0000' + index).slice(-4);
                    return item;
                });
                // 超过上限时标记不完整，让 VS Code 在继续输入时重新请求并拿到更精确的结果
                return new vscode.CompletionList(completionItems, items.length > MAX_RESULTS);
            },
            resolveCompletionItem: (item) => item
        })
    );

    subscriptions.push(
        vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
            provideHover: async (document, position) => {
                let beforeText = getTextBeforeCursor(document, position);
                if (isCursorInTheString(beforeText)) return [];
                let textAround = getTextAroundCursor(document, position);
                if (!textAround) return null;
                let strlen = textAround.length;
                let item = await findHintItem(textAround);
                if (!item)
                    item = await findHintItem(textAround.toLowerCase());
                if (!item && textAround.charAt(strlen - 1) == "s")
                    item = await findHintItem(textAround.substring(0, strlen - 1));
                if (!item && textAround.substring(strlen - 2, strlen) == "es")
                    item = await findHintItem(textAround.substring(0, strlen - 2));
                if (!item && textAround.substring(strlen - 2, strlen) == "ed") {
                    item = await findHintItem(textAround.substring(0, strlen - 1));
                    if (!item) {
                        item = await findHintItem(textAround.substring(0, strlen - 2));
                        if (!item)
                            item = await findHintItem(textAround.substring(0, strlen - 3));
                    }
                }
                if (!item) return null;
                return new vscode.Hover([
                    `**${item.name}**`, `*${item.set}*`, item.desc
                ]);
            }
        })
    );
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;
