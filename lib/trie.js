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
        for (let char of wordObj.name.toLowerCase()) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
            node.words.push(wordObj);
        }
    }

    search(prefix) {
        let node = this.root;
        for (let char of prefix.toLowerCase()) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }
        return node.words;
    }

    find(wordname) {
        let node = this.root;
        const lower = wordname.toLowerCase();
        for (let char of lower) {
            if (!node.children[char]) return null;
            node = node.children[char];
        }
        return node.words.find(word => word.name === wordname)
            || node.words.find(word => word.name.toLowerCase() === lower)
            || null;
    }
}

module.exports = { Trie, TrieNode };
