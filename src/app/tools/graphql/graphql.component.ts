import { Component } from "@angular/core";

@Component({
  selector: "app-graphql",
  templateUrl: "./graphql.component.html",
  styleUrls: ["./graphql.component.css"],
})
export class GraphqlComponent {
  endpoint = "";
  headersText = "";
  query = "{ __typename }";
  variables = "{}";
  response = "";
  status = "";
  loading = false;

  async send() {
    this.loading = true;
    this.status = "";
    this.response = "";
    const started = performance.now();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.headersText.trim()) {
        for (const line of this.headersText.split("\n")) {
          const idx = line.indexOf(":");
          if (idx <= 0) continue;
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) headers[k] = v;
        }
      }
      const vars = this.variables.trim() ? JSON.parse(this.variables) : {};
      const resp = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: this.query, variables: vars }),
      });
      const text = await resp.text();
      const ms = Math.round(performance.now() - started);
      this.status = `${resp.status} ${resp.statusText} • ${ms}ms`;
      try {
        this.response = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        this.response = text;
      }
    } catch (e: any) {
      this.status = "Network Error";
      this.response = e?.message || String(e);
    } finally {
      this.loading = false;
    }
  }
}

