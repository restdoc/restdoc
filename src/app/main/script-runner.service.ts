import { Injectable } from "@angular/core";
import { APIElement, HeaderElement, ParamElement, ResponseElement } from "./main.component";
import { EnvService } from "./env.service";

export interface ScriptRunResult {
  logs: string[];
  requestPatch?: Partial<APIElement>;
  tests?: { ok: boolean; name: string; message?: string }[];
}

type RunnerMode = "pre" | "test";

@Injectable({ providedIn: "root" })
export class ScriptRunnerService {
  private iframe: HTMLIFrameElement | null = null;
  private pending = new Map<
    string,
    { resolve: (v: ScriptRunResult) => void; reject: (e: any) => void; timer: number }
  >();

  constructor(private env: EnvService) {
    window.addEventListener("message", (ev) => this.onMessage(ev));
  }

  async runPreRequest(projectId: string, req: APIElement): Promise<ScriptRunResult> {
    return this.run("pre", projectId, req, null);
  }

  async runTests(projectId: string, req: APIElement, resp: ResponseElement): Promise<ScriptRunResult> {
    return this.run("test", projectId, req, resp);
  }

  private ensureIframe(): HTMLIFrameElement {
    if (this.iframe) return this.iframe;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox.add("allow-scripts");
    iframe.srcdoc = this.srcdoc();
    document.body.appendChild(iframe);
    this.iframe = iframe;
    return iframe;
  }

  private run(mode: RunnerMode, projectId: string, req: APIElement, resp: ResponseElement | null) {
    const script = mode === "pre" ? req.preRequestScript || "" : req.testScript || "";
    if (!script.trim()) {
      return Promise.resolve({ logs: [], requestPatch: {}, tests: [] });
    }

    const id = crypto.randomUUID();
    const iframe = this.ensureIframe();

    const payload = {
      type: "__RESTDOC_SCRIPT_RUN__",
      id,
      mode,
      script,
      context: {
        env: {
          get: (key: string) => this.env.resolve(projectId, key),
        },
        request: {
          method: req.method,
          path: req.path,
          headers: (req.headers ?? []).map((h) => ({ key: h.key, value: h.value, enabled: h.enabled })),
          params: (req.params ?? []).map((p) => ({ key: p.key, value: p.value, enabled: p.enabled })),
          raw: req.raw,
        },
        response: resp
          ? {
              status: resp.statusCode ?? 0,
              body: resp.body ?? "",
              headers: (resp.headers ?? []).map((h) => ({ key: h.key, value: h.value })),
            }
          : null,
      },
    };

    return new Promise<ScriptRunResult>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Script timeout"));
      }, 1500);
      this.pending.set(id, { resolve, reject, timer });
      iframe.contentWindow?.postMessage(payload, "*");
    });
  }

  private onMessage(ev: MessageEvent) {
    const data = ev.data;
    if (!data || data.type !== "__RESTDOC_SCRIPT_RESULT__") return;
    const id = data.id;
    const pending = this.pending.get(id);
    if (!pending) return;
    window.clearTimeout(pending.timer);
    this.pending.delete(id);
    pending.resolve({
      logs: Array.isArray(data.logs) ? data.logs : [],
      requestPatch: data.requestPatch || {},
      tests: Array.isArray(data.tests) ? data.tests : [],
    });
  }

  private srcdoc(): string {
    // Runs inside sandboxed iframe
    return `<!doctype html>
<html>
<body>
<script>
  function safeStringify(v) {
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || msg.type !== '__RESTDOC_SCRIPT_RUN__') return;
    const { id, mode, script, context } = msg;
    const logs = [];
    const tests = [];
    const requestPatch = { headers: [], params: [] };

    const api = {
      log: (...args) => logs.push(args.map(a => typeof a === 'string' ? a : safeStringify(a)).join(' ')),
      setHeader: (key, value) => requestPatch.headers.push({ key: String(key), value: String(value), enabled: true }),
      setParam: (key, value) => requestPatch.params.push({ key: String(key), value: String(value), enabled: true }),
      expect: (name, cond, message) => tests.push({ ok: !!cond, name: String(name), message: message ? String(message) : undefined }),
      env: {
        get: (key) => (context && context.env && typeof context.env.get === 'function') ? context.env.get(String(key)) : undefined
      },
      request: context ? context.request : null,
      response: context ? context.response : null,
    };

    try {
      const fn = new Function('api', '"use strict";\\n' + script);
      fn(api);
    } catch (e) {
      tests.push({ ok: false, name: mode === 'pre' ? 'pre-request' : 'tests', message: (e && e.message) ? e.message : String(e) });
    }

    ev.source.postMessage({ type: '__RESTDOC_SCRIPT_RESULT__', id, logs, tests, requestPatch }, '*');
  });
</script>
</body>
</html>`;
  }
}

