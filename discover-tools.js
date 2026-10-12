// Programmatic MCP discovery example. No collection or analysis tool is called.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ENDPOINT, requireKey } from './bridge.js';

const client = new Client({ name: 'voc-tool-discovery', version: '0.1.0' });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(ENDPOINT), {
    requestInit: { headers: { Authorization: `Bearer ${requireKey(process.env)}` }, redirect: 'error' }
  }));
  let cursor;
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined);
    console.log(JSON.stringify(page.tools, null, 2));
    cursor = page.nextCursor;
  } while (cursor);
} catch {
  console.error('Tool discovery failed. Check your key, access and network.');
  process.exitCode = 1;
} finally { await client.close(); }
