import { Injectable } from "@angular/core";
import { APIElement, EndpointElement, ResponseElement } from "./main.component";

export interface HistoryEntry {
  id: string;
  projectId: string;
  createdAt: number;
  method: string;
  url: string;
  requestName?: string;
  endpointName?: string;
  requestSnapshot: Partial<APIElement>;
  responseSnapshot?: Partial<ResponseElement>;
}

const KEY = "restdoc.history.v1";

@Injectable({ providedIn: "root" })
export class HistoryService {
  loadAll(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveAll(items: HistoryEntry[]) {
    localStorage.setItem(KEY, JSON.stringify(items ?? []));
  }

  list(projectId: string): HistoryEntry[] {
    return this.loadAll()
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  add(projectId: string, req: APIElement, endpoint: EndpointElement | null, fullUrl: string, resp?: ResponseElement | null) {
    const items = this.loadAll();
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      projectId,
      createdAt: Date.now(),
      method: req.method,
      url: fullUrl,
      requestName: req.name,
      endpointName: endpoint?.name,
      requestSnapshot: this.snapshotRequest(req),
      responseSnapshot: resp ? this.snapshotResponse(resp) : undefined,
    };
    items.unshift(entry);
    // cap to 500 total entries
    this.saveAll(items.slice(0, 500));
    return entry;
  }

  remove(id: string) {
    const items = this.loadAll().filter((e) => e.id !== id);
    this.saveAll(items);
  }

  clearProject(projectId: string) {
    const items = this.loadAll().filter((e) => e.projectId !== projectId);
    this.saveAll(items);
  }

  private snapshotRequest(req: APIElement): Partial<APIElement> {
    // Avoid storing blobs/files
    const { binaryFile, response, ...rest } = req as any;
    return JSON.parse(JSON.stringify(rest));
  }

  private snapshotResponse(resp: ResponseElement): Partial<ResponseElement> {
    // Keep full body for now (simple)
    return JSON.parse(JSON.stringify(resp));
  }
}

