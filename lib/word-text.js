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

const FUNCTION_WORD = /(^|-)(the|of|and|in|to|on|for|with|from|by|at|or)(-|$)/i;

function isMultiword(name) {
    return FUNCTION_WORD.test(name);
}

function insertTextFor(name) {
    return isMultiword(name) ? name.replace(/-/g, ' ') : name;
}

function buildFullEntry(word) {
    const senses = getSenses(word);
    const lines = [`# ${word.name}`];
    if (word.set) lines.push('', `*${word.set}*`);
    senses.forEach((sense, index) => {
        lines.push('');
        if (senses.length > 1) lines.push(`## ${index + 1}`);
        lines.push(sense.desc || '');
        if (sense.usage) lines.push('', sense.usage);
    });
    return lines.join('\n');
}

module.exports = { getSenses, truncate, compareWords, rankOf, isMultiword, insertTextFor, buildFullEntry };
