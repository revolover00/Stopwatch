/**
 * Screenshot capture for the visual verification loop.
 *
 * Uses the static Chromium build shipped on npm (@sparticuz/chromium) because the
 * Playwright browser CDN is not reachable from this environment.
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const BASE = process.env['BASE_URL'] ?? 'http://127.0.0.1:5173';
const OUT = 'screenshots';

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/stopwatch/', name: 'stopwatch' },
  { path: '/timer/', name: 'timer' },
  { path: '/countdown/', name: 'countdown' },
  { path: '/alarm/', name: 'alarm' },
  { path: '/study-timer/', name: 'study' },
];

const executablePath = await chromium.executablePath();

// The npm Chromium build expects Amazon-Linux shared libraries; they ship as
// `al2023.tar.br` inside the package. Extract them (once) and put them on the
// loader path so the binary can start in this sandbox.
const libDir = '/tmp/al2023/lib';
if (!existsSync(libDir)) {
  const { brotliDecompressSync } = await import('node:zlib');
  const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync('/tmp/al2023', { recursive: true });
  writeFileSync(
    '/tmp/al2023.tar',
    brotliDecompressSync(readFileSync('node_modules/@sparticuz/chromium/bin/al2023.tar.br')),
  );
  const { execSync } = await import('node:child_process');
  execSync('tar -xf /tmp/al2023.tar -C /tmp/al2023');
}

process.env['LD_LIBRARY_PATH'] = `${libDir}:${process.env['LD_LIBRARY_PATH'] ?? ''}`;
if (!existsSync(executablePath)) {
  console.error(`Chromium binary missing at ${executablePath}`);
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--font-render-hinting=none',
    '--force-color-profile=srgb',
  ],
  defaultViewport: null,
  executablePath,
  headless: 'shell',
  timeout: 60_000,
  env: { ...process.env, LD_LIBRARY_PATH: process.env['LD_LIBRARY_PATH'] },
});

const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(String(error)));

const only = process.argv[2];

for (const viewport of VIEWPORTS) {
  if (only && only !== viewport.name) continue;
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle0', timeout: 45_000 });
    // Let webfonts settle and the flip cards paint.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await new Promise((resolve) => setTimeout(resolve, 450));

    const file = `${OUT}/${route.name}-${viewport.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const metrics = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }));
    console.log(`${file}  ${metrics.width}x${metrics.height}${metrics.overflow ? '  ⚠ horizontal overflow' : ''}`);
  }
}

await browser.close();

if (consoleErrors.length > 0) {
  console.log('\nConsole errors:');
  for (const error of consoleErrors) console.log(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\nNo console errors during capture.');
