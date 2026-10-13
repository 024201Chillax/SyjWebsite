import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {VIDEO_BYTES} from '../cloudflare/video-range.mjs';

const root = process.cwd();
const limit = 25 * 1024 * 1024;
const ignored = new Set((await readFile('public/.assetsignore', 'utf8')).split(/\r?\n/).filter(Boolean).map(p => p.replace(/^\//, '')));
const failures = [];
let count = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(file);
    else {
      const relative = path.relative(path.join(root, 'public'), file).split(path.sep).join('/');
      if (ignored.has(relative)) continue;
      const info = await stat(file);
      if (info.size > limit) failures.push(`${relative}: ${(info.size / 1024 / 1024).toFixed(2)} MiB exceeds 25 MiB`);
      count++;
    }
  }
}
await visit(path.join(root, 'public'));
const video = await stat('public/playground/maxxxine/motion-cloudflare.mp4').catch(() => null);
if (!video?.size) failures.push('Cloudflare video is missing or empty');
else if (video.size !== VIDEO_BYTES) failures.push('Update VIDEO_BYTES to match the upload video before deploying');
if (!(await readFile('components/PlaygroundWall.tsx', 'utf8')).includes('/playground/maxxxine/motion-cloudflare.mp4')) {
  failures.push('The playground must reference the Cloudflare video');
}
const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
if (config.r2_buckets?.length) failures.push('This deployment must not require R2');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${count} static assets checked; upload video ${(video.size / 1024 / 1024).toFixed(2)} MiB; no R2 required.`);
}
