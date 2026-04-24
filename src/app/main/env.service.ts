import { Injectable } from "@angular/core";

export interface EnvVar {
  key: string;
  value: string;
  enabled: boolean;
  secret?: boolean;
}

export interface EnvStore {
  global: EnvVar[];
  projects: Record<string, EnvVar[]>;
}

const STORAGE_KEY = "restdoc.env.v1";

@Injectable({
  providedIn: "root",
})
export class EnvService {
  load(): EnvStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { global: [], projects: {} };
      const parsed = JSON.parse(raw);
      return {
        global: Array.isArray(parsed.global) ? parsed.global : [],
        projects: parsed.projects && typeof parsed.projects === "object" ? parsed.projects : {},
      };
    } catch {
      return { global: [], projects: {} };
    }
  }

  save(store: EnvStore) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  getVarsForProject(projectId: string): EnvVar[] {
    const s = this.load();
    const projectVars = s.projects?.[projectId] ?? [];
    return [...(s.global ?? []), ...(projectVars ?? [])];
  }

  getProjectVars(projectId: string): EnvVar[] {
    const s = this.load();
    return s.projects?.[projectId] ?? [];
  }

  setProjectVars(projectId: string, vars: EnvVar[]) {
    const s = this.load();
    s.projects = s.projects ?? {};
    s.projects[projectId] = vars ?? [];
    this.save(s);
  }

  getGlobalVars(): EnvVar[] {
    const s = this.load();
    return s.global ?? [];
  }

  setGlobalVars(vars: EnvVar[]) {
    const s = this.load();
    s.global = vars ?? [];
    this.save(s);
  }

  resolve(projectId: string, key: string): string | undefined {
    const all = this.getVarsForProject(projectId);
    const found = all.find((v) => v.enabled !== false && v.key === key);
    return found?.value;
  }
}

