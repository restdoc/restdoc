import { Component, OnInit, Inject } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { UntypedFormBuilder, UntypedFormControl } from "@angular/forms";
import { DOCUMENT, DatePipe,  } from "@angular/common";
import { ChangeDetectorRef } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription,  } from "rxjs";
import { NoopScrollStrategy } from '@angular/cdk/overlay';

import { SharedService } from "./../shared/shared.service";
import { MainService } from "./../main/main.service";
import { HeaderService } from "./header.service";
import { SidebarService } from "../sidebar/sidebar.service";
import { LabelItem } from "./../main/main.component";
import { environment } from "src/environments/environment";
import { ProjectRenameComponent } from "../dialog/project-rename/project-rename.component";
import { ProjectEndpointComponent } from "../dialog/project-endpoint/project-endpoint.component";
import { ColorCustomComponent } from "../dialog/color-custom/color-custom.component";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
  providers: [DatePipe],
})
export class HeaderComponent implements OnInit {
  private sidebarSubscription: Subscription;
  private headerSubscription: Subscription;

  version = environment.version;
  logoSrc = "";
  myControl = new UntypedFormControl();
  isOpen = false;
  projectName = "";
  projectId = "0";
  selectedIndex = 0;
  viewType = "overview";
  labels: LabelItem[] = [];
  labelMaps = {};
  color = "#FFFFFF";
  icon = "list";
  icon_color = "#000000";
  name_color = "#000000";

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private headerService: HeaderService,
    private mainService: MainService,
    private _snackBar: MatSnackBar,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    public datepipe: DatePipe
  ) {

    this.color = headerService.color;
    this.icon_color = headerService.icon_color;
    this.name_color = headerService.name_color;
    this.icon = headerService.icon;
    this.projectName = headerService.name;
    this.projectId = headerService.id;
  }

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
        this.getProjectInfo();
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


     this.headerSubscription = this.headerService.searchObserable.subscribe(
      (result) => {
        if (result) {
          console.log(result)
          if (result.startsWith("{")) {
            try {
              const body = JSON.parse(result);
              console.log(body)
              let id = body["id"];
              let name = body["name"];
              let icon = body["icon"];
              let icon_color = body["icon_color"];
              let name_color = body["name_color"];
              this.icon = icon;
              this.icon_color = icon_color;
              this.name_color = name_color;
              this.projectName = name;
              this.projectId = id;
              this.cdr.markForCheck();
            } catch (e) {
              console.log(e);
              //this.onSearch(result);
            }
          } else {
          }
        } else {
        }
      }
    );
  
  }

  ngOnDestroy(): void {
    this.sidebarSubscription.unsubscribe();
    this.headerSubscription.unsubscribe();

  }


  getProjectInfo() {
    let project = this.labelMaps[this.projectId];
    if (project) {
      this.color = project.color;
      this.icon = project.icon;
      this.icon_color = project.icon_color;
      this.name_color = project.name_color;

      this.projectName = project.name;
      this.cdr.markForCheck();
    }
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


         let id = dt["id"];
        this.projectId = id;
        let name = dt["name"];
        this.projectName = name;
        let icon = dt["icon"];
        this.icon = icon;
        let icon_color = dt["icon_color"];
        this.icon_color = icon_color;
        let name_color = dt["name_color"];
        this.name_color = name_color;

        
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
      let label: LabelItem = {
        name: "",
        id: "0",
        name_color: "",
        icon: "",
        icon_color: "",
      };
    
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
      width: "800px",
      height: "600px",
      data: { id: this.projectId },
      scrollStrategy: new NoopScrollStrategy()
    });
    //dialogRef.componentInstance.projectId = this.projectId;

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

    customColor() {
    let label = "_createLabel";
    const dialogRef = this.dialog.open(ColorCustomComponent, {
      width: "500px",
      data: {
        id: this.projectId,
        name: this.projectName,
        name_color: this.name_color,
        icon: this.icon,
        icon_color: this.icon_color,
      },
      scrollStrategy: new NoopScrollStrategy(),
    });
    dialogRef.componentInstance.projectId = this.projectId;

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.sidebarService.refresh.next("/refresh");
      for (let key of Object.keys(this.labelMaps)) {
        if (key == this.projectId) {
          let value = this.labelMaps[key];
          value.name_color = result.name_color;
          value.icon = result.icon;
          value.icon_color = result.icon_color;
          this.labelMaps[key] = value;
          this.name_color = result.name_color;
          this.icon = result.icon;
          this.icon_color = result.icon_color;
        }
      }

      //localStorage.setItem(environment.kanbanProjectsKey, JSON.stringify(arr));
    });
  }
}
