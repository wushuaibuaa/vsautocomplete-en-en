function getSenses(word) {
    if (Array.isArray(word.senses) && word.senses.length > 0) return word.senses;
    return [{ desc: word.desc || '', usage: word.usage || word.useage || '' }];
}

function truncate(text, limit) {
    const value = (text || '').trim();
    return value.length > limit ? value.slice(0, limit).replace(/\s+$/, '') + '…' : value;
}

function compareWords(a, b) {
    return a.name.length - b.name.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

function getHoverCandidates(word) {
    const candidates = [word, word.toLowerCase()];
    if (word.endsWith('s')) candidates.push(word.slice(0, -1));
    if (word.endsWith('es')) candidates.push(word.slice(0, -2));
    if (word.endsWith('ed')) {
        candidates.push(word.slice(0, -1), word.slice(0, -2), word.slice(0, -3));
    }
    return candidates.filter(Boolean);
}

module.exports = { getSenses, truncate, compareWords, getHoverCandidates };
