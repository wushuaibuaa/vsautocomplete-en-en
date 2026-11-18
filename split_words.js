// 构建脚本：把 hint_data/words.json 合并义项并按首字母拆成 a-z 分片，供扩展按需加载。
// 运行 `npm run build`，或由 `vsce package` 的 vscode:prepublish 自动执行。
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'hint_data', 'words.json');
const dstDir = path.join(__dirname, 'hint_data');
const MAX_SENSES_PER_WORD = 20;

if (!fs.existsSync(srcPath)) {
  console.error('words.json 不存在，请确认路径！');
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const byName = new Map();

words.forEach(word => {
  if (!word.name || typeof word.name !== 'string') return;
  if (!/[a-z]/i.test(word.name[0])) return;
  let entry = byName.get(word.name);
  if (!entry) {
    entry = { name: word.name, set: word.set || '', senses: [] };
    byName.set(word.name, entry);
  }
  if (!entry.set && word.set) entry.set = word.set;
  if (entry.senses.length >= MAX_SENSES_PER_WORD) return;
  const sense = {
    desc: (word.desc || '').trim(),
    usage: (word.useage || word.usage || '').trim()
  };
  if (!sense.desc && !sense.usage) return;
  if (entry.senses.some(s => s.desc === sense.desc && s.usage === sense.usage)) return;
  entry.senses.push(sense);
});

const chunks = {};
let senseCount = 0;
for (const entry of byName.values()) {
  const letter = entry.name[0].toLowerCase();
  (chunks[letter] || (chunks[letter] = [])).push(entry);
  senseCount += entry.senses.length;
}

Object.keys(chunks).sort().forEach(letter => {
  const filePath = path.join(dstDir, `${letter}.json`);
  fs.writeFileSync(filePath, JSON.stringify(chunks[letter], null, 2), 'utf8');
  console.log(`写入 ${filePath}，共 ${chunks[letter].length} 个词条`);
});

console.log(`词库拆分完成：${byName.size} 个词条 / ${senseCount} 条释义`);
