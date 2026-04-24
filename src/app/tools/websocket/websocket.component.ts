import { Component, OnDestroy } from "@angular/core";

type WsLog = { at: number; type: "open" | "close" | "error" | "message" | "sent"; data?: string };

@Component({
  selector: "app-websocket",
  templateUrl: "./websocket.component.html",
  styleUrls: ["./websocket.component.css"],
})
export class WebsocketComponent implements OnDestroy {
  url = "wss://echo.websocket.events";
  message = "";
  connected = false;
  logs: WsLog[] = [];
  private ws: WebSocket | null = null;

  connect() {
    this.disconnect();
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.connected = true;
      this.logs.unshift({ at: Date.now(), type: "open" });
    };
    this.ws.onclose = () => {
      this.connected = false;
      this.logs.unshift({ at: Date.now(), type: "close" });
    };
    this.ws.onerror = () => {
      this.logs.unshift({ at: Date.now(), type: "error" });
    };
    this.ws.onmessage = (ev) => {
      this.logs.unshift({ at: Date.now(), type: "message", data: String(ev.data) });
    };
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.connected = false;
  }

  send() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(this.message);
    this.logs.unshift({ at: Date.now(), type: "sent", data: this.message });
    this.message = "";
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

