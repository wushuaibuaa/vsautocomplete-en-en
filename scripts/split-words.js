const fs = require('fs');
const path = require('path');
const { cleanHeadword } = require('./lib/clean-headword');
const { buildFormIndex } = require('./lib/word-forms');

const ROOT = path.join(__dirname, '..');
const srcPath = path.join(ROOT, 'hint_data', 'words.json');
const dstDir = path.join(ROOT, 'hint_data');
const formsDir = path.join(dstDir, 'forms');
const MAX_SENSES_PER_WORD = 20;
const MIN_HEADWORDS = 30000;
const MIN_FORMS = 10000;

function loadRanks() {
  let frequency = [];
  try {
    frequency = require('subtlex-word-frequencies');
  } catch (error) {
    console.warn('未找到 subtlex-word-frequencies，跳过词频排序（先运行 npm install）');
    return new Map();
  }
  const ranks = new Map();
  frequency.forEach((item, index) => {
    const word = String(item.word || '').toLowerCase();
    if (word && !ranks.has(word)) ranks.set(word, index);
  });
  return ranks;
}

if (!fs.existsSync(srcPath)) {
  console.error('words.json 不存在，请确认路径！');
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const ranks = loadRanks();
const byName = new Map();
let dropped = 0;
let renamed = 0;

for (const word of words) {
  const name = cleanHeadword(word.name);
  if (!name) {
    dropped++;
    continue;
  }
  if (name !== word.name) renamed++;
  let entry = byName.get(name);
  if (!entry) {
    entry = { name, set: word.set || '', senses: [] };
    byName.set(name, entry);
  }
  if (!entry.set && word.set) entry.set = word.set;
  if (entry.senses.length >= MAX_SENSES_PER_WORD) continue;
  const sense = {
    desc: (word.desc || '').trim(),
    usage: (word.useage || word.usage || '').trim()
  };
  if (!sense.desc && !sense.usage) continue;
  if (entry.senses.some(existing => existing.desc === sense.desc && existing.usage === sense.usage)) continue;
  entry.senses.push(sense);
}

let ranked = 0;
for (const entry of byName.values()) {
  const rank = ranks.get(entry.name.toLowerCase());
  if (rank !== undefined) {
    entry.rank = rank;
    ranked++;
  }
}

const chunks = {};
const entries = [];
let senseCount = 0;
let written = 0;
for (const entry of byName.values()) {
  if (!entry.senses.length) {
    dropped++;
    continue;
  }
  const letter = entry.name[0].toLowerCase();
  if (!/[a-z]/.test(letter)) {
    dropped++;
    continue;
  }
  (chunks[letter] || (chunks[letter] = [])).push(entry);
  entries.push(entry);
  senseCount += entry.senses.length;
  written++;
}

if (written < MIN_HEADWORDS) {
  throw new Error(`词库清洗后仅剩 ${written} 个词条（阈值 ${MIN_HEADWORDS}），请检查清洗规则或源数据`);
}

const { byLetter, count: formCount } = buildFormIndex(entries.map(entry => entry.name));
if (formCount < MIN_FORMS) {
  throw new Error(`词形索引仅生成 ${formCount} 条（阈值 ${MIN_FORMS}），请检查词形规则`);
}

fs.rmSync(formsDir, { recursive: true, force: true });
fs.mkdirSync(formsDir, { recursive: true });

Object.keys(chunks).sort().forEach(letter => {
  fs.writeFileSync(path.join(dstDir, `${letter}.json`), JSON.stringify(chunks[letter]), 'utf8');
});
Object.keys(byLetter).sort().forEach(letter => {
  fs.writeFileSync(path.join(formsDir, `${letter}.json`), JSON.stringify(byLetter[letter]), 'utf8');
});

console.log(`词库拆分完成：${written} 个词条 / ${senseCount} 条释义 / ${formCount} 条词形（源 ${words.length} 条，丢弃 ${dropped} 条，规范化 ${renamed} 条，词频覆盖 ${ranked} 条）`);
