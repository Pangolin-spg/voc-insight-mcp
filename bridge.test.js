import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBridge, requireKey } from './bridge.js';

async function session(remote, run) {
  const server = createBridge(remote);
  const client = new Client({ name: 'test-client', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try { await Promise.all([server.connect(a), client.connect(b)]); await run(client); }
  finally { await Promise.allSettled([server.close(), client.close()]); }
}

test('reject missing and multiline credentials', () => {
  assert.throws(() => requireKey({}));
  assert.throws(() => requireKey({ PANGOLINFO_API_KEY: 'a\nb' }));
  assert.equal(requireKey({ PANGOLINFO_API_KEY: ' example ' }), 'example');
});

test('preserve live tool schema, annotations and cursor', async () => {
  const tool = { name: 'get_brand', description: 'Read brand', inputSchema: { type: 'object', properties: { brandId: { type: 'string' } }, required: ['brandId'] }, annotations: { readOnlyHint: true } };
  await session({ listTools: async params => { assert.equal(params.cursor, 'page2'); return { tools: [tool], nextCursor: 'page3' }; } }, async client => {
    const result = await client.listTools({ cursor: 'page2' });
    assert.deepEqual(result.tools, [tool]);
    assert.equal(result.nextCursor, 'page3');
  });
});

test('forward arguments and preserve structured tool error result', async () => {
  const result = { content: [{ type: 'text', text: 'Insufficient credits' }], isError: true, structuredContent: { code: 'INSUFFICIENT_CREDITS' } };
  await session({ callTool: async params => { assert.equal(params.name, 'create_space'); assert.deepEqual(params.arguments, { name: 'Example' }); return result; } }, async client => {
    assert.deepEqual(await client.callTool({ name: 'create_space', arguments: { name: 'Example' } }), result);
  });
});

test('do not leak transport exception details or retry calls', async () => {
  let calls = 0;
  await session({ callTool: async () => { calls++; throw new Error('secret-key-in-transport-error'); } }, async client => {
    await assert.rejects(client.callTool({ name: 'refresh_brand', arguments: {} }), error => !error.message.includes('secret-key') && error.message.includes('before retrying'));
    assert.equal(calls, 1);
  });
});
