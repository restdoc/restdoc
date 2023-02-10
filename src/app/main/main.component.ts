import { DOCUMENT } from "@angular/common";
import { Inject, Component, OnInit, OnDestroy } from "@angular/core";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { Subscription, from } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


import { SidebarService } from "../sidebar/sidebar.service";
import { Hotkey } from "./../third/angular2-hotkeys/hotkey.model";
import { HotkeysService } from "./../third/angular2-hotkeys/hotkeys.service";


export enum PostType {
    FormData = "form-data",
    FormUrlencoded = "form-url-encoded",
    Raw = "raw",
    Binary = "binary",
    Nonte = "none",
    Empty = "",
}

export interface Team {
  id: string;
  name: string;
}

export interface Host {
  name: string;
  value: string;
}

export interface Attachment {
  fid: string;
  name: string;
  contentType: string;
  percentage: number;
  size: number;
  formatedSize: string;
  uploaded: boolean;
}

export type AttachmentMap = {
  [name: string]: Attachment[];
};

type Attachments = Array<Attachment>;

export interface User {
  id: string;
  email: string;
  profile_image_url: string;
}

export interface ProjectElement {
  id: string;
  name: string;
}


export interface EndpointElement {
  id: string;
  name: string;
  value: string;
}

export interface APIElement {
  id: string;
  principal_id: string;
  name: string;
  color: string;
  status: number;
  method: string;
  path: string;
  host: string;
  desc: string;
  disabled: boolean;
  params: ParamElement[];
  form_data: ParamElement[];
  raw: string | "";
  binary: string | "";
  post_type: PostType | "";
  headers: HeaderElement[];
  response: ResponseElement | null;
}



export interface HeaderElement {
  id: string;
  key: string;
  value: string;
  desc: string;
  enabled: boolean;
}

export interface ParamElement {
  id: string;
  key: string;
  value: string;
  desc: string;
  enabled: boolean;
  required: boolean;
}

export interface ResponseElement {
  body: string;
  contentType: string;
  headers: HeaderElement[];
  responseUrl: string;
}

export interface BoardInfo {
  id: string;
  name: string;
}

export interface BoardElement {
  editing: boolean;
  disabled: boolean;
  info: BoardInfo;
  apis: APIElement[];
}

export interface LabelItem {
  name: string;
  id: string;
}

export interface Compose {
  name: string;
  isExpand: boolean;
  isFullScreen: boolean;
  isDisplay: boolean;
}

export const CardColors: string[] = [
  "#000000",
  "#ffffff",
  "#808080",
  "#D82148",
  "#65C18C",
  "#FFB72B",
  "#427fed",
];


@Pipe({
  name: 'safe'
})

export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }

  transform(url) {

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);

  }

}



@Pipe({
  name: "truncate",
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number): string {
    if (!value) {
      return "";
    }
    let length = value.length;
    return length > limit ? value.substring(length - limit, length) : value;
  }
}



@Pipe({ name: 'sanit' })
export class SanitizeHtmlPipe implements PipeTransform {

  constructor(private _sanitizer: DomSanitizer) { }

  transform(value: string): SafeHtml {
    return this._sanitizer.bypassSecurityTrustHtml(value);
  }

}

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
  // host: {'(click)':'emptyClick()', '(contextmenu)': 'emptyContextMenu()'},
})
export class MainComponent implements OnInit, OnDestroy {
  isComposeOpen: boolean = false;
  menuRow = "";
  hoveredIndex = 0;
  command = "";
  displayedColumns: string[] = ["select", "name"];
  gPressed = 0;
  starPressed = 0;
  gLabelKeys = [];
  gLabelValues = {};
  selectKeys = [];
  selectValues = {};
  commonKeys = [];
  commonKeysMaps = new Map();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private fb: UntypedFormBuilder,
    private sidebarService: SidebarService,
    private _hotkeysService: HotkeysService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.handleCommonHotKey();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  handleCommonHotKey() {
    var hotKeys: Hotkey[] = [];
    for (var i = 0; i < this.commonKeys.length; i++) {
      var commonKey = this.commonKeys[i];
      var key = commonKey["key"];
      var desc = commonKey["desc"];
      var command = commonKey["command"];
      this.command = command;
      this.commonKeysMaps[key] = { key: key, command: command };

      var hotKey = new Hotkey(
        key,
        function (event: KeyboardEvent, key) {
          event.preventDefault();
          var item = this.commonKeysMaps[key];
          var command = item["command"];
          this.sidebarService.onKey(command);
          event.stopPropagation();
          return false; // Prevent bubbling
        }.bind(this),
        [],
        desc
      );
      hotKeys.push(hotKey);
    }
    this._hotkeysService.add(hotKeys);
  }

  OnKeydown(event) {}

  handleCommonKey(k) {
    switch (k) {
      case "ctrl+.":
        this.sidebarService.onKey("/key/compose/next");
        break;
      default:
        break;
    }
  }

  handleKey(k) {}

  emptyClick($event) {
    this.sidebarService.onEvent("/empty-click");
  }

  emptyContextMenu() {
    if (this.hoveredIndex && this.hoveredIndex >= 0) {
    } else {
      this.menuRow = "";
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {}

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {}

  /** The label for the checkbox on the passed row */
  onResize(event) {}
}

