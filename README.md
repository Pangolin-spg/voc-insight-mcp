# Pangolinfo VOC Insight MCP

**Voice of Customer and Social Listening for AI Agents.**

Connect a local stdio MCP client to [Pangolinfo VOC Insight MCP](https://www.pangolinfo.com/voc-insight-mcp/). This small bridge forwards tool discovery and calls to the existing hosted service; it does not implement its own scraper or sentiment model.

[中文产品介绍](https://www.pangolinfo.com/zh/voc-insight-mcp-zh/) · [Connection documentation](https://docs.pangolinfo.com/cn-help-center/mcp/voc-insight/connect) · [Tool reference](https://docs.pangolinfo.com/cn-help-center/mcp/voc-insight/tools) · [Usage pricing](https://docs.pangolinfo.com/cn-help-center/mcp/voc-insight/pricing)

## What it connects

The hosted service supports brand feedback research, sentiment trends, competitor voice share and source-post exploration. Start with an existing brand report, find the conversations behind a result, then use those sources to guide further research. Tool names and argument schemas are discovered at runtime, rather than hard-coded to a fixed catalog size.

Default sources documented by Pangolinfo include TikTok, Instagram, YouTube, X, Facebook, Pinterest and Trustpilot. Threads and Reddit are available on request. Amazon reviews require full brand onboarding with an ASIN or product URL; they are not part of the default social collection scope. Mainland China social platforms are not supported.

## Install and run

Requires Node.js 22+ and a Pangolinfo API key with VOC access.

Download this repository, enter its directory, and run:

```sh
npm install
node bridge.js --help
```

Set `PANGOLINFO_API_KEY` through your local environment or secret manager, then run `node bridge.js`. Keep keys out of source control. The bridge uses the documented `https://voc.pangolinfo.com/mcp` endpoint with a Bearer header.

For a client that launches local stdio servers, replace the example path and key in its private configuration:

```json
{
  "mcpServers": {
    "pangolinfo-voc": {
      "command": "node",
      "args": ["/absolute/path/to/voc-insight-mcp/bridge.js"],
      "env": { "PANGOLINFO_API_KEY": "YOUR_PRIVATE_API_KEY" }
    }
  }
}
```

For clients that already support remote Streamable HTTP, no bridge is required:

```json
{
  "mcpServers": {
    "pangolinfo-voc": {
      "url": "https://voc.pangolinfo.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_PRIVATE_API_KEY" }
    }
  }
}
```

## Example research workflow

1. Ask your agent to list available VOC tools and inspect the relevant schemas.
2. Find an existing brand and read its current sentiment and source posts.
3. Compare feedback across platforms and link conclusions to the underlying evidence.
4. Before creating a space, refreshing collection or generating analysis, review the hosted service's cost estimate and explicitly authorize the operation in your client.

Example prompt: “Use my existing brand report to identify recurring purchase concerns. Show supporting source posts and separate observations from interpretation. Ask before starting any new collection or paid analysis.”

`node discover-tools.js` demonstrates programmatic discovery using the MCP SDK. It lists schemas only and does not call business tools. This is an MCP example, not a standalone REST API SDK.

## Behavior and limits

- Forwards `tools/list` pagination and `tools/call` arguments, structured results and tool errors.
- Supports tool operations only; it does not proxy resources, prompts, subscriptions or OAuth.
- Does not automatically retry failed tool calls, because a timed-out collection or analysis may already have been accepted and charged.
- The hosted catalog includes write and paid operations. This bridge is not a read-only access boundary and does not add an approval dialog; use client-side approvals.
- Source availability, account permissions and prices are controlled by the hosted service. Local bridge code being free does not make remote collection or analysis free.
- Persona interviews, when used, are simulated analysis, not real customer testimony.

## Validation

```sh
npm test
```

Tests use in-memory MCP transports to check protocol forwarding, pagination, error handling and absence of automatic retries. They do not contact production, spend credits or establish compatibility with every AI client. Live authenticated VOC calls have not been verified for this release.

## License

MIT applies to the code in this repository only. Pangolinfo's hosted service, data access and billing remain subject to its service terms.
