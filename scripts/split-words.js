const fs = require('fs');
const path = require('path');
const { cleanHeadword } = require('./lib/clean-headword');

const ROOT = path.join(__dirname, '..');
const srcPath = path.join(ROOT, 'hint_data', 'words.json');
const dstDir = path.join(ROOT, 'hint_data');
const MAX_SENSES_PER_WORD = 20;
const MIN_HEADWORDS = 30000;

if (!fs.existsSync(srcPath)) {
  console.error('words.json 不存在，请确认路径！');
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
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

const chunks = {};
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
  senseCount += entry.senses.length;
  written++;
}

if (written < MIN_HEADWORDS) {
  throw new Error(`词库清洗后仅剩 ${written} 个词条（阈值 ${MIN_HEADWORDS}），请检查清洗规则或源数据`);
}

Object.keys(chunks).sort().forEach(letter => {
  const filePath = path.join(dstDir, `${letter}.json`);
  fs.writeFileSync(filePath, JSON.stringify(chunks[letter], null, 2), 'utf8');
  console.log(`写入 ${filePath}，共 ${chunks[letter].length} 个词条`);
});

console.log(`词库拆分完成：${written} 个词条 / ${senseCount} 条释义（源 ${words.length} 条，丢弃 ${dropped} 条，规范化 ${renamed} 条）`);
