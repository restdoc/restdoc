import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { EnvService, EnvVar } from "../../env.service";

@Component({
  selector: "app-env-settings",
  templateUrl: "./env-settings.component.html",
  styleUrls: ["./env-settings.component.css"],
})
export class EnvSettingsComponent implements OnInit {
  projectId = "0";
  scope: "global" | "project" = "project";

  globalVars: EnvVar[] = [];
  projectVars: EnvVar[] = [];

  newKey = "";
  newValue = "";
  newSecret = false;

  constructor(private env: EnvService, private router: Router) {}

  ngOnInit() {
    this.projectId = this.detectProjectId();
    this.reload();
  }

  detectProjectId(): string {
    // Best-effort: get from current URL (/project/:id) or fallback to "0"
    const url = this.router.url || "";
    const m = url.match(/project\/([^/?#]+)/);
    if (m && m[1]) return m[1];
    return "0";
  }

  reload() {
    this.globalVars = this.env.getGlobalVars();
    this.projectVars = this.env.getProjectVars(this.projectId);
  }

  add() {
    const key = this.newKey.trim();
    if (!key) return;
    const v: EnvVar = { key, value: this.newValue ?? "", enabled: true, secret: this.newSecret };
    if (this.scope === "global") {
      this.globalVars = [...this.globalVars, v];
      this.env.setGlobalVars(this.globalVars);
    } else {
      this.projectVars = [...this.projectVars, v];
      this.env.setProjectVars(this.projectId, this.projectVars);
    }
    this.newKey = "";
    this.newValue = "";
    this.newSecret = false;
  }

  save() {
    this.env.setGlobalVars(this.globalVars);
    this.env.setProjectVars(this.projectId, this.projectVars);
  }

  remove(scope: "global" | "project", i: number) {
    if (scope === "global") {
      this.globalVars = this.globalVars.filter((_v, idx) => idx !== i);
      this.env.setGlobalVars(this.globalVars);
    } else {
      this.projectVars = this.projectVars.filter((_v, idx) => idx !== i);
      this.env.setProjectVars(this.projectId, this.projectVars);
    }
  }

  toggleEnabled(v: EnvVar) {
    v.enabled = !v.enabled;
    this.save();
  }

  toggleSecret(v: EnvVar) {
    v.secret = !v.secret;
    this.save();
  }
}

