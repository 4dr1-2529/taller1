import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("API bootstrap registers security middleware, routes and health endpoint without binding a port", () => {
  const express = require("express");
  const originalListen = express.application.listen;
  let app;
  const listeners = [];
  express.application.listen = function (...args) {
    app = this;
    const callback = args.find((arg) => typeof arg === "function");
    callback?.();
    return {
      on(event, handler) { listeners.push({ event, handler }); return this; },
    };
  };
  try {
    require("../../src/index.ts");
  } finally {
    express.application.listen = originalListen;
  }

  assert.ok(app);
  assert.equal(app.get("trust proxy"), false);
  const routes = app._router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.ok(routes.includes("/"));
  assert.ok(routes.includes("/api/v1"));
  assert.ok(routes.includes("/health"));
  assert.ok(listeners.some((entry) => entry.event === "close" && typeof entry.handler === "function"));
});
