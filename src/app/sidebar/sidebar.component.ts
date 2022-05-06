import { Router } from "@angular/router";
import { Component, OnInit, OnDestroy, EventEmitter } from "@angular/core";
import { Subscription, Subject } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NoopScrollStrategy } from '@angular/cdk/overlay';

import { SidebarService } from "./sidebar.service";
import { ProjectCreateComponent } from "../dialog/project-create/project-create.component";
import { MainService } from "../main/main.service";
import { HeaderService } from "./../header/header.service";
import { SharedService } from "./../shared/shared.service";
import { environment } from "src/environments/environment";

export interface LabelItem {
  name: string;
  id: string;
}

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private sidebarSubscription: Subscription;
  private headerSubscription: Subscription;
  private refreshSubscription: Subscription;
  activeSidebar = false;
  uid = 0;
  lable = false;
  blob;

  cOpenClose = false;
  hovered = false;

  labelsRows: any = [];
  labels: LabelItem[] = [];
  selectedLabel = "all";
  selectedId = "0";

  constructor(
    private dialog: MatDialog,
    private headerService: HeaderService,
    private mainService: MainService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private sidebarService: SidebarService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.sidebar();
    this.getAllLabels();

    let url = this.router.url;
    var parsed = this.router.parseUrl(url);
    parsed.queryParams = {};
    let path = parsed.toString();
    this.getSelectedLabel(path);

    this.headerSubscription = this.headerService.searchObserable.subscribe(
      (result) => {
        if (result) {
          if (result.startsWith("{")) {
            try {
              const body = JSON.parse(result);
              let id = body["id"];
              let name = body["name"];
              if (id && name) {
                let label: LabelItem = {
                  name: name,
                  id: id,
                };
                this.onLabel(label);
              }
            } catch {
              //this.onSearch(result);
            }
          } else {
          }
        } else {
        }
      }
    );

    this.refreshSubscription = this.sidebarService.refresh.subscribe(
      (result) => {
        if (!result) {
          return;
        }

        if (result.startsWith("/refresh")) {
          this.getAllLabels();
          return;
        }
      }
    );
  }

  composeBox(body) {
    this.sidebarService.newCompose(body);
  }

  getSelectedLabel(path: string) {
    if (path.startsWith("/project/")) {
      const arr = path.split("/project/");
      if (arr.length > 1) {
        const id = arr[1];
        this.selectedId = id;
      }
    } else {
    }
  }

  clickOnItem(itemNumber) {
    //this.clickedItem = itemNumber;
  }

  hoverSidebar(isHover: boolean) {
    this.hovered = isHover;
  }

  compnayContact() {
    this.openSnackBar("Loading Email", "");
  }

  getAllLabels() {
    this.sharedService.getProjects().subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      this.labels = data.data.list;

      //save to localstorage
      localStorage.setItem(
        environment.projectsKey,
        JSON.stringify(this.labels)
      );
      //this.sharedService.labels = this.labels;
      this.sidebarService.labels = this.labels;
      this.sidebarService.labelChanged(true);
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  private sidebar() {
    this.sidebarSubscription = this.headerService
      .getSidebarActive()
      .subscribe((active) => {
        this.activeSidebar = active;
      });
  }

  labelShowing() {
    this.lable = !this.lable;
  }

  onAdvancedSearch(key) {
    var params = {};
    try {
      params = JSON.parse(decodeURI(key));
    } catch (e) {}
    params = JSON.parse(decodeURI(key));
    var lb = "/advancedsearch/" + this.serialize(params);
    this.selectedLabel = lb;
    this.router.navigate([lb]);
    this.sidebarService.onAdvancedSearch(lb);
  }

  onAll() {
    var lb = "/project/0";
    this.selectedLabel = "";
    this.selectedId = "0";
    this.router.navigate([lb]);
    this.sidebarService.onAll();
  }

  onLabel(lab) {
    var lb = "/project/" + lab.id;
    this.selectedLabel = lab.name;
    this.selectedId = lab.id;
    this.router.navigate([lb]);
    this.sidebarService.onLabel(lab);
  }

  onSelect(label: LabelItem) {
    var lb = "/project/" + label.id;
    this.selectedLabel = label.name;
    this.selectedId = label.id;
    this.router.navigate([lb]);
    this.sidebarService.onSelect(lb);
  }

  manageProject() {
    let label = "_manageLabel";
    this.selectedLabel = label;
    this.router.navigate(["/settings/label"]);
    this.sidebarService.onSelect(label);
  }

  createProject() {
    let label = "_createLabel";
    this.selectedLabel = label;
    const dialogRef = this.dialog.open(ProjectCreateComponent, {
      width: "600px",
      scrollStrategy: new NoopScrollStrategy(),
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  ngOnDestroy() {
    this.sidebarSubscription.unsubscribe();
    this.headerSubscription.unsubscribe();
    this.refreshSubscription.unsubscribe();
  }

  serialize(obj): string {
    var str = [];
    for (var p in obj) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
  }
}
