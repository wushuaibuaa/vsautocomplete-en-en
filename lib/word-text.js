function getSenses(word) {
    if (Array.isArray(word.senses) && word.senses.length > 0) return word.senses;
    return [{ desc: word.desc || '', usage: word.usage || word.useage || '' }];
}

function truncate(text, limit) {
    const value = (text || '').trim();
    return value.length > limit ? value.slice(0, limit).replace(/\s+$/, '') + '…' : value;
}

function rankOf(word) {
    return typeof word.rank === 'number' ? word.rank : Number.MAX_SAFE_INTEGER;
}

function compareWords(a, b) {
    const rankA = rankOf(a);
    const rankB = rankOf(b);
    if (rankA !== rankB) return rankA - rankB;
    return a.name.length - b.name.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

module.exports = { getSenses, truncate, compareWords, rankOf };
