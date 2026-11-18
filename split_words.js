// 构建脚本：把 hint_data/words.json 按首字母拆成 a-z 分片，供扩展按需加载。
// 运行 `npm run build`，或由 `vsce package` 的 vscode:prepublish 自动执行。
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'hint_data', 'words.json');
const dstDir = path.join(__dirname, 'hint_data');

if (!fs.existsSync(srcPath)) {
  console.error('words.json 不存在，请确认路径！');
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const chunks = {};

// 按首字母分组
words.forEach(word => {
  if (!word.name || typeof word.name !== 'string') return;
  const first = word.name[0].toLowerCase();
  if (!first.match(/[a-z]/)) return; // 只处理 a-z 开头
  if (!chunks[first]) chunks[first] = [];
  chunks[first].push(word);
});

// 写入各分块文件
Object.keys(chunks).forEach(letter => {
  const filePath = path.join(dstDir, `${letter}.json`);
  fs.writeFileSync(filePath, JSON.stringify(chunks[letter], null, 2), 'utf8');
  console.log(`写入 ${filePath}，共 ${chunks[letter].length} 条`);
});

console.log('词库拆分完成！');
