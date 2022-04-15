import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Inject,
  Injectable,
} from "@angular/core";
import {
  Router,
  Resolve,
  ActivatedRouteSnapshot,
  ActivatedRoute,
} from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from "@angular/forms";
import { DOCUMENT, DatePipe, NgLocalization } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { from, Subscription, Observable, of, Subject } from "rxjs";
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { MatDatepickerInputEvent } from "@angular/material/datepicker";

import { SharedService } from "./../shared/shared.service";
import { MainService } from "./../main/main.service";
import { HeaderService } from "./header.service";
import { SidebarService } from "../sidebar/sidebar.service";
import { LabelItem } from "./../main/main.component";
import { environment } from "src/environments/environment";
import { ProjectRenameComponent } from "../dialog/project-rename/project-rename.component";
import { ProjectEndpointComponent } from "../dialog/project-endpoint/project-endpoint.component";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
  providers: [DatePipe],
})
export class HeaderComponent implements OnInit {
  private sidebarSubscription: Subscription;

  version = environment.version;
  logoSrc = "";
  myControl = new FormControl();
  isOpen = false;
  projectName = "";
  projectId = "0";
  selectedIndex = 0;
  viewType = "overview";
  labels: LabelItem[] = [];
  labelMaps = {};

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private headerService: HeaderService,
    private mainService: MainService,
    private _snackBar: MatSnackBar,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    public datepipe: DatePipe
  ) {}

  ngOnInit() {
    this.retrieveLabels();
    var u = this.router.url;
    var parsed = this.router.parseUrl(u);
    //parsed.queryParams = {};
    var path = parsed.toString();
    this.getCurrentState(path);

    if (this.projectName == "") {
      let project = this.labelMaps[this.projectId];
      if (project) {
        if (project.name) {
          this.projectName = project.name;
        }
      }
    }
    this.sidebarSubscription = this.sidebarService.leftMenuActive.subscribe(
      (res) => {
        if (res == "/empty-click") {
          //this.menuRow = "";
          return;
        }
        this.getCurrentState(res);
      }
    );
  }

  ngOnDestroy(): void {
    this.sidebarSubscription.unsubscribe();
  }

  initLogo() {
    this.logoSrc = environment.logo;
  }

  retrieveLabels() {
    var cachedLabels = localStorage.getItem(environment.projectsKey);
    if (cachedLabels && cachedLabels != null) {
      var _labels = JSON.parse(cachedLabels);
      this.labels = _labels;
      for (var i = 0; i < this.labels.length; i++) {
        var label = this.labels[i];
        this.labelMaps[label.id] = label;
      }
    }
  }

  getCurrentState(path: string) {
    if (path) {
      let encoded = decodeURIComponent(path);
      try {
        let dt = JSON.parse(encoded);

        let name = dt["name"];
        if (name) {
          this.projectName = name;
        }

        let id = dt["id"];
        if (id) {
          this.projectId = id;
        }
      } catch (e) {
        const tree = this.router.parseUrl(path);

        var projectId = "0";
        let children = tree.root.children["primary"];
        if (children) {
          let segments = children.segments;
          for (var i = 0; i < segments.length; i++) {
            if (i == 1) {
              projectId = segments[i].path;
              this.projectId = projectId;
              break;
            }
          }
        }

        let view = tree.queryParams["view"];
        switch (view) {
          case "overview":
            this.viewType = view;
            this.selectedIndex = 0;
            this.headerService.selectStyle(view);
            break;
          case "list":
            this.selectedIndex = 1;
            this.viewType = view;
            this.headerService.selectStyle(view);
            break;
          case "board":
            this.viewType = view;
            this.selectedIndex = 2;
            this.headerService.selectStyle(view);
            break;
          default:
        }
      }
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  navTo(path: String) {
    var url = location.protocol + "//" + location.host;
    if (path.startsWith("/")) {
      url = location.protocol + "//" + location.host + path;
    } else {
      url = location.protocol + "//" + location.host + "/" + path;
    }
    window.open(url, "_target");
  }


  home() {
    var location = this.document.location;
    var url = location.protocol + "//" + location.host;
    if (!environment.production) {
      url = "http://127.0.0.1:8803";
    }
    (window as any).open(url, "_self");
  }

  emptyClick() {}

  createLabel() {}

  blur(event) {}

  focus(event) {}

  logout() {
    setTimeout(() => {
      this.sharedService.logout().subscribe((data) => {
        window.location.href = "/";
      });
    }, 300);
  }


  settingPage() {
    this.router.navigate(["/settings"], {});
  }
  back() {
    this.router.navigate(["../"], { relativeTo: this.route });
  }

  create() {}

  toggleSideNav() {
    this.isOpen = !this.isOpen;
    this.headerService.setSibarActive(this.isOpen);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  deleteProject(projectId: string) {
    var params = { id: projectId };

    this.sharedService.deleteProject(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);
      //this. refresh
      var lb = "/project/0";
      //this.listMode = false;
      this.sidebarService.refresh.next("/refresh");
      let label: LabelItem = { name: "", id: "0" };
      this.sidebarService.onLabel(label);
      this.router.navigate([lb]);
    });
  }

  editProjectDetail() {
    let label = "_createLabel";
    const dialogRef = this.dialog.open(ProjectRenameComponent, {
      width: "500px",
      scrollStrategy: new NoopScrollStrategy()
    });
    dialogRef.componentInstance.projectId = this.projectId;

    dialogRef.afterClosed().subscribe((result) => {
      if (result.name && result.name != "") {
        this.projectName = result.name;
      }
    });
  }

  editProjectEndpoints() {

    let label = "_createLabel";
    const dialogRef = this.dialog.open(ProjectEndpointComponent, {
      width: "500px",
      scrollStrategy: new NoopScrollStrategy()
    });
    dialogRef.componentInstance.projectId = this.projectId;

    dialogRef.afterClosed().subscribe((result) => {
      if (result.name && result.name != "") {
        this.projectName = result.name;
      }
    });

  }
  setColor() {}
  copyLink() {}
  Duplicate() {}
  converToTemplate() {}
  importTasks() {}
  exportTasks() {}
  archive() {}
}
