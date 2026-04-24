import { Injectable } from "@angular/core";
import { APIElement, EndpointElement, HeaderElement, PostType } from "./main.component";

@Injectable({ providedIn: "root" })
export class CodegenService {
  buildUrl(endpoint: EndpointElement, req: APIElement): string {
    const base = endpoint?.value ?? "";
    const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const path = req.path?.startsWith("/") ? req.path : `/${req.path ?? ""}`;
    const u = new URL(`${trimmedBase}${path}`, window.location.origin);
    for (const p of req.params ?? []) {
      if (!p || p.enabled === false) continue;
      const k = (p.key ?? "").trim();
      if (!k) continue;
      u.searchParams.append(k, p.value ?? "");
    }
    return u.toString();
  }

  buildHeaders(req: APIElement): Record<string, string> {
    const h: Record<string, string> = {};
    for (const item of req.headers ?? []) {
      if (!item || item.enabled === false) continue;
      const k = (item.key ?? "").trim();
      if (!k) continue;
      h[k] = item.value ?? "";
    }
    return h;
  }

  generateCurl(endpoint: EndpointElement, req: APIElement): string {
    const url = this.buildUrl(endpoint, req);
    const headers = this.buildHeaders(req);
    const parts: string[] = ["curl", "-X", req.method, `"${url}"`];
    for (const k of Object.keys(headers)) {
      parts.push("-H", `"${k}: ${this.escapeDouble(headers[k])}"`);
    }
    const body = this.buildBody(req);
    if (body != null) {
      parts.push("--data", `'${body.replace(/'/g, "'\\''")}'`);
    }
    if (req.withCredentials) {
      parts.push("--cookie", `""`);
    }
    return parts.join(" ");
  }

  generateFetch(endpoint: EndpointElement, req: APIElement): string {
    const url = this.buildUrl(endpoint, req);
    const headers = this.buildHeaders(req);
    const body = this.buildBody(req);
    const lines: string[] = [];
    lines.push(`fetch(${JSON.stringify(url)}, {`);
    lines.push(`  method: ${JSON.stringify(req.method)},`);
    if (Object.keys(headers).length) {
      lines.push(`  headers: ${JSON.stringify(headers, null, 2).split("\n").join("\n  ")},`);
    }
    if (body != null) {
      lines.push(`  body: ${JSON.stringify(body)},`);
    }
    lines.push(`  credentials: ${JSON.stringify(req.withCredentials ? "include" : "same-origin")},`);
    lines.push(`}).then(r => r.text()).then(console.log);`);
    return lines.join("\n");
  }

  generateAxios(endpoint: EndpointElement, req: APIElement): string {
    const url = this.buildUrl(endpoint, req);
    const headers = this.buildHeaders(req);
    const body = this.buildBody(req);
    const lines: string[] = [];
    lines.push(`import axios from "axios";`);
    lines.push("");
    lines.push(`axios({`);
    lines.push(`  method: ${JSON.stringify(req.method.toLowerCase())},`);
    lines.push(`  url: ${JSON.stringify(url)},`);
    if (Object.keys(headers).length) {
      lines.push(`  headers: ${JSON.stringify(headers, null, 2).split("\n").join("\n  ")},`);
    }
    if (body != null) {
      lines.push(`  data: ${JSON.stringify(body)},`);
    }
    lines.push(`  withCredentials: ${req.withCredentials ? "true" : "false"},`);
    lines.push(`}).then(r => console.log(r.data));`);
    return lines.join("\n");
  }

  private buildBody(req: APIElement): string | null {
    const m = (req.method || "GET").toUpperCase();
    if (!(m === "POST" || m === "PUT" || m === "PATCH")) return null;
    switch (req.post_type) {
      case PostType.Raw:
        return req.raw ?? "";
      case PostType.FormUrlencoded: {
        const sp = new URLSearchParams();
        for (const p of req.form_data ?? []) {
          if (!p || p.enabled === false) continue;
          const k = (p.key ?? "").trim();
          if (!k) continue;
          sp.append(k, p.value ?? "");
        }
        return sp.toString();
      }
      case PostType.FormData: {
        // best-effort textual form-data
        const obj: any = {};
        for (const p of req.form_data ?? []) {
          if (!p || p.enabled === false) continue;
          const k = (p.key ?? "").trim();
          if (!k) continue;
          obj[k] = p.value ?? "";
        }
        return JSON.stringify(obj);
      }
      case PostType.Binary:
        return req.binary ?? "";
      default:
        return null;
    }
  }

  private escapeDouble(s: string): string {
    return (s ?? "").replace(/"/g, '\\"');
  }
}

