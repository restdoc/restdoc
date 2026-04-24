import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HistoryEntry, HistoryService } from "../history.service";
import { APIElement } from "../main.component";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.css"],
})
export class HistoryComponent implements OnInit {
  projectId = "0";
  q = "";
  items: HistoryEntry[] = [];

  constructor(
    private history: HistoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((pm) => {
      const qp = pm.get("project");
      this.projectId = qp || this.detectProjectId();
      this.reload();
    });
  }

  detectProjectId(): string {
    const url = this.router.url || "";
    const m = url.match(/project\/([^/?#]+)/);
    if (m && m[1]) return m[1];
    return "0";
  }

  reload() {
    const all = this.history.list(this.projectId);
    const q = this.q.trim().toLowerCase();
    this.items = !q
      ? all
      : all.filter((e) => {
          return (
            (e.url || "").toLowerCase().includes(q) ||
            (e.method || "").toLowerCase().includes(q) ||
            (e.requestName || "").toLowerCase().includes(q)
          );
        });
  }

  remove(id: string) {
    this.history.remove(id);
    this.reload();
  }

  clearProject() {
    this.history.clearProject(this.projectId);
    this.reload();
  }

  replay(entry: HistoryEntry) {
    // Store a transient payload for APIlist to pick up
    sessionStorage.setItem("restdoc.history.replay", JSON.stringify(entry));
    this.router.navigate([`/project/${entry.projectId}`]);
  }

  formatTime(ts: number) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }

  methodBadge(m: string) {
    return (m || "").toUpperCase();
  }
}

