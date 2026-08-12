import assert from 'node:assert/strict';
import { readFile, access, mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
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
assert.equal(packageJson.scripts.build, 'astro build');
assert.equal(packageJson.scripts.check, 'astro check');
assert.equal(packageJson.scripts.test, 'node tests/validate-site.mjs');
assert.match(packageJson.devDependencies.astro, /^\^7\./);

const astroConfig = await load('astro.config.mjs');
assert.match(astroConfig, /site:\s*['"]https:\/\/loopallan\.github\.io['"]/);
assert.match(astroConfig, /base:\s*['"]\/static-web\/taiwan-2026-08['"]/);
assert.match(astroConfig, /output:\s*['"]static['"]/);

const pagesConfig = JSON.parse(await load('pages.config.json'));
assert.equal(pagesConfig.slug, 'taiwan-2026-08');
assert.equal(pagesConfig.branch, 'trip/taiwan-2026-08');
assert.equal(pagesConfig.pagesBranch, 'gh-pages');

const page = await load('src/pages/index.astro');
const styles = await load('src/styles/global.css');
for (const marker of [
  '2026 家庭環臺旅行',
  '8/13（四）',
  '8/14（五）',
  '8/15（六）',
  '8/16（日）',
  '宜蘭傳藝園區',
  '台泥 DAKA',
  '國立海洋生物博物館',
  '06:15 前出發',
  '出現預警性封閉就停止跨區移動',
  'https://168.thb.gov.tw/',
  'https://1968.freeway.gov.tw/',
  'https://www.cwa.gov.tw/',
]) assert.match(page, new RegExp(marker.replaceAll('/', '\\/')));
for (const day of ['day-1', 'day-2', 'day-3', 'day-4']) {
  assert.match(page, new RegExp(`id=["']${day}["']`));
}
assert.match(page, /<header/);
assert.match(page, /<nav/);
assert.match(page, /<main/);
assert.match(page, /<footer/);
assert.match(page, /class=["']skip-link["']/);
assert.match(page, /class=["']route-art["'][^>]*role=["']img["']/);
assert.match(page, /class=["']table-wrap["'][^>]*role=["']region["']/);
assert.doesNotMatch(page, /<script[^>]+src=["']https?:/i);
assert.match(styles, /@media\s*\(max-width:\s*720px\)/);
assert.match(styles, /:focus-visible/);
assert.match(styles, /overflow-x:\s*auto/);
assert.match(styles, /\.timeline\s*>\s*li\s*>\s*div\s*\{\s*min-width:\s*0/);
assert.match(styles, /grid-template-columns:\s*3rem\s+minmax\(0,\s*1fr\)/);
assert.doesNotMatch(styles, /\.timeline\s+li\s*\{/);
assert.equal((page.match(/class=["']fact-row["'][^>]*tabindex=["']0["']/g) ?? []).length, 2);
assert.match(styles, /\.day-banner dt\s*\{[^}]*color:\s*#fff[^}]*opacity:\s*1/);

const relativeLuminance = (hex) => {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (foreground, background) => {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
for (const [foreground, background] of [
  ['#ffffff', '#c42447'],
  ['#c42447', '#ffffff'],
  ['#ff9eb0', '#222222'],
  ['#ffffff', '#b53b49'],
  ['#ffffff', '#246c69'],
  ['#ffffff', '#8d5c19'],
  ['#ffffff', '#5b5469'],
  ['#ffffff', '#a65342'],
]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} must meet WCAG AA`);
for (const marker of ['--accent: #c42447', '#8f3446', '#b53b49', '#19555a', '#246c69', '#765018', '#8d5c19', '#a65342', '.checklist-copy .eyebrow']) {
  assert.match(styles, new RegExp(escapeRegExp(marker)));
}

const temp = await mkdtemp(join(tmpdir(), 'pages-index-'));
await mkdir(join(temp, 'older-trip'));
await writeFile(join(temp, 'older-trip', 'index.html'), '<!doctype html><title>保留的舊旅行</title>');
await mkdir(join(temp, pagesConfig.slug));
await writeFile(join(temp, pagesConfig.slug, 'index.html'), '<!doctype html><title>2026 家庭環臺旅行</title>');
await execFileAsync('python3', [fileURLToPath(new URL('../scripts/render-pages-index.py', import.meta.url)), temp]);
const pagesIndex = await readFile(join(temp, 'index.html'), 'utf8');
assert.match(pagesIndex, /2026 家庭環臺旅行/);
assert.match(pagesIndex, /taiwan-2026-08\//);
assert.match(pagesIndex, /保留的舊旅行/);
assert.match(pagesIndex, /older-trip\//);
await mkdir(join(temp, '\\evil.example'));
await writeFile(join(temp, '\\evil.example', 'index.html'), '<!doctype html><title>不安全站點</title>');
await assert.rejects(execFileAsync('python3', [fileURLToPath(new URL('../scripts/render-pages-index.py', import.meta.url)), temp]));

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

const workflow = await load('.github/workflows/deploy-pages.yml');
for (const marker of [
  'trip/taiwan-2026-08',
  'actions/checkout@v4',
  'actions/setup-node@v4',
  'actions/upload-artifact@v4',
  'actions/download-artifact@v4',
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v3',
  'actions/deploy-pages@v4',
  'gh-pages',
  'taiwan-2026-08',
  'cancel-in-progress: false',
  'git ls-remote --exit-code --heads',
  'remote_status=$?',
  'refusing to rebuild from an empty tree',
  'EXPECTED_REF: refs/heads/trip/taiwan-2026-08',
  'GIT_ASKPASS',
  'Validate build artifact tree',
  'assert-safe-pages-tree.py pages-site --allow-git',
  'git -C pages-site archive --format=tar HEAD',
  'assert-safe-pages-tree.py pages-artifact',
  'path: pages-artifact',
]) assert.match(workflow, new RegExp(escapeRegExp(marker)));
assert.doesNotMatch(workflow, /enablement:\s*true/);
assert.match(workflow, /build:\s+[\s\S]*?permissions:\s+contents:\s+read/);
assert.match(workflow, /deploy:\s+[\s\S]*?permissions:\s+contents:\s+write\s+pages:\s+write\s+id-token:\s+write/);
assert.doesNotMatch(workflow, /path:\s*pages-site/);
assert.doesNotMatch(workflow, /x-access-token:\$\{GITHUB_TOKEN\}/);

const pagesIndexRenderer = await load('scripts/render-pages-index.py');
assert.match(pagesIndexRenderer, /#c42447/);

console.log('Site architecture contract passed.');
