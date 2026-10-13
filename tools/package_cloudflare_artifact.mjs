import {readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

// Public assets are already in the source checkout used for deployment. Package
// the newly generated files and compiled Worker, avoiding a second media copy.
const excludes = [];
async function visit(directory, relative = '') {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const child = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await visit(path.join(directory, entry.name), child);
    else excludes.push(`.open-next/assets/${child}`);
  }
}
await visit('public');
await writeFile('cloudflare-build/asset-excludes.txt', excludes.join('\n') + '\n');
console.log(`Packaged compiled output separately from ${excludes.length} source assets.`);
