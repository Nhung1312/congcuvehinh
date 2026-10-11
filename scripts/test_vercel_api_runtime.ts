/** Verify emitted API files with plain Node, without tsx or a bundler at runtime. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// This child has no TS loader. Importing the emitted files reproduces a Vercel
// cold start, including imports in every runtime dependency of the API.
const checks = String.raw`
import assert from 'node:assert/strict';
const base = process.argv[1];
const api = await import(new URL('api/geometry/parse.js', base));
const health = await import(new URL('api/health.js', base));
let calls = [];
let failWithQuota = false;
const fixture = {
  title: 'Tam giác ABC', shapeCategory: 'triangle',
  triangle: { type: 'general', vertices: ['A', 'B', 'C'] },
  detectedEntities: ['A', 'B', 'C'], explanation: '',
};
// Exercise the real Google SDK and normalization with an offline HTTP response.
globalThis.fetch = async (url, options) => {
  calls.push({ url: String(url), headers: new Headers(options.headers),
    body: JSON.parse(options.body) });
  if (failWithQuota) return Response.json({
    error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' },
  }, { status: 429 });
  return Response.json({ candidates: [{
    content: { role: 'model', parts: [{ text: JSON.stringify(fixture) }] },
    finishReason: 'STOP',
  }] });
};

function request(body, method = 'POST') {
  return new Request('http://localhost/api/geometry/parse', {
    method, headers: { 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
}
function nodeResponse() {
  return { statusCode: 0, data: undefined, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

const healthWeb = await health.GET();
assert.equal(healthWeb.status, 200);
assert.equal((await healthWeb.json()).status, 'ok');
assert.equal(healthWeb.headers.get('Cache-Control'), 'no-store');
const healthNode = nodeResponse();
await health.default({ method: 'GET' }, healthNode);
assert.equal(healthNode.statusCode, 200);

const methodResponse = await api.default(request(undefined, 'GET'));
assert.equal(methodResponse.status, 405);
assert.equal(methodResponse.headers.get('Cache-Control'), 'no-store');
const methodNode = nodeResponse();
await api.default({ method: 'GET' }, methodNode);
assert.equal(methodNode.statusCode, 405);

const noKey = await api.POST(request({ prompt: 'Cho tam giác ABC.' }));
assert.equal(noKey.status, 400);
assert.match((await noKey.json()).error, /API key/);
const invalidJson = await api.POST(new Request('http://localhost/api/geometry/parse', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad',
}));
assert.equal(invalidJson.status, 400);
const invalidImage = await api.POST(request({ prompt: '',
  image: { mimeType: 'image/svg+xml', data: 'bad' } }));
assert.equal(invalidImage.status, 400);
assert.equal(calls.length, 0);

const personal = await api.POST(request({ prompt: 'Cho tam giác ABC.',
  apiKey: 'offline-personal-key' }));
assert.equal(personal.status, 200);
const personalBody = await personal.json();
assert.equal(personalBody.success, true);
assert.equal(personalBody.spec.generationInfo.source, 'gemini');
assert.equal(personalBody.spec.generationInfo.model, 'gemini-3.8-flash');
assert.equal(personalBody.spec.generationInfo.keySource, 'API key cá nhân');
assert.equal(calls.at(-1).headers.get('x-goog-api-key'), 'offline-personal-key');
assert.ok(calls.at(-1).url.includes('gemini-3.8-flash'));
assert.deepEqual(personalBody.spec.triangle.vertices, ['A', 'B', 'C']);

process.env.GEMINI_API_KEY = 'offline-server-key';
const image = { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' };
const fromNode = nodeResponse();
await api.default({ method: 'POST', body: { prompt: '', image } }, fromNode);
assert.equal(fromNode.statusCode, 200);
assert.equal(fromNode.headers['Cache-Control'], 'no-store');
assert.equal(fromNode.data.spec.generationInfo.keySource, 'API key hệ thống (server)');
assert.equal(calls.at(-1).headers.get('x-goog-api-key'), 'offline-server-key');
assert.ok(calls.at(-1).body.contents[0].parts.some(part =>
  part.inlineData?.mimeType === image.mimeType && part.inlineData?.data === image.data));

const personalOverride = nodeResponse();
await api.default({ method: 'POST', body: { prompt: 'Cho tam giác ABC.',
  apiKey: 'offline-personal-key' } }, personalOverride);
assert.equal(personalOverride.statusCode, 200);
assert.equal(calls.at(-1).headers.get('x-goog-api-key'), 'offline-personal-key');

failWithQuota = true;
const quota = await api.POST(request({ prompt: 'Cho tam giác ABC.' }));
assert.equal(quota.status, 502);
const quotaBody = await quota.json();
assert.equal(quotaBody.code, 'GEMINI_UNAVAILABLE');
assert.match(quotaBody.error, /hạn mức|Quota/);
console.log('PASS: cold start, health, Node/Web handlers, validation, text/image, BYOK/env, quota');
`;

test('API khởi chạy và xử lý request sau khi biên dịch thành ESM production', () => {
  // Put the emitted files inside the project so standard node_modules lookup
  // finds exactly the installed SDK, with no runtime resolution shortcuts.
  const output = mkdtempSync(join(root, '.api-runtime-test-'));
  try {
    const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
    assert.equal(config.error, undefined);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([
      join(root, 'api/health.ts'), join(root, 'api/geometry/parse.ts'),
    ], { ...parsed.options, noEmit: false, noEmitOnError: true,
      allowImportingTsExtensions: false, rootDir: root, outDir: output,
      sourceMap: false, declaration: false });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(
      diagnostics, { getCanonicalFileName: value => value,
        getCurrentDirectory: () => root, getNewLine: () => '\n' }));
    const emitted = program.emit();
    assert.equal(emitted.emitSkipped, false);
    writeFileSync(join(output, 'package.json'), JSON.stringify({ type: 'module' }));
    const result = spawnSync(process.execPath, [
      '--input-type=module', '--eval', checks, pathToFileURL(output + '/').href,
    ], { cwd: root, encoding: 'utf8', timeout: 20_000,
      env: { ...process.env, GEMINI_API_KEY: '', NODE_ENV: 'production' } });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /PASS: cold start/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
