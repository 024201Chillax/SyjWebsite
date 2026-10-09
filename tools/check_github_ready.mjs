import {execFileSync} from 'node:child_process';
import {statSync} from 'node:fs';

const limit = 100 * 1024 * 1024;
let files;
try {
  files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {encoding: 'utf8'})
    .split('\0').filter(Boolean);
} catch {
  console.error('请先在项目目录执行 git init，再运行上传检查。');
  process.exit(1);
}
const blocked = [];
let bytes = 0;
for (const file of new Set(files)) {
  let size;
  try { size = statSync(file).size; } catch { continue; }
  bytes += size;
  if (size > limit) blocked.push(`${file}: ${(size / 1024 / 1024).toFixed(1)} MiB，超过 100 MiB`);
  if (/(^|\/)\.env(?:\.|$)/.test(file) && file !== '.env.example') blocked.push(`${file}: 环境变量文件不应提交`);
  if (/^(node_modules|\.next|\.pnpm-store|\.tmp|tmp|tmp_[^/]+|outputs)\//.test(file)) blocked.push(`${file}: 本地产物不应提交`);
}
if (blocked.length) {
  console.error(blocked.join('\n'));
  process.exit(1);
}
console.log(`上传范围检查通过：${new Set(files).size} 个文件，合计 ${(bytes / 1024 / 1024).toFixed(1)} MiB，无超限单文件或私密环境变量文件。`);
