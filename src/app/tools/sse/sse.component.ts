import { Component, OnDestroy } from "@angular/core";

type SseLog = { at: number; type: "open" | "error" | "message"; data?: string };

@Component({
  selector: "app-sse",
  templateUrl: "./sse.component.html",
  styleUrls: ["./sse.component.css"],
})
export class SseComponent implements OnDestroy {
  url = "";
  connected = false;
  logs: SseLog[] = [];
  private es: EventSource | null = null;

  connect() {
    this.disconnect();
    this.es = new EventSource(this.url);
    this.es.onopen = () => {
      this.connected = true;
      this.logs.unshift({ at: Date.now(), type: "open" });
    };
    this.es.onerror = () => {
      this.logs.unshift({ at: Date.now(), type: "error" });
    };
    this.es.onmessage = (ev) => {
      this.logs.unshift({ at: Date.now(), type: "message", data: ev.data });
    };
  }

  disconnect() {
    if (this.es) {
      try {
        this.es.close();
      } catch {}
      this.es = null;
    }
    this.connected = false;
  }

  clear() {
    this.logs = [];
  }

  fmt(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  ngOnDestroy() {
    this.disconnect();
  }
}

