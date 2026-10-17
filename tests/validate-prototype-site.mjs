import assert from 'node:assert/strict';
import { access, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const load = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => access(new URL(`../${path}`, import.meta.url));

await Promise.all([
  exists('astro.config.mjs'),
  exists('src/pages/index.astro'),
  exists('.github/workflows/deploy-pages.yml'),
  exists('pages.config.json'),
  exists('scripts/render-pages-index.py'),
  exists('scripts/assert-safe-pages-tree.py'),
]);

const packageJson = JSON.parse(await load('package.json'));
assert.equal(packageJson.name, 'tossbox-map-prototype');
assert.equal(packageJson.scripts.build, 'astro build');
assert.equal(packageJson.scripts.check, 'astro check');
assert.equal(packageJson.scripts.test, 'node tests/validate-prototype-site.mjs');
assert.match(packageJson.devDependencies.astro, /^\^7\./);

const astroConfig = await load('astro.config.mjs');
assert.match(astroConfig, /site:\s*['"]https:\/\/loopallan\.github\.io['"]/);
assert.match(astroConfig, /base:\s*['"]\/static-web\/tossbox-prototype-v1['"]/);
assert.match(astroConfig, /output:\s*['"]static['"]/);

const pagesConfig = JSON.parse(await load('pages.config.json'));
assert.deepEqual(pagesConfig, {
  branch: 'site/tossbox-prototype-v1',
  slug: 'tossbox-prototype-v1',
  pagesBranch: 'gh-pages',
  title: 'TossBox · 地圖優先 Prototype',
});

const page = await load('src/pages/index.astro');
for (const marker of [
  'TossBox · 地圖優先 Prototype',
  'PlaceResolution',
  '先選一個，出發吧',
  '這筆收藏從哪裡來？',
  '其他辨識候選',
  '資料查詢',
  '這是 prototype：不會開啟真實導航',
]) assert.match(page, new RegExp(escapeRegExp(marker)));
assert.match(page, /<meta name="description"/);
assert.match(page, /<button class="place-pin selected"/);
assert.match(page, /data-filter="coffee"/);
assert.match(page, /detail\.classList\.add\('open'\)/);
assert.doesNotMatch(page, /googleapis\.com|maps\.google\.com|api[_-]?key/i);

const workflow = await load('.github/workflows/deploy-pages.yml');
for (const marker of [
  'trip/taiwan-2026-08',
  'site/tossbox-prototype-v1',
  'taiwan-2026-08',
  'tossbox-prototype-v1',
  'actions/checkout@v4',
  'actions/setup-node@v4',
  'actions/upload-artifact@v4',
  'actions/download-artifact@v4',
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v3',
  'actions/deploy-pages@v4',
  'gh-pages',
  'cancel-in-progress: false',
  'git ls-remote --exit-code --heads',
  'refusing to rebuild from an empty tree',
  'assert-safe-pages-tree.py pages-site --allow-git',
  'git -C pages-site archive --format=tar HEAD',
  'path: pages-artifact',
]) assert.match(workflow, new RegExp(escapeRegExp(marker)));
assert.match(workflow, /build:\s+[\s\S]*?permissions:\s+contents:\s+read/);
assert.match(workflow, /deploy:\s+[\s\S]*?permissions:\s+contents:\s+write\s+pages:\s+write\s+id-token:\s+write/);
assert.doesNotMatch(workflow, /path:\s*pages-site/);

const renderer = fileURLToPath(new URL('../scripts/render-pages-index.py', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'pages-index-'));
await mkdir(join(temp, 'taiwan-2026-08'));
await writeFile(join(temp, 'taiwan-2026-08', 'index.html'), '<!doctype html><title>2026 家庭環臺旅行</title>');
await mkdir(join(temp, pagesConfig.slug));
await writeFile(join(temp, pagesConfig.slug, 'index.html'), '<!doctype html><title>TossBox · 地圖優先 Prototype</title>');
await execFileAsync('python3', [renderer, temp]);
const pagesIndex = await readFile(join(temp, 'index.html'), 'utf8');
assert.match(pagesIndex, /2026 家庭環臺旅行/);
assert.match(pagesIndex, /taiwan-2026-08\//);
assert.match(pagesIndex, /TossBox · 地圖優先 Prototype/);
assert.match(pagesIndex, /tossbox-prototype-v1\//);

const safetyScript = fileURLToPath(new URL('../scripts/assert-safe-pages-tree.py', import.meta.url));
const safeTree = await mkdtemp(join(tmpdir(), 'safe-pages-tree-'));
await writeFile(join(safeTree, 'index.html'), '<!doctype html><title>安全頁面</title>');
await execFileAsync('python3', [safetyScript, safeTree]);
const linkedRoot = `${safeTree}-link`;
await symlink(safeTree, linkedRoot);
await assert.rejects(execFileAsync('python3', [safetyScript, linkedRoot]));
await rm(linkedRoot);
await symlink('/etc/passwd', join(safeTree, 'escape'));
await assert.rejects(execFileAsync('python3', [safetyScript, safeTree]));
await rm(join(safeTree, 'escape'));
for (const controlFile of ['.gitignore', '.gitattributes', '.gitmodules']) {
  await writeFile(join(safeTree, controlFile), '*');
  await assert.rejects(execFileAsync('python3', [safetyScript, safeTree]));
  await rm(join(safeTree, controlFile));
}
await mkdir(join(safeTree, '.git'));
await assert.rejects(execFileAsync('python3', [safetyScript, safeTree]));

const gitlinkTree = await mkdtemp(join(tmpdir(), 'gitlink-pages-tree-'));
await execFileAsync('git', ['init', gitlinkTree]);
await execFileAsync('git', ['-C', gitlinkTree, 'config', 'user.name', 'test']);
await execFileAsync('git', ['-C', gitlinkTree, 'config', 'user.email', 'test@example.com']);
await writeFile(join(gitlinkTree, 'index.html'), '<!doctype html><title>安全頁面</title>');
await execFileAsync('git', ['-C', gitlinkTree, 'add', 'index.html']);
await execFileAsync('git', ['-C', gitlinkTree, 'commit', '-m', 'safe tree']);
await execFileAsync('python3', [safetyScript, gitlinkTree, '--allow-git']);
const gitlinkObject = (await execFileAsync('git', ['-C', gitlinkTree, 'rev-parse', 'HEAD'])).stdout.trim();
await execFileAsync('git', ['-C', gitlinkTree, 'update-index', '--add', '--cacheinfo', `160000,${gitlinkObject},vendor/evil`]);
await assert.rejects(execFileAsync('python3', [safetyScript, gitlinkTree, '--allow-git']));

console.log('TossBox prototype site contract passed.');
