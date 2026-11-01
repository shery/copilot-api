import { Hono } from "hono"
import { logger } from "hono/logger"

import {
  createAuthMiddleware,
  getConfiguredAdminApiKeys,
} from "./lib/request-auth"
import { traceIdMiddleware } from "./lib/trace"
import type { GatewayPlugins } from "./lib/gateway-plugins"
import { requestEventsMiddleware } from "./lib/request-events"
import { alphaSearchRoutes } from "./routes/alpha-search/route"
import { completionRoutes } from "./routes/chat-completions/route"
import { configRoutes } from "./routes/admin/config/route"
import { embeddingRoutes } from "./routes/embeddings/route"
import { imageRoutes } from "./routes/images/route"
import { messageRoutes } from "./routes/messages/route"
import { modelRoutes } from "./routes/models/route"
import { providerAlphaSearchRoutes } from "./routes/provider/alpha-search/route"
import { providerImageRoutes } from "./routes/provider/images/route"
import { providerMessageRoutes } from "./routes/provider/messages/route"
import { providerModelRoutes } from "./routes/provider/models/route"
import { providerResponsesRoutes } from "./routes/provider/responses/route"
import { responsesRoutes } from "./routes/responses/route"
import { tokenUsageRoute } from "./routes/token-usage/route"
import { usageRoute } from "./routes/usage/route"
import { videoRoutes } from "./routes/videos/route"
export interface CreateServerOptions {
  networkExposed?: boolean
  getApiKeys?: () => Array<string>
  port?: number
  plugins?: GatewayPlugins
}

// Fork policy: no CORS, no browser usage viewer, and protected routes always
// require a gateway API key, even on loopback or when the key list is empty.
export function createServer(options: CreateServerOptions = {}): Hono {
  const server = new Hono()

  server.use(traceIdMiddleware)
  server.use(logger())
  server.use(
    "*",
    createAuthMiddleware({
      getApiKeys: options.getApiKeys,
      allowUnauthenticatedPaths: ["/"],
      shouldSkipPath: (path) => path.startsWith("/admin/"),
      allowWhenNoApiKeys: false,
    }),
  )
  server.use(
    "/admin/*",
    createAuthMiddleware({
      getApiKeys: getConfiguredAdminApiKeys,
      allowUnauthenticatedPaths: [],
      allowWhenNoApiKeys: false,
    }),
  )

  server.use(
    "*",
    requestEventsMiddleware(options.plugins, options.port ?? 4141),
  )

  server.get("/", (c) => c.text("Server running"))

  server.route("/chat/completions", completionRoutes)
  server.route("/admin/config", configRoutes)
  server.route("/models", modelRoutes)
  server.route("/embeddings", embeddingRoutes)
  server.route("/usage", usageRoute)
  server.route("/token-usage", tokenUsageRoute)
  server.route("/responses", responsesRoutes)
  server.route("/alpha/search", alphaSearchRoutes)
  server.route("/images", imageRoutes)
  server.route("/videos", videoRoutes)

  // Compatibility with tools that expect v1/ prefix
  server.route("/v1/chat/completions", completionRoutes)
  server.route("/v1/models", modelRoutes)
  server.route("/v1/embeddings", embeddingRoutes)
  server.route("/v1/responses", responsesRoutes)
  server.route("/v1/alpha/search", alphaSearchRoutes)
  server.route("/v1/images", imageRoutes)
  server.route("/v1/videos", videoRoutes)

  // Anthropic compatible endpoints
  server.route("/v1/messages", messageRoutes)

  // Provider scoped endpoints
  server.route("/:provider/v1/messages", providerMessageRoutes)
  server.route("/:provider/v1/models", providerModelRoutes)
  server.route("/:provider/v1/responses", providerResponsesRoutes)
  server.route("/:provider/v1/alpha/search", providerAlphaSearchRoutes)
  server.route("/:provider/v1/images", providerImageRoutes)

  server.route("/:provider/models", providerModelRoutes)
  server.route("/:provider/responses", providerResponsesRoutes)
  server.route("/:provider/alpha/search", providerAlphaSearchRoutes)
  server.route("/:provider/images", providerImageRoutes)

  return server
}

export const server = createServer()
