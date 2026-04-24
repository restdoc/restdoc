import { Injectable } from "@angular/core";
import { EnvService } from "./env.service";

export interface RenderResult {
  output: string;
  missing: string[];
}

/** Tab-local request variables (same shape as ParamElement). */
export type ParamElementLike = {
  key?: string;
  value?: string;
  enabled?: boolean;
};

@Injectable({
  providedIn: "root",
})
export class TemplateService {
  constructor(private env: EnvService) {}

  renderString(
    input: string,
    projectId: string,
    requestVariables?: ParamElementLike[] | null
  ): RenderResult {
    const missing = new Set<string>();
    const tabVars = new Map<string, string>();
    for (const p of requestVariables ?? []) {
      if (!p || p.enabled === false) continue;
      const k = String(p.key ?? "").trim();
      if (!k) continue;
      tabVars.set(k, p.value ?? "");
    }

    const out = (input ?? "").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, rawKey) => {
      const key = String(rawKey ?? "").trim();
      if (!key) return "";

      // Dynamic vars
      if (key === "$timestamp") return String(Date.now());
      if (key === "$uuid") return crypto.randomUUID();
      if (key.startsWith("$randomInt")) {
        const m = key.match(/\$randomInt\((\d+),\s*(\d+)\)/);
        const min = m ? Number(m[1]) : 0;
        const max = m ? Number(m[2]) : 1000;
        const v = Math.floor(min + Math.random() * (max - min + 1));
        return String(v);
      }

      if (tabVars.has(key)) {
        return tabVars.get(key) ?? "";
      }

      const v = this.env.resolve(projectId, key);
      if (v === undefined) {
        missing.add(key);
        return "";
      }
      return v;
    });

    return { output: out, missing: Array.from(missing) };
  }
}
