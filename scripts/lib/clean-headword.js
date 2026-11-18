// 词典源数据里大量词条被拼接成 "word-esp-in-...", "word-pl-..." 等形式，
// 该正则用于截掉这些词典注记，只保留真正的 headword。
const TRAILING_ANNOTATION = /-(?:abbr|esp|n-pl|pl|infml|fml|fig|lit|dated|arch|rhet|euph|taboo|dial)-.*$/i;

function cleanHeadword(name) {
    if (typeof name !== 'string') return null;
    let value = name.trim();
    if (!value) return null;

    value = value.replace(/-?\((?:also\b|US\b|Brit\b|or\b)[^)]*\)/gi, '');
    value = value.replace(/-?\([^)]*\.\.\.[^)]*\)/g, '');
    value = value.replace(/\s*\(-[^)]*\)\s*$/g, '');
    value = value.replace(/[()]/g, '');
    value = value.replace(/\.\.\./g, '');

    const comma = value.indexOf(',');
    if (comma >= 0) value = value.slice(0, comma);

    value = value.replace(TRAILING_ANNOTATION, '');
    value = value.replace(/[.,;:]+$/g, '').trim();

    if (value.startsWith('-') || value.endsWith('-')) return null;
    if (/\s/.test(value)) return null;
    if (/(^|-)(sb|sth)(['’]s)?(-|$)/i.test(value)) return null;
    if (/[0-9]/.test(value)) return /^[A-Za-z]+[0-9]+$/.test(value) ? value : null;
    if (/^[A-Za-z][A-Za-z'’-]*$/.test(value)) return value;
    if (/^[A-Za-z]+(\/[A-Za-z]+(?:-level)?)+$/.test(value)) return value;
    return null;
}

module.exports = { cleanHeadword };
