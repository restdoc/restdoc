import { Injectable } from "@angular/core";
import {
  APIElement,
  EndpointElement,
  HeaderElement,
  PostType,
  ResponseElement,
} from "./main.component";
import { UtilsService } from "./main.service";

type KeyValue = { key: string; value: string };

@Injectable({
  providedIn: "root",
})
export class RestClientService {
  constructor(private utilsService: UtilsService) {}

  async send(
    request: APIElement,
    endpoint: EndpointElement,
    options?: { signal?: AbortSignal }
  ): Promise<ResponseElement> {
    const startedAt = performance.now();

    const url = this.buildUrl(endpoint?.value ?? "", request.path ?? "", request.params ?? []);
    const headers = this.buildHeaders(request);

    const { body, contentTypeHeader } = this.buildBody(request);
    if (contentTypeHeader && !this.hasHeader(headers, "content-type")) {
      headers.push({ key: "Content-Type", value: contentTypeHeader });
    }

    const controller = new AbortController();
    const timeoutMs = request.timeout && request.timeout > 0 ? request.timeout : 30000;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    const external = options?.signal;
    const onExternalAbort = () => controller.abort();
    if (external) {
      if (external.aborted) {
        controller.abort();
      } else {
        external.addEventListener("abort", onExternalAbort);
      }
    }

    try {
      const resp = await fetch(url, {
        method: request.method,
        headers: this.toHeadersInit(headers),
        body,
        credentials: request.withCredentials ? "include" : "same-origin",
        redirect: request.followRedirects === false ? "manual" : "follow",
        signal: controller.signal,
      });

      const responseTime = Math.round(performance.now() - startedAt);

      const rawContentType = resp.headers.get("content-type") ?? "";
      const contentType = this.utilsService.formatContentType(rawContentType);

      const responseHeaders: HeaderElement[] = [];
      resp.headers.forEach((v, k) => {
        responseHeaders.push({ id: "", key: k, value: v, desc: "", enabled: true });
      });

      const textBody = await resp.text();
      const size = new Blob([textBody]).size;

      return {
        body: this.prettyBody(textBody, contentType),
        contentType: contentType || "raw",
        headers: responseHeaders,
        responseUrl: resp.url ?? url,
        statusCode: resp.status,
        statusText: resp.statusText,
        responseTime,
        size,
      };
    } catch (err: any) {
      const responseTime = Math.round(performance.now() - startedAt);
      const msg =
        err?.name === "AbortError"
          ? `Request aborted (timeout ${timeoutMs}ms)`
          : err?.message || String(err);

      return {
        body: JSON.stringify({ error: msg }, null, 2),
        contentType: "json",
        headers: [],
        responseUrl: url,
        statusCode: 0,
        statusText: "Network Error",
        responseTime,
        size: msg.length,
      };
    } finally {
      window.clearTimeout(timeoutId);
      if (external) {
        external.removeEventListener("abort", onExternalAbort);
      }
    }
  }

  private buildUrl(base: string, path: string, params: any[]): string {
    const trimmedBase = base?.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = path?.startsWith("/") ? path : `/${path || ""}`;
    const url = new URL(`${trimmedBase}${normalizedPath}`, window.location.origin);

    for (const p of params ?? []) {
      if (!p || p.enabled === false) continue;
      const key = (p.key ?? "").trim();
      if (!key) continue;
      url.searchParams.append(key, p.value ?? "");
    }

    return url.toString();
  }

  private buildHeaders(request: APIElement): KeyValue[] {
    const headers: KeyValue[] = [];

    // user headers
    for (const h of request.headers ?? []) {
      if (!h || h.enabled === false) continue;
      const key = (h.key ?? "").trim();
      if (!key) continue;
      headers.push({ key, value: h.value ?? "" });
    }

    // auth injection (avoid duplicates by dropping existing Authorization)
    if (request.auth && request.auth.type && request.auth.type !== "none") {
      this.removeHeader(headers, "authorization");

      if (
        request.auth.type === "basic" &&
        request.auth.username != null &&
        request.auth.password != null
      ) {
        const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
        headers.push({ key: "Authorization", value: `Basic ${credentials}` });
      } else if (request.auth.type === "bearer" && request.auth.token) {
        const prefix = request.auth.prefix || "Bearer";
        headers.push({ key: "Authorization", value: `${prefix} ${request.auth.token}` });
      }
    }

    return headers;
  }

  private buildBody(request: APIElement): { body?: BodyInit | null; contentTypeHeader?: string } {
    const method = (request.method || "GET").toUpperCase();
    const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
    if (!hasBody) return { body: undefined };

    switch (request.post_type) {
      case PostType.FormData: {
        const fd = new FormData();
        for (const p of request.form_data ?? []) {
          if (!p || p.enabled === false) continue;
          const key = (p.key ?? "").trim();
          if (!key) continue;
          fd.append(key, p.value ?? "");
        }
        // Let browser set Content-Type with boundary
        return { body: fd };
      }
      case PostType.FormUrlencoded: {
        const sp = new URLSearchParams();
        for (const p of request.form_data ?? []) {
          if (!p || p.enabled === false) continue;
          const key = (p.key ?? "").trim();
          if (!key) continue;
          sp.append(key, p.value ?? "");
        }
        return { body: sp.toString(), contentTypeHeader: "application/x-www-form-urlencoded" };
      }
      case PostType.Raw: {
        const ct = this.rawContentTypeToHeader(request.rawContentType);
        return { body: request.raw ?? "", contentTypeHeader: ct };
      }
      case PostType.Binary: {
        if (request.binaryFile) {
          return { body: request.binaryFile };
        }
        return { body: request.binary ?? "" };
      }
      case PostType.None:
      default:
        return { body: undefined };
    }
  }

  private rawContentTypeToHeader(rawContentType?: string): string | undefined {
    switch ((rawContentType ?? "").toLowerCase()) {
      case "json":
        return "application/json";
      case "xml":
        return "application/xml";
      case "text":
        return "text/plain";
      default:
        return undefined;
    }
  }

  private prettyBody(body: string, contentType: string): string {
    if (!body) return "";
    if (contentType === "json") {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    return body;
  }

  private toHeadersInit(headers: KeyValue[]): HeadersInit {
    const h = new Headers();
    for (const kv of headers) {
      h.append(kv.key, kv.value);
    }
    return h;
  }

  private hasHeader(headers: KeyValue[], key: string): boolean {
    const k = key.toLowerCase();
    return (headers ?? []).some((h) => (h.key ?? "").toLowerCase() === k);
  }

  private removeHeader(headers: KeyValue[], key: string) {
    const k = key.toLowerCase();
    for (let i = headers.length - 1; i >= 0; i--) {
      if ((headers[i].key ?? "").toLowerCase() === k) headers.splice(i, 1);
    }
  }
}

