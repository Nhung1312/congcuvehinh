/** Real React event flows in jsdom, without a live API, account or network. No browser layout claims. */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import React, { act } from "react";
import { GeometrySpecificationAdapter as Adapter } from "../src/ai/adapter/geometrySpecificationAdapter";
import type { GeometrySpecification } from "../src/ai/types";

const jsdomPackage = "jsdom";
let dom: any,
  createRoot: any,
  App: any,
  AIGeometryEditor: any,
  supabase: any,
  root: any,
  container: any,
  bundleDir: string;
const good = (): GeometrySpecification => ({
  title: "Valid fixture",
  shapeCategory: "quadrilateral",
  quadrilateral: { type: "rectangle", vertices: ["A", "B", "C", "D"] },
  detectedEntities: [],
  explanation: "fixed JSON",
});
const bad = () => {
  const s = good();
  s.title = "Invalid fixture";
  s.quadrilateral.specialAngle = { vertex: "A", type: "acute", degrees: 60 };
  s.verification = { valid: true };
  return s;
};
let calls: any[] = [];
function mockApi(spec: GeometrySpecification) {
  calls = [];
  globalThis.fetch = (async (url: any, options: any) => {
    if (String(url) !== "/api/geometry/parse")
      throw new Error(`Network disabled in test: ${url}`);
    calls.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ spec }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}
async function mount(element: React.ReactNode) {
  if (root) await act(async () => root.unmount());
  container = document.createElement("div");
  document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () => root.render(element));
}
const button = (text: string) =>
  [...container.querySelectorAll("button")].find(
    (b: any) => b.textContent.trim() === text,
  ) as HTMLButtonElement;
async function click(b: HTMLButtonElement, wait = 0) {
  assert.ok(b, "Button exists");
  assert.equal(b.disabled, false);
  await act(async () => {
    b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    if (wait) await new Promise((r) => setTimeout(r, wait));
  });
}
before(async () => {
  const { JSDOM } = await import(jsdomPackage);
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost",
  });
  for (const key of [
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "navigator",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "SVGElement",
    "Event",
    "MouseEvent",
    "File",
    "FileReader",
    "Image",
  ])
    Object.defineProperty(globalThis, key, {
      value: dom.window[key],
      configurable: true,
      writable: true,
    });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  (globalThis as any).requestAnimationFrame = (f: any) => setTimeout(f, 0);
  (globalThis as any).cancelAnimationFrame = clearTimeout;
  mockApi(good());
  bundleDir = mkdtempSync(join(process.cwd(), "node_modules/.geometry-dom-"));
  await build({
    stdin: {
      contents:
        "export {App} from './src/App'; export {AIGeometryEditor} from './src/components/EditorPanels/AIGeometryEditor'; export {supabase} from './src/supabaseClient';",
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    outfile: join(bundleDir, "ui.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    define: { "import.meta.env": "{}" },
    logLevel: "silent",
    plugins: [
      {
        name: "offline-cloud-fixture",
        setup(build) {
          build.onResolve({ filter: /supabaseClient$/ }, () => ({
            path: "cloud-fixture",
            namespace: "fixture",
          }));
          build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
            contents:
              'export const supabase={from(){throw new Error("Cloud operations disabled in geometry UI test")}};',
            loader: "js",
          }));
        },
      },
    ],
  });
  const ui = createRequire(import.meta.url)(join(bundleDir, "ui.cjs"));
  App = ui.App;
  AIGeometryEditor = ui.AIGeometryEditor;
  supabase = ui.supabase;
  ({ createRoot } = await import("react-dom/client"));
});
after(async () => {
  if (root) await act(async () => root.unmount());
  dom?.window.close();
  if (bundleDir) rmSync(bundleDir, { recursive: true, force: true });
});

test("Editor button blocks contradictory JSON and preserves the working document", async () => {
  localStorage.clear();
  sessionStorage.clear();
  mockApi(bad());
  const current = Adapter.specToChartDocument(good()),
    before = structuredClone(current);
  current.metadata.aiPrompt = "Cho hình chữ nhật ABCD.";
  let applied = 0;
  await mount(
    React.createElement(AIGeometryEditor, {
      currentDoc: current,
      onApplyDoc: () => applied++,
    }),
  );
  await click(button("Dựng hình AI"), 400);
  assert.equal(applied, 0);
  assert.match(container.textContent, /mâu thuẫn/);
  assert.equal(calls.length, 1);
  assert.deepEqual(current.data, before.data);
  assert.deepEqual(current.settings, before.settings);
});
test("Editor success retains original image/text, verification and personal key request separation", async () => {
  localStorage.clear();
  sessionStorage.clear();
  mockApi(good());
  const image = {
    mimeType: "image/png",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7K0AAAAASUVORK5CYII=",
  };
  sessionStorage.setItem(
    "congcuvehinh-gemini-key-session",
    "fixture-only-not-a-real-key",
  );
  const current = Adapter.specToChartDocument(good());
  current.metadata = { aiPrompt: "Đề gốc có ảnh", aiQuestionImage: image };
  let applied: any;
  await mount(
    React.createElement(AIGeometryEditor, {
      currentDoc: current,
      onApplyDoc: (d: any) => (applied = d),
    }),
  );
  await click(button("Dựng hình AI"), 400);
  assert.ok(applied);
  assert.equal(applied.metadata.aiVerification.valid, true);
  assert.equal(applied.metadata.aiPrompt, "Đề gốc có ảnh");
  assert.deepEqual(applied.metadata.aiQuestionImage, image);
  assert.equal(calls[0].apiKey, "fixture-only-not-a-real-key");
  assert.deepEqual(calls[0].image, image);
  assert.ok(!JSON.stringify(applied).includes("fixture-only-not-a-real-key"));
});
test("App rerun button blocks failed verification without replacing the current canvas", async () => {
  localStorage.clear();
  sessionStorage.clear();
  mockApi(bad());
  const current = Adapter.specToChartDocument(good());
  current.metadata = {
    ...current.metadata,
    aiPrompt: "Đề gốc",
    aiGeneratedPrompt: "Đề gốc",
  };
  localStorage.setItem("toan_thcs_current_draft", JSON.stringify(current));
  await mount(React.createElement(App));
  const svg =
    container.querySelector("svg#geometry-svg")?.outerHTML ||
    [...container.querySelectorAll("svg")].at(-1)?.outerHTML;
  await click(button("Dựng lại bằng AI"), 30);
  const saved = JSON.parse(localStorage.getItem("toan_thcs_current_draft"));
  assert.equal(saved.id, current.id);
  assert.deepEqual(saved.data, current.data);
  assert.match(container.textContent, /mâu thuẫn/);
  assert.ok(!container.textContent.includes("Đã dựng lại hình thành công!"));
  assert.equal(calls.length, 1);
  assert.ok(svg);
});
test("App rerun success stores an independently verified document and original prompt", async () => {
  localStorage.clear();
  sessionStorage.clear();
  mockApi(good());
  const current = Adapter.specToChartDocument(good());
  current.metadata = {
    ...current.metadata,
    aiPrompt: "Đề để dựng lại",
    aiGeneratedPrompt: "Đề để dựng lại",
  };
  localStorage.setItem("toan_thcs_current_draft", JSON.stringify(current));
  await mount(React.createElement(App));
  await click(button("Dựng lại bằng AI"), 30);
  const saved = JSON.parse(localStorage.getItem("toan_thcs_current_draft"));
  assert.notEqual(saved.id, current.id);
  assert.equal(saved.metadata.aiVerification.valid, true);
  assert.equal(saved.metadata.aiPrompt, "Đề để dựng lại");
  assert.ok(saved.metadata.aiGeometrySpec);
  assert.equal(calls.length, 1);
});
