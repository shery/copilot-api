# Copilot API CLI Guide

This guide covers running Copilot API locally from the command line. The CLI listens on `127.0.0.1` by default and generates an API key on first startup.

## 1. Choose a runtime

Run the published package:

```sh
npx @jeffreycao/copilot-api@latest --help
```

If Bun is installed, use it to enable complete token usage storage:

```sh
bunx --bun @jeffreycao/copilot-api@latest --help
```

Run from source:

```sh
bun install --frozen-lockfile
bun run start --help
```

The examples below use `npx @jeffreycao/copilot-api@latest`. Replace it with `bun run start` when running from source.

## 2. Authenticate a provider

For GitHub Copilot:

```sh
npx @jeffreycao/copilot-api@latest auth login --provider copilot
```

Complete the GitHub Device Flow shown in the terminal. An active GitHub Copilot subscription is required.

Other providers can be configured in the same way:

```sh
npx @jeffreycao/copilot-api@latest auth login --provider codex
npx @jeffreycao/copilot-api@latest auth login --provider dashscope
npx @jeffreycao/copilot-api@latest auth login --provider deepseek
npx @jeffreycao/copilot-api@latest auth login --provider openrouter
npx @jeffreycao/copilot-api@latest auth login --provider custom
```

## 3. Start the local server

```sh
npx @jeffreycao/copilot-api@latest start
```

Default endpoint:

```text
http://localhost:4141
```

The first startup generates two separate keys in `config.json`:

- `auth.apiKeys[0]`: use this for OpenAI, Anthropic, Claude Code, and other regular clients.
- `auth.adminApiKey`: reserved for `/admin/*`; do not give it to regular clients.

Configuration paths:

| Platform | Path |
| --- | --- |
| Linux/macOS | `~/.local/share/copilot-api/config.json` |
| Windows | `%USERPROFILE%\.local\share\copilot-api\config.json` |

Show the resolved paths and authentication status:

```sh
npx @jeffreycao/copilot-api@latest debug
```

## 4. Verify the server

The root health check does not require authentication:

```sh
curl http://localhost:4141/
```

Every other endpoint requires a regular key from `auth.apiKeys`:

```sh
curl http://localhost:4141/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

The following header is also accepted:

```http
x-api-key: YOUR_API_KEY
```

## 5. Configure a client

### OpenAI-compatible clients

```text
Base URL: http://localhost:4141/v1
API Key:  auth.apiKeys[0] from config.json
```

### Anthropic SDK

```sh
export ANTHROPIC_BASE_URL=http://localhost:4141
export ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY
```

### Claude Code

```sh
npx @jeffreycao/copilot-api@latest start --claude-code
```

This generates a Claude Code environment command from the available models and copies it to the clipboard. The clipboard content contains the local API key; do not paste it into chats, issues, or logs.

## 6. Common options

```sh
# Change the port
npx @jeffreycao/copilot-api@latest start --port 8080

# Use proxy environment variables
npx @jeffreycao/copilot-api@latest start --proxy-env

# Use a specific data directory
npx @jeffreycao/copilot-api@latest --api-home=/safe/path start
```

Security defaults:

- Do not enable `--show-token`.
- Avoid `--verbose` when processing sensitive code because detailed logs contain requests and responses.
- Do not pass long-lived tokens through `--github-token`; prefer the protected credential file created by `auth login`.

## 7. Remote access

The default `127.0.0.1` binding only accepts local connections. Use the following only when LAN or reverse-proxy access is explicitly required:

```sh
npx @jeffreycao/copilot-api@latest start --host 0.0.0.0
```

Before exposing the listener:

1. Keep a non-empty, random `auth.apiKeys` value.
2. Restrict source addresses with a firewall.
3. Put public access behind an HTTPS reverse proxy.
4. Never expose the configuration, credential, or log directories.

For a local-only Docker mapping:

```sh
docker run \
  -p 127.0.0.1:4141:4141 \
  -v "$(pwd)/copilot-data:/root/.local/share/copilot-api" \
  copilot-api
```

The image entrypoint binds the service to all interfaces inside the container while the host-side `127.0.0.1:4141:4141` mapping keeps access local.

## 8. Usage and diagnostics

The CLI does not serve a browser Usage Viewer. Use the desktop app or call the protected endpoints directly:

```sh
curl http://localhost:4141/usage \
  -H "x-api-key: YOUR_API_KEY"

curl "http://localhost:4141/token-usage?period=week" \
  -H "x-api-key: YOUR_API_KEY"
```

Print environment and path diagnostics:

```sh
npx @jeffreycao/copilot-api@latest debug --json
```

## 9. Update

Commands using `@latest` resolve the latest published package. When running from source:

```sh
git pull
bun install --frozen-lockfile
bun run build
```
