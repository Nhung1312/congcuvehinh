/**
 * Offline tests for the actual Vercel API entrypoint.
 * No API key is used and no Gemini generation requests are made.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../api/geometry/parse';

const url = 'http://localhost/api/geometry/parse';
const request = (method: string, body?: unknown): Request =>
  new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

test('GET diagnostics initializes Gemini code without requiring any key', async () => {
  const response = await handler.fetch(request('GET'));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.status, 'ok');
  assert.equal(payload.geminiApi, 'not_checked');
  assert.equal(payload.model, 'gemini-3.8-flash');
});

test('POST rejects empty prompt as 400, without invoking Gemini', async () => {
  const response = await handler.fetch(request('POST', { prompt: '', apiKey: 'FAKE_KEY' }));
  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, 'INVALID_PROMPT');
});

test('POST rejects missing personal API key as 400', async () => {
  const response = await handler.fetch(request('POST', { prompt: 'Cho tam giác ABC' }));
  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, 'MISSING_API_KEY');
});

test('POST rejects malformed JSON instead of returning an HTTP 500', async () => {
  const malformed = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  const response = await handler.fetch(malformed);
  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, 'INVALID_JSON');
});

test('Unsupported methods are 405', async () => {
  const response = await handler.fetch(request('PUT'));
  assert.equal(response.status, 405);
});
