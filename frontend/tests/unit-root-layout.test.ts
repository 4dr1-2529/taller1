import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

require.extensions[".css"] = (module) => {
  module.exports = {};
};

test("root layout exposes Spanish metadata and renders its application shell", async () => {
  const { default: RootLayout, metadata } = await import("../src/app/layout.js");
  assert.equal(metadata.title, "BLENKIR · Riesgo de deserción estudiantil");
  assert.match(String(metadata.description), /modelos de aprendizaje automático/);

  const html = renderToStaticMarkup(
    RootLayout({ children: createElement("main", { id: "app-content" }, "Contenido") }),
  );

  assert.match(html, /<html lang="es"/);
  assert.match(html, /data-scroll-behavior="smooth"/);
  assert.match(html, /id="app-content">Contenido<\/main>/);
  assert.match(html, /<body class="app-bg flex min-h-full flex-col">/);
});
