#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export const ENDPOINT = 'https://voc.pangolinfo.com/mcp';

export function requireKey(env) {
  const key = env.PANGOLINFO_API_KEY?.trim();
  if (!key || /[\r\n]/.test(key)) throw new Error('Set PANGOLINFO_API_KEY to a valid API key.');
  return key;
}

// Forward live schemas, pagination and results; do not invent tool arguments.
export function createBridge(remote) {
  const server = new Server({ name: 'pangolinfo-voc-insight-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async request => {
    try { return await remote.listTools(request.params); }
    catch { throw new McpError(ErrorCode.InternalError, 'Unable to list VOC tools. Check access and reconnect.'); }
  });
  server.setRequestHandler(CallToolRequestSchema, async request => {
    try {
      return await remote.callTool(request.params);
    } catch {
      // A timeout is not proof that a paid operation failed; never retry automatically.
      throw new McpError(ErrorCode.InternalError, 'VOC request failed or timed out. Check remote task status before retrying paid operations.');
    }
  });
  return server;
}

export async function main() {
  if (process.argv.includes('--help')) {
    console.log('Pangolinfo VOC Insight MCP\nRun: PANGOLINFO_API_KEY=<key> node bridge.js\nRequires Node.js 22+; endpoint: ' + ENDPOINT);
    return;
  }
  const key = requireKey(process.env);
  const remote = new Client({ name: 'pangolinfo-voc-insight-bridge', version: '0.1.0' }, { capabilities: {} });
  const local = createBridge(remote);
  let closing;
  const close = () => closing ??= Promise.allSettled([local.close(), remote.close()]);
  const stop = () => { void close().finally(() => process.exit(0)); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  local.onclose = () => { void close(); };
  try {
    await remote.connect(new StreamableHTTPClientTransport(new URL(ENDPOINT), {
      requestInit: { headers: { Authorization: `Bearer ${key}` }, redirect: 'error' }
    }));
    await local.connect(new StdioServerTransport());
  } catch {
    await close();
    throw new Error('Unable to connect to VOC Insight MCP. Check your key, network and account access.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
