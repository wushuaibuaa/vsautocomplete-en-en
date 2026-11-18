const Module = require('node:module');
const vscode = require('./vscode-stub');

function loadExtension() {
    const originalLoad = Module._load;
    Module._load = function (request) {
        if (request === 'vscode') return vscode;
        return originalLoad.apply(this, arguments);
    };
    try {
        const entry = require.resolve('../extension/main.js');
        delete require.cache[entry];
        return require(entry);
    } finally {
        Module._load = originalLoad;
    }
}

module.exports = { loadExtension, vscode };
