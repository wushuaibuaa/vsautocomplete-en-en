const IRREGULAR_FORMS = [
    ['am', 'be'], ['is', 'be'], ['are', 'be'], ['was', 'be'], ['were', 'be'], ['been', 'be'], ['being', 'be'],
    ['has', 'have'], ['had', 'have'], ['having', 'have'],
    ['does', 'do'], ['did', 'do'], ['done', 'do'], ['doing', 'do'],
    ['goes', 'go'], ['went', 'go'], ['gone', 'go'], ['going', 'go'],
    ['says', 'say'], ['said', 'say'],
    ['made', 'make'],
    ['took', 'take'], ['taken', 'take'],
    ['came', 'come'],
    ['saw', 'see'], ['seen', 'see'],
    ['knew', 'know'], ['known', 'know'],
    ['got', 'get'], ['gotten', 'get'],
    ['gave', 'give'], ['given', 'give'],
    ['found', 'find'],
    ['thought', 'think'],
    ['told', 'tell'],
    ['became', 'become'],
    ['shown', 'show'],
    ['left', 'leave'],
    ['felt', 'feel'],
    ['brought', 'bring'],
    ['began', 'begin'], ['begun', 'begin'],
    ['kept', 'keep'],
    ['held', 'hold'],
    ['wrote', 'write'], ['written', 'write'],
    ['stood', 'stand'],
    ['heard', 'hear'],
    ['meant', 'mean'],
    ['met', 'meet'],
    ['ran', 'run'],
    ['paid', 'pay'],
    ['sat', 'sit'],
    ['spoke', 'speak'], ['spoken', 'speak'],
    ['lay', 'lie'], ['lain', 'lie'], ['lying', 'lie'],
    ['led', 'lead'],
    ['grew', 'grow'], ['grown', 'grow'],
    ['lost', 'lose'],
    ['fell', 'fall'], ['fallen', 'fall'],
    ['sent', 'send'],
    ['built', 'build'],
    ['understood', 'understand'],
    ['drew', 'draw'], ['drawn', 'draw'],
    ['broke', 'break'], ['broken', 'break'],
    ['spent', 'spend'],
    ['rose', 'rise'], ['risen', 'rise'],
    ['drove', 'drive'], ['driven', 'drive'],
    ['bought', 'buy'],
    ['wore', 'wear'], ['worn', 'wear'],
    ['chose', 'choose'], ['chosen', 'choose'],
    ['ate', 'eat'], ['eaten', 'eat'],
    ['drank', 'drink'], ['drunk', 'drink'],
    ['swam', 'swim'], ['swum', 'swim'],
    ['flew', 'fly'], ['flown', 'fly'],
    ['taught', 'teach'],
    ['caught', 'catch'],
    ['fought', 'fight'],
    ['threw', 'throw'], ['thrown', 'throw'],
    ['slept', 'sleep'],
    ['won', 'win'],
    ['forgot', 'forget'], ['forgotten', 'forget'],
    ['forgave', 'forgive'], ['forgiven', 'forgive'],
    ['froze', 'freeze'], ['frozen', 'freeze'],
    ['hid', 'hide'], ['hidden', 'hide'],
    ['sang', 'sing'], ['sung', 'sing'],
    ['rang', 'ring'], ['rung', 'ring'],
    ['sank', 'sink'], ['sunk', 'sink'],
    ['sprang', 'spring'], ['sprung', 'spring'],
    ['stole', 'steal'], ['stolen', 'steal'],
    ['stuck', 'stick'],
    ['struck', 'strike'],
    ['swept', 'sweep'],
    ['woke', 'wake'], ['woken', 'wake'],
    ['bore', 'bear'], ['borne', 'bear'],
    ['beaten', 'beat'],
    ['bit', 'bite'], ['bitten', 'bite'],
    ['blew', 'blow'], ['blown', 'blow'],
    ['burnt', 'burn'],
    ['dealt', 'deal'],
    ['dug', 'dig'],
    ['dreamt', 'dream'],
    ['fed', 'feed'],
    ['fled', 'flee'],
    ['hung', 'hang'],
    ['lent', 'lend'],
    ['lit', 'light'],
    ['sought', 'seek'],
    ['sold', 'sell'],
    ['shot', 'shoot'],
    ['smelt', 'smell'],
    ['spelt', 'spell'],
    ['spilt', 'spill'],
    ['spoilt', 'spoil'],
    ['wound', 'wind'],
    ['wept', 'weep'],
    ['crept', 'creep'],
    ['leapt', 'leap'],
    ['knelt', 'kneel'],
    ['foresaw', 'foresee'], ['foreseen', 'foresee'],
    ['undertook', 'undertake'], ['undertaken', 'undertake'],
    ['withdrew', 'withdraw'], ['withdrawn', 'withdraw'],
    ['overcame', 'overcome'],
    ['rebuilt', 'rebuild'],
    ['misled', 'mislead'],
    ['arose', 'arise'], ['arisen', 'arise'],
    ['awoke', 'awake'], ['awoken', 'awake'],
    ['forsook', 'forsake'], ['forsaken', 'forsake'],
    ['strove', 'strive'], ['striven', 'strive'],
    ['trod', 'tread'], ['trodden', 'tread'],
    ['sewn', 'sew'],
    ['sown', 'sow'],
    ['swollen', 'swell'],
    ['tore', 'tear'], ['torn', 'tear'],
    ['wove', 'weave'], ['woven', 'weave'],
    ['withheld', 'withhold'],
    ['withstood', 'withstand'],
    ['upheld', 'uphold'],
    ['oversaw', 'oversee'], ['overseen', 'oversee'],
    ['misunderstood', 'misunderstand'],
    ['redid', 'redo'], ['redone', 'redo'],
    ['outdid', 'outdo'], ['outdone', 'outdo'],
    ['overdid', 'overdo'], ['overdone', 'overdo'],
    ['partook', 'partake'], ['partaken', 'partake'],
    ['underwent', 'undergo'], ['undergone', 'undergo'],
    ['children', 'child'], ['men', 'man'], ['women', 'woman'], ['people', 'person'],
    ['teeth', 'tooth'], ['feet', 'foot'], ['mice', 'mouse'], ['geese', 'goose'], ['oxen', 'ox'], ['lice', 'louse'],
    ['bases', 'basis'], ['analyses', 'analysis'], ['crises', 'crisis'], ['theses', 'thesis'],
    ['hypotheses', 'hypothesis'], ['diagnoses', 'diagnosis'], ['oases', 'oasis'],
    ['parentheses', 'parenthesis'], ['syntheses', 'synthesis'],
    ['criteria', 'criterion'], ['phenomena', 'phenomenon'], ['data', 'datum'], ['media', 'medium'],
    ['bacteria', 'bacterium'], ['curricula', 'curriculum'], ['memoranda', 'memorandum'],
    ['indices', 'index'], ['matrices', 'matrix'], ['vertices', 'vertex'], ['appendices', 'appendix'],
    ['fungi', 'fungus'], ['nuclei', 'nucleus'], ['stimuli', 'stimulus'], ['syllabi', 'syllabus'],
    ['alumni', 'alumnus'], ['cacti', 'cactus'], ['foci', 'focus'], ['radii', 'radius'],
    ['leaves', 'leaf'], ['lives', 'life'], ['wives', 'wife'], ['knives', 'knife'], ['wolves', 'wolf'],
    ['halves', 'half'], ['shelves', 'shelf'], ['selves', 'self'], ['thieves', 'thief'], ['calves', 'calf'],
    ['loaves', 'loaf'], ['scarves', 'scarf'], ['sheaves', 'sheaf'], ['hooves', 'hoof'], ['elves', 'elf'],
    ['dwarves', 'dwarf'],
    ['better', 'good'], ['best', 'good'], ['worse', 'bad'], ['worst', 'bad'],
    ['further', 'far'], ['furthest', 'far'], ['farther', 'far'], ['farthest', 'far'],
    ['less', 'little'], ['least', 'little'], ['more', 'many'], ['most', 'many'],
    ['elder', 'old'], ['eldest', 'old'],
    ['me', 'I'], ['my', 'I'], ['mine', 'I'], ['myself', 'I'],
    ['him', 'he'], ['his', 'he'], ['himself', 'he'],
    ['her', 'she'], ['hers', 'she'], ['herself', 'she'],
    ['us', 'we'], ['our', 'we'], ['ours', 'we'], ['ourselves', 'we'],
    ['them', 'they'], ['their', 'they'], ['theirs', 'they'], ['themselves', 'they'],
    ['your', 'you'], ['yours', 'you'], ['yourself', 'you'], ['yourselves', 'you'],
    ['its', 'it'], ['itself', 'it'],
    ["don't", 'do'], ["doesn't", 'do'], ["didn't", 'do'],
    ["isn't", 'be'], ["aren't", 'be'], ["wasn't", 'be'], ["weren't", 'be'],
    ["haven't", 'have'], ["hasn't", 'have'], ["hadn't", 'have'],
    ["can't", 'can'], ['cannot', 'can'], ["couldn't", 'could'],
    ["won't", 'will'], ["wouldn't", 'would'], ["shouldn't", 'should'],
    ["mustn't", 'must'], ["needn't", 'need'], ["daren't", 'dare'],
    ["I'm", 'I'], ["I've", 'have'], ["I'll", 'will'], ["I'd", 'would'],
    ["you're", 'be'], ["you've", 'have'], ["you'll", 'will'], ["you'd", 'would'],
    ["we're", 'be'], ["we've", 'have'], ["we'll", 'will'], ["we'd", 'would'],
    ["they're", 'be'], ["they've", 'have'], ["they'll", 'will'], ["they'd", 'would'],
    ["let's", 'let']
];

function isConsonantY(word) {
    return /[^aeiou]y$/.test(word);
}

function generateForms(word) {
    const forms = new Set();
    if (/(s|x|z|ch|sh)$/.test(word)) forms.add(word + 'es');
    else if (isConsonantY(word)) forms.add(word.slice(0, -1) + 'ies');
    else forms.add(word + 's');

    if (/(s|x|z|ch|sh|o)$/.test(word)) forms.add(word + 'es');
    if (/e$/.test(word)) forms.add(word + 'd');
    else if (isConsonantY(word)) forms.add(word.slice(0, -1) + 'ied');
    else forms.add(word + 'ed');

    if (/ie$/.test(word)) forms.add(word.slice(0, -2) + 'ying');
    else if (/e$/.test(word) && !/ee$/.test(word)) forms.add(word.slice(0, -1) + 'ing');
    else forms.add(word + 'ing');

    if (/[^aeiou][aeiou][^aeiouwy]$/.test(word) && word.length <= 5) {
        const last = word[word.length - 1];
        forms.add(word + last + 'ed');
        forms.add(word + last + 'ing');
    }
    return forms;
}

function buildFormIndex(headwords) {
    const headwordSet = new Set(headwords.map(name => name.toLowerCase()));
    const assigned = new Map();

    function add(form, base) {
        const key = form.toLowerCase();
        if (key.length < 2 || !/^[a-z'’-]+$/.test(key)) return;
        if (headwordSet.has(key)) return;
        if (assigned.has(key)) {
            if (assigned.get(key) !== base) assigned.set(key, null);
            return;
        }
        assigned.set(key, base);
    }

    for (const [form, base] of IRREGULAR_FORMS) {
        if (!headwordSet.has(base.toLowerCase())) continue;
        add(form, base);
    }

    for (const name of headwords) {
        const lower = name.toLowerCase();
        if (!/^[a-z]+$/.test(lower) || lower.length < 3) continue;
        for (const form of generateForms(lower)) add(form, name);
    }

    const byLetter = {};
    let count = 0;
    for (const [form, base] of assigned) {
        if (!base) continue;
        const letter = form[0];
        (byLetter[letter] || (byLetter[letter] = {}))[form] = base;
        count++;
    }
    for (const letter of Object.keys(byLetter)) {
        const sorted = {};
        Object.keys(byLetter[letter]).sort().forEach(form => {
            sorted[form] = byLetter[letter][form];
        });
        byLetter[letter] = sorted;
    }
    return { byLetter, count };
}

module.exports = { buildFormIndex };
