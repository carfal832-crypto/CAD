import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const result = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', outfile: 'dist/standalone.js', write: false });
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
await mkdir('dist', { recursive: true });
await writeFile('dist/formverkstan.html', `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Formverkstan</title><style>${css}</style></head><body><div id="app"></div><script>${js}</script></body></html>`);
console.log('Created dist/formverkstan.html — open directly in a browser.');
