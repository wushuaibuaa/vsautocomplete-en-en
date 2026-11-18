const WORD_CHAR = /[A-Za-z'’-]/;
const FENCE = /^\s*(```|~~~)/;
const FRONTMATTER = /^(---|\.\.\.)\s*$/;
const MATH_BOUNDARY = /\\(begin|end)\{(equation\*?|align\*?|gather\*?|multline\*?|eqnarray\*?|math)\}/g;

function isEscaped(text, index) {
    let backslashes = 0;
    for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) backslashes++;
    return backslashes % 2 === 1;
}

function getWordAtCursor(lineText, character) {
    let start = character;
    let end = character;
    while (start > 0 && WORD_CHAR.test(lineText[start - 1])) start--;
    while (end < lineText.length && WORD_CHAR.test(lineText[end])) end++;
    return lineText.slice(start, end).replace(/^['’-]+|['’-]+$/g, '').replace(/’/g, "'");
}

function getCompletionPrefix(lineText, character) {
    return (lineText.slice(0, character).match(/[A-Za-z]+$/) || [''])[0];
}

function isInQuotedString(lineText, character) {
    let quote = '';
    for (let i = 0; i < character; i++) {
        const char = lineText[i];
        if (char === '\\') {
            i++;
            continue;
        }
        if ((char === "'" || char === '’') && /[A-Za-z]/.test(lineText[i - 1] || '') && /[A-Za-z]/.test(lineText[i + 1] || '')) {
            continue;
        }
        if (quote) {
            if (char === quote) quote = '';
        } else if (char === '"' || char === "'" || char === '’') {
            quote = char;
        }
    }
    return Boolean(quote);
}

function isInUrlOrEmail(lineText, character) {
    let start = character;
    let end = character;
    while (start > 0 && !/\s/.test(lineText[start - 1])) start--;
    while (end < lineText.length && !/\s/.test(lineText[end])) end++;
    const token = lineText.slice(start, end);
    return /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/i.test(token) || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(token);
}

function isInInlineCode(lineText, character) {
    const runs = lineText.slice(0, character).match(/`+/g) || [];
    return runs.length % 2 === 1;
}

function isInFencedCode(lineAt, lineIndex, maxLookback) {
    let fences = 0;
    const start = Math.max(0, lineIndex - maxLookback);
    for (let i = lineIndex - 1; i >= start; i--) {
        if (FENCE.test(lineAt(i))) fences++;
    }
    return fences % 2 === 1;
}

function isInFrontmatter(lineAt, lineIndex) {
    if (!FRONTMATTER.test(lineAt(0))) return false;
    const last = Math.min(lineIndex, 100);
    for (let i = 1; i <= last; i++) {
        if (FRONTMATTER.test(lineAt(i))) return false;
    }
    return true;
}

function isInMarkdownLinkTarget(lineText, character) {
    const before = lineText.slice(0, character);
    const after = lineText.slice(character);
    const open = before.lastIndexOf('](');
    if (open < 0 || before.slice(open + 2).includes(')')) return false;
    return after.includes(')');
}

function countUnescaped(text, char) {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === char && !isEscaped(text, i)) count++;
    }
    return count;
}

function lastUnescapedIndex(text, needle) {
    let index = text.lastIndexOf(needle);
    while (index >= 0 && isEscaped(text, index)) {
        index = text.lastIndexOf(needle, index - 1);
    }
    return index;
}

function isInLatexMath(lineText, character, lineAt, lineIndex) {
    const before = lineText.slice(0, character);
    if (countUnescaped(before, '$') % 2 === 1) return true;
    if (lastUnescapedIndex(before, '\\(') > lastUnescapedIndex(before, '\\)')) return true;
    if (lastUnescapedIndex(before, '\\[') > lastUnescapedIndex(before, '\\]')) return true;

    const start = Math.max(0, lineIndex - 300);
    for (let i = lineIndex; i >= start; i--) {
        const text = lineAt(i);
        const limit = i === lineIndex ? character : text.length;
        const slice = text.slice(0, limit);
        let last = null;
        let match;
        MATH_BOUNDARY.lastIndex = 0;
        while ((match = MATH_BOUNDARY.exec(slice))) last = match;
        if (last) return last[1] === 'begin';
    }
    return false;
}

function isInLatexCommand(lineText, character) {
    const before = lineText.slice(0, character);
    const match = before.match(/\\[A-Za-z]*$/);
    return Boolean(match) && !isEscaped(before, match.index);
}

function shouldSuppress(options) {
    const lineText = options.lineText;
    const character = options.character;
    const languageId = options.languageId || '';
    const lineIndex = options.lineIndex || 0;
    const lineAt = typeof options.lineAt === 'function' ? options.lineAt : () => lineText;

    if (isInQuotedString(lineText, character)) return true;
    if (isInUrlOrEmail(lineText, character)) return true;

    if (languageId === 'markdown') {
        if (isInFrontmatter(lineAt, lineIndex)) return true;
        if (isInFencedCode(lineAt, lineIndex, 300)) return true;
        if (isInInlineCode(lineText, character)) return true;
        if (isInMarkdownLinkTarget(lineText, character)) return true;
    }

    if (languageId === 'latex') {
        if (countUnescaped(lineText.slice(0, character), '%') > 0) return true;
        if (isInLatexCommand(lineText, character)) return true;
        if (isInLatexMath(lineText, character, lineAt, lineIndex)) return true;
    }

    return false;
}

module.exports = {
    shouldSuppress,
    getWordAtCursor,
    getCompletionPrefix,
    isInQuotedString,
    isInUrlOrEmail,
    isInInlineCode,
    isInFencedCode,
    isInFrontmatter,
    isInMarkdownLinkTarget,
    isInLatexMath,
    isInLatexCommand
};
