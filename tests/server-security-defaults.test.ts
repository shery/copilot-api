import { describe, expect, test } from "bun:test"

import { server } from "../src/server"

describe("server security defaults", () => {
  test("does not expose the Copilot token route", async () => {
    const response = await server.request("/token")

    expect(response.status).toBe(401)
  })

  test("does not serve the browser usage viewer", async () => {
    const response = await server.request("/usage-viewer")

    expect(response.status).toBe(401)
  })

  test("does not enable cross-origin reads by default", async () => {
    const response = await server.request("/", {
      headers: { origin: "https://example.invalid" },
    })

    expect(response.headers.get("access-control-allow-origin")).toBeNull()
  })
})
