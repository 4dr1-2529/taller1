import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChartCategoryTick } from "../src/components/ui/ChartCategoryTick.js";
import { TableExportButtons, TablePagination } from "../src/components/ui/TableToolbar.js";
import { AnimatedNumber } from "../src/components/ui/AnimatedNumber.js";

test("ChartCategoryTick cubre etiquetas ausentes, cortas, largas y verticales", () => {
  const empty = renderToStaticMarkup(createElement(ChartCategoryTick));
  const short = renderToStaticMarkup(createElement(ChartCategoryTick, { x: 10, y: 20, payload: { value: 4 } }));
  const long = renderToStaticMarkup(createElement(ChartCategoryTick, {
    x: 12, y: 30, payload: { value: "Comunicación y matemática" }, vertical: true,
  }));
  assert.match(empty, /text-anchor="middle"/);
  assert.match(short, /4/);
  assert.match(long, /text-anchor="end"/);
  assert.match(long, /Comunicación/);
  assert.match(long, /matemática/);
});

test("TableExportButtons muestra solo las acciones provistas", () => {
  const none = renderToStaticMarkup(createElement(TableExportButtons, {}));
  const both = renderToStaticMarkup(createElement(TableExportButtons, {
    onExportPdf: () => {}, onExportExcel: () => {},
  }));
  const pdf = renderToStaticMarkup(createElement(TableExportButtons, { onExportPdf: () => {} }));
  const excel = renderToStaticMarkup(createElement(TableExportButtons, { onExportExcel: () => {} }));
  assert.doesNotMatch(none, /PDF|Excel/);
  assert.match(both, /PDF/);
  assert.match(both, /Excel/);
  assert.match(pdf, /PDF/);
  assert.doesNotMatch(pdf, /Excel/);
  assert.match(excel, /Excel/);
  assert.doesNotMatch(excel, /PDF/);
});

test("TablePagination cubre vacío, límites de página y callbacks opcionales", () => {
  assert.equal(TablePagination({ total: 10, pageSize: 10 }), null);

  const changes: number[] = [];
  const first = TablePagination({ page: 1, pageSize: 10, total: 21, onPageChange: (page) => changes.push(page) });
  const firstButtons = (first?.props.children as React.ReactNode[])[0] as React.ReactElement<{ disabled: boolean; onClick: () => void }>;
  const firstNext = (first?.props.children as React.ReactNode[])[2] as React.ReactElement<{ disabled: boolean; onClick: () => void }>;
  assert.equal(firstButtons.props.disabled, true);
  assert.equal(firstNext.props.disabled, false);
  firstButtons.props.onClick();
  firstNext.props.onClick();

  const last = TablePagination({ page: 3, pageSize: 10, total: 21 });
  const lastButtons = (last?.props.children as React.ReactNode[])[0] as React.ReactElement<{ disabled: boolean; onClick: () => void }>;
  const lastNext = (last?.props.children as React.ReactNode[])[2] as React.ReactElement<{ disabled: boolean; onClick: () => void }>;
  assert.equal(lastButtons.props.disabled, false);
  assert.equal(lastNext.props.disabled, true);
  lastButtons.props.onClick();
  lastNext.props.onClick();
  assert.deepEqual(changes, [0, 2]);
});

test("AnimatedNumber conserva formato decimal y sufijo durante SSR", () => {
  const integer = renderToStaticMarkup(createElement(AnimatedNumber, { value: 42, suffix: "%" }));
  const decimal = renderToStaticMarkup(createElement(AnimatedNumber, { value: 2.5, decimals: 2, suffix: " pts" }));
  assert.match(integer, /0%/);
  assert.match(decimal, /0\.00 pts/);
});
