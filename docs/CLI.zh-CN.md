# Copilot API CLI 使用指南

本指南面向通过命令行在本机运行 Copilot API 的用户。CLI 默认只监听 `127.0.0.1`，并在首次启动时自动生成 API Key。

## 1. 选择运行方式

从源码本地运行（推荐）：

```sh
bun install --frozen-lockfile
bun run start --help
```

也可以使用已发布版本：

```sh
npx @jeffreycao/copilot-api@latest --help
# 或（推荐 Bun，以启用完整的 token usage 存储）
bunx --bun @jeffreycao/copilot-api@latest --help
```

下文使用项目脚本运行，如 `bun run start start`、`bun run auth ...`、`bun run debug`。使用已发布版本时，改用 `npx @jeffreycao/copilot-api@latest <command>`。

## 2. 登录 Provider

使用 GitHub Copilot：

```sh
bun run auth login --provider copilot
```

按照终端提示在浏览器中完成 GitHub Device Flow。需要有效的 GitHub Copilot 订阅。

也可以配置其他 Provider：

```sh
bun run auth login --provider codex
bun run auth login --provider dashscope
bun run auth login --provider deepseek
bun run auth login --provider openrouter
bun run auth login --provider custom
```

## 3. 启动本地服务

```sh
bun run start start
```

默认地址：

```text
http://localhost:4141
```

首次启动会在 `config.json` 中生成两种不同的 Key：

- `auth.apiKeys[0]`：供 OpenAI、Anthropic、Claude Code 等普通客户端使用。
- `auth.adminApiKey`：仅用于 `/admin/*`，不要配置给普通客户端。

配置路径：

| 系统 | 路径 |
| --- | --- |
| Linux/macOS | `~/.local/share/copilot-api/config.json` |
| Windows | `%USERPROFILE%\.local\share\copilot-api\config.json` |

查看实际路径和认证状态：

```sh
bun run debug
```

## 4. 验证服务

根路径是无需认证的健康检查：

```sh
curl http://localhost:4141/
```

其他接口需要 `auth.apiKeys` 中的普通 Key：

```sh
curl http://localhost:4141/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

也可以使用：

```http
x-api-key: YOUR_API_KEY
```

## 5. 配置客户端

### OpenAI 兼容客户端

```text
Base URL: http://localhost:4141/v1
API Key:  config.json 中的 auth.apiKeys[0]
```

### Anthropic SDK

```sh
export ANTHROPIC_BASE_URL=http://localhost:4141
export ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY
```

### Claude Code

在 `.claude/settings.json` 中填入网关地址和普通 key（`--claude-code` 参数已被移除）：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "<config.json 中的 auth.apiKeys[0]>"
  }
}
```

模型映射和其余环境变量见 [Claude Code 指南](./guides/zh-CN/claude-code.md)。该文件包含本地 API Key，不要粘贴到聊天、Issue 或日志中。

## 6. 常用启动选项

```sh
# 修改端口
bun run start start --port 8080

# 使用代理环境变量
bun run start start --proxy-env

# 显式指定数据目录
bun run start --api-home=/safe/path start
```

安全默认：

- 不使用 `--show-token`。
- 处理敏感代码时不使用 `--verbose`，因为详细日志会记录请求和响应。
- 不通过 `--github-token` 传入长期 Token；优先使用 `auth login` 后保存的受保护凭据文件。

## 7. 远程访问

默认的 `127.0.0.1` 仅允许本机访问。只有明确需要局域网或反向代理访问时才运行：

```sh
bun run start start --host 0.0.0.0
```

开放监听前必须：

1. 保留非空且随机的 `auth.apiKeys`。
2. 使用防火墙限制来源地址。
3. 公网访问放在 HTTPS 反向代理后。
4. 不暴露 `config.json`、凭据目录和日志目录。

Docker 仅本机映射：使用仓库自带的 Compose 文件，它在未设置 `COPILOT_API_BIND` 时只把端口发布到 `127.0.0.1`，把状态存在挂载到 `/data` 的 `./copilot-data`，并以非 root 的 `bun` 用户运行服务：

```sh
mkdir -p copilot-data
docker compose pull
docker compose run --rm copilot-api --auth keys --add YOUR_GATEWAY_API_KEY
docker compose run --rm copilot-api --auth login
docker compose up -d
```

容器内 entrypoint 默认把 `HOST` 设为 `0.0.0.0`，实际限制访问的是宿主机侧的 `127.0.0.1:4141:4141` 映射。环境变量和数据目录权限修复见 [Docker 指南](./guides/zh-CN/docker.md)。

## 8. 用量与诊断

CLI 不提供浏览器 Usage Viewer。可使用桌面应用，或直接调用受保护接口：

```sh
curl http://localhost:4141/usage \
  -H "x-api-key: YOUR_API_KEY"

curl "http://localhost:4141/token-usage?period=week" \
  -H "x-api-key: YOUR_API_KEY"
```

诊断环境和路径：

```sh
bun run debug --json
```

## 9. 更新

本地源码运行时更新：

```sh
git pull
bun install --frozen-lockfile
bun run build
```

使用 `@latest` 的 `npx`/`bunx` 命令则会自动解析最新发布版本。
