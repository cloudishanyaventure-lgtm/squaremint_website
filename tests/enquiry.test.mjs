import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/enquiry.js';
const valid = { name: 'Test Person', email: 'person@example.com', city: 'Bengaluru', interest: 'buy', consent: 'on', website: '' };
function request(data = valid, headers = {}) {
  return new Request('https://nextnest.example/api/enquiry', { method: 'POST', headers: { Origin: 'https://nextnest.example', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
test('unconfigured delivery is explicitly unavailable, never fake success', async () => {
  const response = await onRequestPost({ request: request(), env: {} });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not connected/);
});
test('cross-origin form submissions are refused', async () => {
  assert.equal((await onRequestPost({ request: request(valid, { Origin: 'https://elsewhere.example' }), env: {} })).status, 403);
});
test('malformed inputs, missing consent, invalid interest, and bot field are rejected', async () => {
  for (const data of [null, { ...valid, email: 'bad-email' }, { ...valid, consent: '' }, { ...valid, interest: 'toString' }, { ...valid, website: 'spam' }, { ...valid, name: ' ' }, { ...valid, city: 'Unknown' }]) {
    assert.equal((await onRequestPost({ request: request(data), env: {} })).status, 400);
  }
});
test('oversized payload is rejected even without Content-Length', async () => {
  const response = await onRequestPost({ request: request({ ...valid, property: 'x'.repeat(5000) }), env: {} });
  assert.equal(response.status, 413);
});
test('delivery reports success only after provider acceptance and handles failure', async t => {
  const env = { RESEND_API_KEY: 'test-key', ENQUIRY_TO: 'owner@example.com', ENQUIRY_FROM: 'website@example.com' };
  const fetch = t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://api.resend.com/emails');
    const body = JSON.parse(init.body);
    assert.deepEqual(body.to, ['owner@example.com']);
    assert.equal(body.reply_to, valid.email);
    assert.match(body.text, /Contact consent: provided/);
    return new Response(JSON.stringify({ id: 'test-message' }), { status: 200 });
  });
  assert.equal((await onRequestPost({ request: request(), env })).status, 200);
  fetch.mock.mockImplementation(async () => new Response('{}', { status: 500 }));
  assert.equal((await onRequestPost({ request: request(), env })).status, 502);
  fetch.mock.mockImplementation(async () => { throw new Error('Network error'); });
  assert.equal((await onRequestPost({ request: request(), env })).status, 502);
});
