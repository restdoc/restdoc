import { DragDropModule } from "@angular/cdk/drag-drop";
import { DOCUMENT, PlatformLocation, DatePipe } from "@angular/common";
import { Router, UrlTree, ActivatedRoute, } from "@angular/router";
import { NavigationStart, NavigationEnd, } from "@angular/router";
import { HttpParams } from "@angular/common/http";
import {
  Component,
  OnInit,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  Renderer2,
} from "@angular/core";
import {
  Inject,
  Injectable,
  EventEmitter,
  Directive,
  Output,
  HostListener,
  ChangeDetectionStrategy,
} from "@angular/core";
import { NoopScrollStrategy } from '@angular/cdk/overlay';


import { environment } from "src/environments/environment";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import { MatListModule, MatListOption } from "@angular/material/list";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UntypedFormGroup, UntypedFormBuilder } from "@angular/forms";
import { from, Subscription, Observable, of, Subject } from "rxjs";
import { ajax } from "rxjs/ajax";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  catchError,
} from "rxjs/operators";
import {
  CdkDropList,
  CdkDragDrop,
  CdkDrag,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { MatInputModule } from "@angular/material/input";

import { ToastrService } from "ngx-toastr";

import { HeaderService } from "../../header/header.service";
import { SharedService } from "../../shared/shared.service";
import { SidebarService } from "../../sidebar/sidebar.service";
import { APIlistService } from "./apilist.service";
import { DetailsComponent } from "../details/details.component";
import { ProjectRenameComponent } from "src/app/dialog/project-rename/project-rename.component";
import { ProjectEndpointComponent } from "../../dialog/project-endpoint/project-endpoint.component";
import { CardColors, LabelItem, ProjectElement, BoardElement } from "../main.component";
import { EndpointElement, APIElement, ParamElement } from "../main.component";
import { HeaderElement, ResponseElement, PostType, SanitizeHtmlPipe } from "../main.component";
import { UtilsService  } from "../main.service";
import { consoleTestResultsHandler } from "tslint/lib/test";



@Component({
  selector: "app-apilist",
  templateUrl: "./apilist.component.html",
  styleUrls: ["./apilist.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class APIlistComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger, { static: true })
  contextMenu: MatMenuTrigger;

  @ViewChild("mailTable")
  mailTable: ElementRef;

  @ViewChild("moveMenuTrigger") moveMenuTrigger: MatMenuTrigger;
  @ViewChild("labelMenuTrigger") labelMenuTrigger: MatMenuTrigger;
  @ViewChild("cardMoreMenuTrigger") cardMoreMenuTrigger: MatMenuTrigger;
  @ViewChild("cardColorMenuTrigger") cardColorMenuTrigger: MatMenuTrigger;
  @ViewChild("contextMenuTrigger") contextMenuTrigger: MatMenuTrigger;
  @ViewChild("cardDateMenuTrigger") cardDateMenuTrigger: MatMenuTrigger;
  @ViewChild("cardDateTableMenuTrigger")
  cardDateTableMenuTrigger: MatMenuTrigger;

  private apisSubscription: Subscription;
  private projectsSubscription: Subscription;
  private labelChangeSubscription: Subscription;
  private sidebarSubscription: Subscription;
  private sidebarLabelSubscription: Subscription;
  
  hasExtensionInstalled = true;
  pathUpdateSucceed = $localize`The path has been updated successfully.`;
  pathUpdateFailure = $localize`Failed to update path.`;
  methodUpdateSucceed = $localize`The method has been updated successfully.`;
  methodUpdateFailure = $localize`Failed to update method.`;
  noEndpointFailure = $localize`There is not any endpoints.`;
  paramDeleteFailure = $localize`Failed to delete param.`;
  listMode = true;
  viewType = "overview";
  keyword = "";
  addingAPIKeyPrefix = "addingAPI-";
  searchParams = new Map();
  selectedId = "";
  detailId = "";
  composeId = "";
  menuopen = false;
  searchForm: UntypedFormGroup;
  label: string;
  selectedDate: Date | null = null;
  cardColors = CardColors;
  projects: ProjectElement[] = [];
  boards: BoardElement[] = [];
  contextBoard: BoardElement = null;
  contextAPI: APIElement = null;
  dateAPI: APIElement = null;
  currentProject: ProjectElement = null;
  currentLabel: string = "";
  currentProjectId: string = "0";
  currentEndpoint: EndpointElement;
  newBottomAPI: string = "";
  newTopAPI: string = "";
  newBoard: string = "";
  bottomAddingAPI: string = "";
  topAddingAPI: string = "";
  addingBoard: boolean = false;
  isCustomedLabel = false;
  labels: LabelItem[] = [];
  editingBoards = new Map();
  editingAPIs = new Map();
  disabledBoards = new Map();
  disabledAPIs = new Map();
  tableFoldedList = new Map();
  boardFoldedList = new Map();
  hoveredBoards = new Map();
  hoveredAPIId = "";
  hoveredAPIs = new Map();
  profileImages = new Map();
  cardMenuOpening = false;
  cardColorMenuOpening = false;
  menuX = 0;
  menuY = 0;
  menuRow = "";
  leftHasFolded = false;
  leftHasExpanded = false;
  rightHasFolded = false;
  rightHasExpanded = false;
  topHasFolded = false;
  topHasExpanded = false;
  bottomHasFolded = false;
  bottomHasExpanded = false;
  requests: APIElement[] = [];
  selectedRequestIndex = 0;
  hoveredRequestId = "";
  defaultParamKey = "";
  defaultParamValue = "";
  defaultParamDesc = "";
  defaultParamStatus = false;
  defaultFormDataKey = "";
  defaultFormDataValue = "";
  defaultFormDataDesc = "";
  defaultFormDataStatus = false;
  defaultHeaderKey = "";
  defaultHeaderValue = "";
  defaultHeaderDesc = "";
  defaultHeaderStatus = false;
  editorOptions = { theme: "vs-dark", language: "javascript" };
  code: string = 'function x() {\nconsole.log("Hello world!");\n}';
  originalCode: string = "function x() { // TODO }";
  projectEndpoints: EndpointElement[] = [];
  showGroups = true
  methods = [
    "GET",
    "POST",
  ];


  @HostListener("window:message", ["$event"])
  messages(event) {
    // We only accept messages from this window to itself [i.e. not from any iframes]

    if (event.source != window) return;


    console.log("event ");
    console.log(event);

    if (event.data.type) {

      if (event.data.type == "__RESTDOC_EXTENSION_PING__") {
        console.log("ping")
        return;
      }

      if (event.data.type == "__RESTDOC_EXTENSION_RESPONSE__") {

        console.log(event.data);

        let index = this.selectedRequestIndex;
        let request = this.requests[index];
        console.log("current request");
        console.log(request);

        var resp: ResponseElement = { body: "", headers: [] , contentType: "", responseUrl: ""};
        console.log(event.data);
       
        //
        let _headers = event.data.response.headers;
        let rawContentType = _headers["content-type"];
        let contentType = this.utilsService.formatContentType(rawContentType);
        resp.contentType = contentType
        console.log(contentType);
        switch (contentType) {
          case "json":
            resp.body = JSON.stringify(event.data.response.data, null, 4);
            console.log(resp.body);
            break;
          case "xml":
            let formated = this.prettifyXml(event.data.response.data)
            console.log(formated);
            resp.body = formated;
            break;
          case "html":
            let body = event.data.response.data;
            resp.body = body;
            break;
          default:
        }

        let respUrl = event.data.response.responseURL;
        resp.responseUrl = respUrl;
        console.log(resp);
        console.log(respUrl);

        var headers = [];
        for (let key in _headers) {
          let value = _headers[key];
          let header = {"key": key, "value": value};
          
          headers.push(header);
        }

        
        console.log(headers);
        console.log(resp);
        resp.headers = headers;
        request.response = resp;
        //this.cdr.markForCheck();
      }

      if (event.data.type == "__RESTDOC_EXTENSION_ERROR__") {

        console.log(event.data);

        let index = this.selectedRequestIndex;
        let request = this.requests[index];
        console.log("current request");
        console.log(request);

        let response = event.data.error;
        
        var resp: ResponseElement = { body: "", headers: [] , contentType: "json", responseUrl: ""};
        resp.body = JSON.stringify(response, null, 4);
        console.log(resp.body);

        console.log(response);
        console.log(event.data);
        let respUrl = event.data.data.url;
        console.log(respUrl);
        resp.responseUrl = respUrl;

        console.log(resp);
        request.response = resp;

        this.cdr.markForCheck();

        //this.
        //chrome.runtime.sendMessage(event.data); // broadcasts it to rest of extension, or could just broadcast event.data.payload...
      } // else ignore messages seemingly not sent to yourself
    }
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sidebarService: SidebarService,
    private apilistService: APIlistService,
    private headerService: HeaderService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private utilsService: UtilsService,
    private datepipe: DatePipe,
    private toastr: ToastrService
  ) {
    const location = window.location;
    this.currentProjectId = this.sharedService.getProjectId(location);
  }

  ngOnInit() {
    // 如果弹出框没有被阻止且加载完成

    // 这行语句没有发送信息出去，即使假设当前页面没有改变location（因为targetOrigin设置不对）




    this.ping();



    this.profileImages.set(
      "343155761318212238",
      "https://s3.amazonaws.com/profile_photos/527123566787.527123566789.rjH5R94CF8IzttDsdchG_27x27.png"
    );
    var u = this.router.url;
    var parsed = this.router.parseUrl(u);
    //parsed.queryParams = {};
    var path = parsed.toString();
    this.getCurrentState(path);

    this.getData();


    this.searchForm = this.fb.group({
      search: [""],
    });

    this.initUserInfo();

    this.sidebarLabelSubscription = this.sidebarService.labelChange.subscribe(
      (res) => {
        console.log(res)
      }
    );

    this.sidebarSubscription = this.sidebarService.leftMenuActive.subscribe(
      (res) => {
        if (res == "/empty-click") {
          this.menuRow = "";
          this.updateAPIContextMenu(false);
          return;
        }

        if (res.startsWith("/key/")) {
          return;
        }

        if (res.startsWith("/change/")) {
          try {
            let body = res.replace("/change/", "");
            let data = JSON.parse(decodeURIComponent(body));
            this.handleChanges(data);
          } catch {}
          return;
        }

        try {
          let data = JSON.parse(decodeURIComponent(res));
          console.log(data)
          this.handleCommand(data);
          return
        } catch {

        }







        //this.cdr.markForCheck();
      }
    );

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger == "popstate") {
          let url = event.url;
          if (url.startsWith("/project/")) {
            let arr = url.split("/");
            if (arr.length === 3) {
              let label = arr[2];
              //this.sidebarService.refresh.next(url);
              return;
            }
          }
          this.getCurrentState(url);
          return;
        }
        let url = event.url;
        this.getCurrentState(url);
      }

      if (event instanceof NavigationEnd) {
        let url = event.url;
        this.getCurrentState(url);
      }
    });
  }

  ngAfterViewInit() {
    this.checkExtensionInstalled(3000);
  }

  ngOnDestroy() {
    if (this.apisSubscription) {
      this.apisSubscription.unsubscribe();
    }
    if (this.projectsSubscription) {
      this.projectsSubscription.unsubscribe();
    }
    this.sidebarSubscription.unsubscribe();
    this.sidebarLabelSubscription.unsubscribe();
    if (this.labelChangeSubscription) {
      this.labelChangeSubscription.unsubscribe();
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }


  checkExtensionInstalled(timeout) {

    var that = this;
    setTimeout(function () {
      let hook = window["__RESTDOC_EXTENSION_HOOK__"];
      if (hook !== undefined) {
        that.hasExtensionInstalled = true;
      } else {
        console.log('false');
        that.hasExtensionInstalled = false;
      }
      that.cdr.markForCheck();
    }, timeout);
    return 
  }


  prettifyXml(sourceXml: string) : string {
    var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
    var xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml');

    var xsltProcessor = new XSLTProcessor();    
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
  }

  
  progress(board: BoardElement): string {
    //return this.firstName + this.lastName;
    var total = 0;
    var finished = 0;
    for (var i = 0; i < board.apis.length; i++) {
      var card = board.apis[i];
      if (card.status == 1) {
        finished += 1;
      }
      total += 1;
    }
    if (total == 0) {
      return "0";
    }
    return "" + (finished * 100) / total;
  }

  addAPI(listId: string, top: boolean) {
    if (top) {
      this.topAddingAPI = listId;
      this.focusAddingAPI();
      this.updateAPIContextMenu(false);
      this.updateBoardContextMenu(false);
    } else {
      this.bottomAddingAPI = listId;
      this.focusAddingAPI();
      this.updateAPIContextMenu(false);
      this.updateBoardContextMenu(false);
    }
  }

  focusAddingAPI() {
    setTimeout(function () {
      let els = this.document.getElementsByClassName("adding-item");
      if (els.length == 0) {
        return;
      }
      let el = els[0] as HTMLElement;
      if (!el) {
        return;
      }
      let children = el.childNodes;

      if (children.length > 0) {
        let textarea = children[0] as HTMLElement;
        textarea.focus();
      }
    }, 100);
  }

  cancel(board: BoardElement, top: boolean) {
    if (top) {
      this.topAddingAPI = "";
      this.newTopAPI = "";
    } else {
      this.bottomAddingAPI = "";
      this.newBottomAPI = "";
    }
  }


  updateAPIName(request: APIElement) {
    console.log('dirty');
    console.log(request);

    let params = {"id": request.id, "name": request.name};

    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        //let api = this.utilsService.formatRequest(detail);
        //board.apis.push(api);
        //this.bottomAddingAPI = "";
        //this.newBottomAPI = "";
        this.cdr.markForCheck();
      }
    });

  }

  updateAPIMethod(request: APIElement, method: string) {
    console.log(method);

    request.method = method;
    let params = {"id": request.id, "method": method};

    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        //let api = this.utilsService.formatRequest(detail);
        //board.apis.push(api);
        //this.bottomAddingAPI = "";
        //this.newBottomAPI = "";

        let message = this.methodUpdateSucceed
        this.toastr.success(message);

        
        this.cdr.markForCheck();
      } else {
        let message = this.methodUpdateFailure
        this.toastr.success(message);
      }
    });
}

  updateAPIPath(request: APIElement) {
    console.log(request);


    //check if is url
    //

    var path = "";
    var uri: URL = {
      pathname: request.path,
      hash: "",
      host: "",
      hostname: "",
      href: "",
      origin: "",
      password: "",
      port: "",
      protocol: "",
      search: "",
      searchParams: undefined,
      username: "",
      toJSON: function (): string {
        throw new Error("Function not implemented.");
      }
    };
    if (uri) {
      path = uri.pathname;
      if (uri.search != "") {
        var searchParams = new URLSearchParams(uri.search);
        console.log(searchParams);
      }
      request.path = path;
    }


    
    const tree: UrlTree = this.router.parseUrl(uri.search);
    console.log(tree);
    const ps = tree.queryParams;
    for (var k in ps) {
      console.log([k, ps[k]]);
      let value = ps[k];
      let param: ParamElement = {id: "", key: k, value: value, desc: "", enabled: true, required: false };
      request.params.push(param)
      //
    }

    let params = {"id": request.id, "path": path};

    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        //let api = this.utilsService.formatRequest(detail);
        //board.apis.push(api);
        //this.bottomAddingAPI = "";
        //this.newBottomAPI = "";
        let message = this.pathUpdateSucceed
        this.toastr.success(message);
        this.cdr.markForCheck();
      } else {
        let message = this.pathUpdateFailure
        this.toastr.success(message);
      }
    });
  }

  handleCommand(command: any) {
    const cmd = command['cmd'];
    switch (cmd) {
      case 'showgroups':
        this.showGroups = true 
        this.cdr.markForCheck();
        break;
      case 'hidegroups':
        this.showGroups = false 
        this.cdr.markForCheck();
        break;
      case 'changeproject':
        this.getProjectInfo(command);
        this.getData();
        break;
      default:
    }
  }

  getProjectEndpoints() {

    /*
     var cachedLabels = localStorage.getItem(environment.projectsKey);
     if (cachedLabels && cachedLabels != null) {

       var _labels = JSON.parse(cachedLabels);
       for (var i = 0; i < _labels.length; i++) {
         var project = _labels[i];
         if (project.id == this.currentProjectId) {
           this.projectEndpoints = project.endpoints;
           this.getCurrentEndpoint();
          break;
         }
       }
     }
     */

  }

  updateEndpoints() {
    const dialogRef = this.dialog.open(ProjectEndpointComponent, {
      width: "800px",
      height: "600px",
      data: {id: this.currentProjectId},
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      if (result.endpoints) {
        var newEndpoints:EndpointElement[] = [];
        //this.projectName = result.name;
        for (var i = 0; i < result.endpoints; i++){
          let item = result.endpoints[i];
          //let endpoint: EndpointElement = {name: item.v}

        }
        this.projectEndpoints = result.endpoints;
        this.cdr.markForCheck();
      }
    });

  }

  
  saveNewBottomAPI(board: BoardElement) {
    let text = this.newBottomAPI;
    let listId = board.info.id;
    var params = { group_id: listId, name: text };
    let apis = board.apis;
    let last = apis[apis.length - 1];
    if (last) {
      let afterId = last.id;
      params["after_id"] = afterId;
    }

    this.sharedService.addAPIToGroup(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        let api = this.utilsService.formatRequest(detail);
        board.apis.push(api);
        this.bottomAddingAPI = "";
        this.newBottomAPI = "";
        this.cdr.markForCheck();
      }
    });
  }

  saveNewTopAPI(board: BoardElement) {
    let text = this.newTopAPI;
    let listId = board.info.id;
    var params = { group_id: listId, name: text };
    let apis = board.apis;
    var beforeId = "";
    if (apis.length > 0) {
      let first = apis[0];
      beforeId = first.id;
      params["before_id"] = beforeId;
    }

    this.sharedService.addAPIToGroup(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        let api = this.utilsService.formatRequest(detail);
        board.apis.unshift(api);
        this.topAddingAPI = "";
        this.newTopAPI = "";
        this.cdr.markForCheck();
      }
    });
  }

  startEditingAPI(board: BoardElement, item: APIElement) {
    this.editTask(board, item);

    let id = item.id + "";
    let el = this.document.getElementById(id) ;
    if (!el) {
      return;
    }

    let textareas = el.getElementsByTagName("textarea");
    if (textareas.length > 0) {
      /*
      let textarea = textareas[0];
      setTimeout(function () {
         textarea.focus();
       }, 0);
       */
      /*
      this.renderer.removeClass(item, 'contextmenu-hide');
      this.renderer.addClass(item, 'contextmenu-show');
      this.renderer.setStyle(item, 'left', this.menuX + 'px');
      this.renderer.setStyle(item, 'top', (this.menuY - 65) + 'px');
      */
    }
  }

  FoldList(id: string) {
    if (this.tableFoldedList.has(id)) {
      this.tableFoldedList.delete(id);
    } else {
      this.tableFoldedList.set(id, true);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
    return;
  }

  foldLeft(id: string) {
    for (var i = 0; i < this.boards.length; i++) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.boardFoldedList.set(board.info.id, true);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  expandLeft(id: string) {
    for (var i = 0; i < this.boards.length; i++) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.boardFoldedList.delete(board.info.id);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  expandRight(id: string) {
    for (var i = this.boards.length - 1; i > 0; i--) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.boardFoldedList.delete(board.info.id);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  foldRight(id: string) {
    for (var i = this.boards.length - 1; i > 0; i--) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.boardFoldedList.set(board.info.id, true);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  foldTop(id: string) {
    for (var i = 0; i < this.boards.length; i++) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.tableFoldedList.set(board.info.id, true);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  expandTop(id: string) {
    for (var i = 0; i < this.boards.length; i++) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.tableFoldedList.delete(board.info.id);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  expandBottom(id: string) {
    for (var i = this.boards.length - 1; i > 0; i--) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.tableFoldedList.delete(board.info.id);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  foldBottom(id: string) {
    for (var i = this.boards.length - 1; i > 0; i--) {
      let board = this.boards[i];
      if (board.info.id == id) {
        break;
      }
      this.tableFoldedList.set(board.info.id, true);
    }

    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
    this.cdr.markForCheck();
  }

  focusBoard(board: BoardElement) {
    this.editBoard(board);
  }

  startEditingBoard(board: BoardElement) {
    this.editBoard(board);

    let id = "boards-" + board.info.id;
    let el = this.document.getElementById(id);
    if (el) {
      el.focus();
    }
  }

  blurBoard(board: BoardElement) {
    if (!board) {
      return;
    }
    this.editingBoards.delete(board.info.id);
  }

  saveBoard(board: BoardElement) {
    if (board.info.id == "") {
      return;
    }
    if (board.info.name == "") {
      return;
    }
    let params = { id: board.info.id, name: board.info.name };
    this.sharedService.updateGroupStatus(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      //item.status = state;
      //this.editing.set(item.id, true);
      if (data) {
        if (data.code == 1) {
          return;
        } else {
          //this.editing.delete(board.id);
        }
      }
      this.cdr.markForCheck();
    });
  }

  focusAPI(board: BoardElement, item: APIElement) {
    this.editTask(board, item);
  }

  blurAPI(board: BoardElement, item: APIElement) {
    //this.editingAPIs.delete(item.id);
    this.editingAPIs.delete(item.id);
    this.disabledBoards.delete(board.info.id);
    this.disabledAPIs.delete(item.id);
  }

  hoverAPI(event: MouseEvent, boardId: string, id: string, state: boolean) {
    if (state) {
      this.hoveredAPIId = id;
      this.hoveredAPIs.set(id, true);
    } else {
      if (!this.cardMenuOpening) {
        setTimeout(function () {
          this.hoveredAPIId = "";
        }, 500);
        //this.hoveredAPIs.delete(id);
      }
    }
  }

  isValidInput(charCode): boolean {
    if (
      (charCode > 47 && charCode < 58) ||
      (charCode > 64 && charCode < 91) ||
      (charCode > 96 && charCode < 123)
    )
      return true;
    else return false;
  }

  focusNode(parentName: string, childName: string) {
    setTimeout(function () {
      let els = this.document.getElementsByClassName(parentName);
      if (els.length > 0) {
        let last = els[els.length - 1] as HTMLElement;
        let inputs = last.getElementsByClassName(childName);
        if (inputs.length > 0) {
          let input = inputs[0] as HTMLElement;
          input.focus();
        }
      }
    }, 0);
  }


  inputParam(event, request, type, page) {
    if (!event) {
      return
    }
    console.log('input');
    const data = event.data;

    event.target.value = ""

      //this.defaultParamKey = "";
      let param = { key: "", value: "", desc: "", disabled: false };

      let parentName = "normal-param-item";
      var childName = "field-key-input";
      switch (type) {
        case "key":
          param[type] = data;
          childName = "field-" + type + "-input";
          break;
        case "value":
          param[type] = data;
          this.defaultParamValue = "";
          childName = "field-" + type + "-input";
          break;
        case "desc":
          param[type] = data;
          this.defaultParamDesc = "";
          childName = "field-" + type + "-input";
          break;
        default:
          return;
      }
      param["enabled"] = true;

      //
      if (page == "document") {

        if (type == "key") {
          request.params.push(param);
          this.focusNode(parentName, childName);
          this.cdr.markForCheck();
        }
      } else {
        request.params.push(param);
        this.focusNode(parentName, childName);
        this.cdr.markForCheck();
      }

  }

  deleteParam(request: APIElement, i: number) {
    if (request) {
      let param = request.params[i];
      if (param.id && param.id != "") {
        let params = {"id": param.id};
        this.sharedService.deleteParam(params).subscribe((data: any) => {
          this.sharedService.checkResponse(location, data);

          if (data && data.code == 0 && data.data && data.data.detail) {
            let detail = data.data.detail;
            request.params.splice(i, 1);
            this.cdr.markForCheck();
          } else {
            let message = this.paramDeleteFailure;
            this.toastr.success(message);
          }
        })
      } else {
        request.params.splice(i, 1);
      }
    }
  }

  deleteFormData(request: APIElement, i: number) {
    if (request) {

      let param = request.form_data[i];
      if (param.id && param.id != "") {
        let params = {"id": param.id};
        this.sharedService.deleteParam(params).subscribe((data: any) => {
          this.sharedService.checkResponse(location, data);

          if (data && data.code == 0 && data.data && data.data.detail) {
            let detail = data.data.detail;
            request.form_data.splice(i, 1);
            this.cdr.markForCheck();
          } else {
            //todo show message
          }
        })
      } else {
          request.form_data.splice(i, 1);
      }
    }
  }


  deleteHeader(request: APIElement, i: number) {
    if (request) {
      let param = request.headers[i];
      if (param.id && param.id != "") {
        let params = {"id": param.id};
        this.sharedService.deleteParam(params).subscribe((data: any) => {
          this.sharedService.checkResponse(location, data);

          if (data && data.code == 0 && data.data && data.data.detail) {
            let detail = data.data.detail;
            request.headers.splice(i, 1);
            this.cdr.markForCheck();
          } else {
            let message = this.paramDeleteFailure;
            this.toastr.success(message);
          }
        })
      } else {
        request.headers.splice(i, 1);
      }
    }
  }

  inputHeader(event, request, type) {

    if (!event) {
      return
    }
    const data = event.data;

    event.target.value = ""

    let header = { key: "", value: "", desc: "", enabled: false };

    let parentName = "normal-header-item";
    var childName = "field-key-input";
    switch (type) {
      case "key":
        header[type] = data;
        this.defaultHeaderKey = "";
        childName = "field-" + type + "-input";
        break;
      case "value":
        header[type] = data;
        this.defaultHeaderValue = "";
        childName = "field-" + type + "-input";
        break;
      case "desc":
        header[type] = data;
        this.defaultHeaderDesc = "";
        childName = "field-" + type + "-input";
        break;
      default:
        return;
    }
    header.enabled = true;
    request.headers.push(header);
    this.cdr.markForCheck();
    this.focusNode(parentName, childName);
  }

  inputFormData(event, request, type, page) {

    if (!event) {
      return
    }
    const data = event.data;

    event.target.value = ""

    var param = { id: "", key: "", value: "", desc: "", disabled: false };

    let parentName = "normal-param-item";
    var childName = "field-key-input";
    switch (type) {
      case "key":
        param[type] = data;
        this.defaultFormDataKey = "";
        childName = "field-" + type + "-input";
        break;
      case "value":
        param[type] = data;
        this.defaultFormDataValue = "";
        childName = "field-" + type + "-input";
        break;
      case "desc":
        param[type] = data;
        this.defaultFormDataDesc = "";
        childName = "field-" + type + "-input";
        break;
      default:
        return;
    }
    param["enabled"] = true;

    if (page == "document") {

      if (type == "key") {

        let params = {"api_id": request.id, "name": event.key };
        /*
        this.sharedService.addParam(params).subscribe((data: any) => {
          this.sharedService.checkResponse(location, data);

          if (data && data.code == 0 && data.data && data.data.detail) {
            let detail = data.data.detail;
            request.form_data.push(param);
            this.cdr.markForCheck();
            this.focusNode(parentName, childName);
          }
        })
        */
        request.form_data.push(param);
        this.cdr.markForCheck();
        this.focusNode(parentName, childName);

      }

    } else {
      request.form_data.push(param);
      this.cdr.markForCheck();
      this.focusNode(parentName, childName);
    }
    this.cdr.markForCheck();
    this.focusNode(parentName, childName);
  }

  saveParam(request, param) {
    if (param.id && param.id != "") {
      let params = {"id": param.id, "name": param.key, "type": "get" };
      this.sharedService.updateParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          this.cdr.markForCheck();
        }
      })


    } else {
      let params = {"api_id": request.id, "name": param.key, "type": "get" };
      this.sharedService.addParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          this.cdr.markForCheck();
        }
      })
    }
  }

  saveHeader(request, param) {
    if (param.id && param.id != "") {
      let params = {"id": param.id, "name": param.key, "type": "header" };
      this.sharedService.updateParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          this.cdr.markForCheck();
        }
      })


    } else {
      let params = {"api_id": request.id, "name": param.key, "type": "header" };
      this.sharedService.addParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          this.cdr.markForCheck();
        }
      })
    }
  }

  saveFormData(request, i) {
    let param = request.form_data[i];
    if (param.id && param.id != "") {
      let params = {"id": param.id, "name": param.key, "type": "form" };
      this.sharedService.updateParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          this.cdr.markForCheck();
        }
      })


    } else {
      let params = {"api_id": request.id, "name": param.key, "type": "form" };
      this.sharedService.addParam(params).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (data && data.code == 0 && data.data && data.data.detail) {
          let detail = data.data.detail;
          request.form_data[i].id = detail.id;
          this.cdr.markForCheck();
        }
      })
    }
  }

  changeContentType(event, request) {
    switch (event.value) {
      case "preview":
        request.response.contentType = 'preview';
        break;
      case "html":
        request.response.contentType = 'html';
        break;
      default:
    }
    this.cdr.markForCheck();
  }

  changeRawContentType(event, request) {
    switch (event.value) {
      case "preview":
        //request.response.contentType = 'preview';
        break;
      case "html":
        //request.response.contentType = 'html';
        break;
      case "json":
        break;
      default:
    }
    this.cdr.markForCheck();
  }



  expandBoard(board: BoardElement) {}

  detail(event: any, board: BoardElement, request: APIElement) {
    if (event) {
      event.stopPropagation();
    }

    console.log("detail");

    this.updateAPIContextMenu(false);


    let apiId = request.id;
    this.sharedService.getAPIDetail(apiId).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);
        console.log(data);
        if (!data || data.code != 0) {
          return
        }
        console.log(data);

         //var ps: ParamElement[] = [];
    //ps.push({ key: "x", value: "y", desc: "", enabled: false, required: true });
        let detail = data.data.detail;
        console.log("detail");
        console.log(detail);
        request.params = detail.get_params;
        request.form_data = detail.form_params;
        request.headers = detail.header_params;
        this.cdr.markForCheck();
      })



    //

 

    var exist = false;
    for (var i = 0; i < this.requests.length; i++) {
      let r = this.requests[i];
      if (r.id == request.id) {
        exist = true;
        this.composeId = request.id;
        this.selectedRequestIndex = i;
        break;
      }
    }

    if (!exist) {
      this.requests.push(request);
      this.composeId = request.id;
      this.selectedRequestIndex = this.requests.length - 1;
    }

    /*
    this.cdr.markForCheck();

    var info = new Map();
    //todo i18n
    info["id"] = mailId;

    info["action"] = "forward";
    var body = JSON.stringify(info);
    //get detail
    this.sidebarService.newCompose(body);
    */
  }

  replaceDetail(event: any, board: BoardElement, request: APIElement) {
    if (event) {
      event.stopPropagation();
    }

    console.log("replace detail");

    this.updateAPIContextMenu(false);


    let apiId = request.id;
    this.sharedService.getAPIDetail(apiId).subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);
        console.log(data);
        if (!data || data.code != 0) {
          return
        }
        console.log(data);

         //var ps: ParamElement[] = [];
    //ps.push({ key: "x", value: "y", desc: "", enabled: false, required: true });
        let detail = data.data.detail;
        console.log("detail");
        console.log(detail);
        request.params = detail.get_params;
        request.form_data = detail.form_params;
        request.headers = detail.header_params;
        this.cdr.markForCheck();
      })


    var exist = false;
    for (var i = 0; i < this.requests.length; i++) {
      let r = this.requests[i];
      if (r.id == request.id) {
        exist = true;
        this.composeId = request.id;
        this.selectedRequestIndex = i;
        break;
      }
    }

    if (!exist) {

      //replace current

      this.requests.splice(this.selectedRequestIndex, 1,request);
      this.composeId = request.id;
      //this.selectedRequestIndex = this.requests.length - 1;
    }

    /*
    this.cdr.markForCheck();

    var info = new Map();
    //todo i18n
    info["id"] = mailId;

    info["action"] = "forward";
    var body = JSON.stringify(info);
    //get detail
    this.sidebarService.newCompose(body);
    */
  }


  closeRequest(request: APIElement) {
    //
    for (var i = 0; i < this.requests.length; i++) {
      let r = this.requests[i];
      if (request.id == r.id) {
        this.requests.splice(i, 1);
        break;
      }
    }
  }

  mouseDownBoard(board: BoardElement, event) {
    if (!board) {
      return;
    }
    if (this.editingBoards.has(board.info.id)) {
      event.stopPropagation();
    }
  }

  mouseDownAPI(board: BoardElement, item: APIElement, event) {
    /*
    if (!item) {
      return;
    }
    if (this.editingAPIs.has(item.id)) {
      event.stopPropagation();
    }
    */
  }

  hoverBoard(boardId: String, isHover: boolean) {
    //this.hovered = isHover;

    if (isHover) {
      this.hoveredBoards.set(boardId, true);
    } else {
      this.hoveredBoards.delete(boardId);
    }
  }

  emptyClick() {
    console.log("empty");
    this.editingAPIs.clear();
    this.disabledBoards.clear();
    this.disabledAPIs.clear();
  }

  addBoard() {
    this.addingBoard = true;
  }

  saveNewBoard() {
    var u = this.router.url;
    var parsed = this.router.parseUrl(u);
    parsed.queryParams = {};
    var path = parsed.toString();

    path = decodeURIComponent(path);
    var segments = path.split("/");
    var subpath = "";
    if (segments.length > 1) {
      subpath = segments[1];
    }
    var projectId = "";
    if (segments.length >= 3) {
      projectId = segments[2];
    }

    let name = this.newBoard;
    //let listId = this.projects.i
    var params = { project_id: projectId, name: name };
    let boards = this.boards;
    let last = boards[boards.length - 1];
    if (last) {
      let afterId = last.info.id;
      params["after_id"] = afterId;
    }

    this.sharedService.addGroupToProject(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        let id = detail.id;
        let name = detail.name;
        let status = detail.status;
        let board: BoardElement = {
          disabled: false,
          editing: false,
          info: { id: id, name: name },
          apis: [],
        };
        boards.push(board);
        this.addingBoard = false;
        this.newBoard = "";
        this.cdr.markForCheck();
      }
    });
  }

  cancelBoard() {
    this.addingBoard = false;
  }

  editBoard(board: BoardElement) {
    //

    if (!board) {
      this.updateAPIContextMenu(false);
      this.updateBoardContextMenu(false);
      return;
    }

    let bid = board.info.id;
    this.editingBoards.set(bid, true);
    let id = "boards-" + board.info.id;
    //this.editingBoards.set(id, true);
    let el = this.document.getElementById(id);
    if (el) {
      el.focus();
    }
    this.updateAPIContextMenu(false);
    this.updateBoardContextMenu(false);
  }

  editTask(board: BoardElement, item: APIElement) {
    this.menuRow = "";
    this.updateAPIContextMenu(false);

    this.detail(null, board, item);

    /*
    this.disabledBoards.set(board.info.id, true);
    this.disabledAPIs.set(item.id, true);

    let id = item.id;
    this.editingAPIs.set(item.id, true);

    let el = this.document.getElementById(id);
    if (el) {
      let els = el.getElementsByTagName("textarea");
      if (!els) {
        return;
      }
    }
    */
  }

  changeColor(board: BoardElement, item: APIElement, color: string) {
    let params = { id: item.id, color: color };
    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data) {
        if (data.code == 0) {
          item.color = color;

          this.cdr.markForCheck();

          if (item.id == this.composeId) {
            var info = {
              changes: { action: "changecolor", id: item.id, color: color },
            };
            var body = JSON.stringify(info);
            this.sidebarService.newCompose(body);
          }
          //this.editingAPIs.delete(item.id);
          return;
        }
      }
    });

    //
  }

  saveTaskColor(board: BoardElement, item: APIElement) {
    if (item.id == "") {
      return;
    }
    if (item.color == "") {
      return;
    }

    let params = { id: item.id, color: item.color };
    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      //item.status = state;
      //this.editingAPIs.set(item.id, true);
      if (data) {
        if (data.code == 1) {
          return;
        } else {
          //this.editingAPIs.delete(item.id);
        }
      }
      this.cdr.markForCheck();
    });
  }

  saveTask(board: BoardElement, item: APIElement) {
    if (item.id == "") {
      return;
    }
    if (item.name == "") {
      return;
    }

    board.disabled = false;
    item.disabled = false;
    let params = { id: item.id, name: item.name };
    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      //item.status = state;
      //this.editingAPIs.set(item.id, true);
      if (data) {
        if (data.code == 1) {
          return;
        } else {
          //this.editingAPIs.delete(item.id);
        }
      }
      this.cdr.markForCheck();
    });
  }

  boardMenuOpened(board: BoardElement) {
    console.log(board);
    switch (this.viewType) {
      case "list":
        this.updateTopBottomStates(board);
        break;
    }
  }

  boardMenuClosed(board: BoardElement) {}

  cardMenuOpened(event: any, board: BoardElement, item: APIElement) {
    //event.stopPropagation();
    this.cardMenuOpening = true;
    this.hoveredAPIId = item.id;
    this.hoveredBoards.set(board.info.id, true);
  }

  cardMenuClosed() {
    this.cardMenuOpening = false;
  }

  cardColorMenuOpened() {}

  cardColorMenuClosed() {}

  updateAPIStatus(board: BoardElement, item: APIElement, state: number) {
    let params = { id: item.id, status: state };
    var previous = item.status;
    item.status = state;
    this.sharedService.updateAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data) {
        if (data.code != 0) {
          //reset if failed
          item.status = previous;
        } else {
          if (item.id == this.composeId) {
            var info = {
              changes: { action: "changestatus", id: item.id, status: state },
            };
            var body = JSON.stringify(info);
            this.sidebarService.newCompose(body);
          }
        }
      } else {
        item.status = previous;
      }
    });
  }


  ping() {
     window.postMessage(
      {
        type: "__RESTDOC_EXTENSION_PING__",
      },
      "*",
    );
  }


  changeEndpoint(event) {
    if (event) {
      this.currentEndpoint = event;
    }
  }

  Download() {
      window.open("https://restdoc.com/extension", "_target");
  }


  Send(request: APIElement) {

    if (!this.hasExtensionInstalled) {
      return
    }


    if (!this.currentEndpoint || this.currentEndpoint.value == "") {
      let message = this.noEndpointFailure;
      this.toastr.success(message)
      return
    }

    //url = this.projectEndpoints. request.
    let url = this.currentEndpoint.value + request.path;
    console.log(url);

    let params = request.params;
    var ps = {};
    for (let param of params) {
      let k = param.key;
      let v = param.value;
      ps[k] = v;
    }

    var form = [];
 

    var config = { method: request.method, url: url, params: ps, formData: form, headers: headers };

    console.log(request);
    if (request.method == "POST") {
     
      console.log(request.post_type);

      switch (request.post_type) {
        case PostType.FormData:
          for (let param of request.form_data) {
            let k = param.key;
            let v = param.value;
            form.push({ key: k, value: v });
          }
          config.formData = form;
          request.headers.push({ id: "", desc: "", enabled: true, key: "Content-Type", value: "multipart/form-data"});
          break;
        case PostType.FormUrlencoded:
          for (let param of request.form_data) {
            let k = param.key;
            let v = param.value;
            form.push({ key: k, value: v });
          }
          request.headers.push({ id: "", desc: "", enabled: true, key: "Content-Type", value: "application/x-www-form-urlencoded"});
          config.formData = form;
        default:
      }

    }


    var headers = [];
    for (let header of request.headers) {
      let k = header.key;
      let v = header.value;
      //headers[k] = v;
      headers.push({ key: v, value: v });
    }

    window.postMessage(
      {
        type: "__RESTDOC_EXTENSION_REQUEST__",
        config: config,
        text: "Hello from the webpage!",
      },
      "*"
    );
  }

  taskDetail(board: BoardElement, card: APIElement) {}

  openInNewTab() {}

  onBoardContextMenu(event: MouseEvent, board: BoardElement) {
    this.updateAPIContextMenu(false);
    if (event.button == 2) {
      event.preventDefault();
    }

    this.contextBoard = board;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.updateBoardContextMenu(true);
  }

  onContextMenu(event: MouseEvent, board: BoardElement, card: APIElement) {
    if (event.button == 2) {
      event.preventDefault();
    }

    console.log("context menu");
    this.contextBoard = board;
    this.contextAPI = card;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    //this.hoverAPIId = card.id;
    this.updateAPIContextMenu(true);
  }

  expandAPI() {}

  copyLink(board: BoardElement, item: APIElement) {
    let url = "/" + item.id;
    //this.clipboard.writeText(url);
  }

  duplicateTask(board: BoardElement, item: APIElement) {
    let text = item.name;
    let color = item.color;
    let path = item.path;
    let principal_id = item.principal_id;
    let listId = board.info.id;
    var params = {
      group_id: listId,
      name: text,
      color: color,
      path: path,
      principal_id: principal_id,
    };
    let apis = board.apis;
    let after = item;
    let afterId = after.id;
    params["after_id"] = afterId;

    let beforeId = "";
    for (var i = 0; i < apis.length; i++) {
      let api = apis[i];
      if (api.id == item.id) {
        let index = i + 1;
        if (index < apis.length) {
          beforeId = apis[index].id;
          params["before_id"] = beforeId;
        }
      }
    }

    this.sharedService.addAPIToGroup(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0 && data.data && data.data.detail) {
        let detail = data.data.detail;

        let api = this.utilsService.formatRequest(detail);

        var inserted = false;
        for (var i = 0; i < board.apis.length; i++) {
          let temp = board.apis[i];
          if (temp.id == afterId) {
            if (i == this.boards.length - 1) {
              // insert at last
              board.apis.push(api);
              inserted = true;
              break;
            }
            board.apis.splice(i + 1, 0, api);
            inserted = true;
            break;
          }
        }

        if (!inserted) {
          board.apis.push(api);
        }
        this.bottomAddingAPI = "";
        this.newBottomAPI = "";
        this.cdr.markForCheck();
      }
    });
  }

  deleteTask(board: BoardElement, item: APIElement) {
    let params = { id: item.id };
    this.sharedService.deleteAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      console.log("data");
      console.log(data);
      if (data) {
        if (data.code == 0) {
          //
          for (var i = 0; i < board.apis.length; i++) {
            let temp = board.apis[i];
            if (temp.id == item.id) {
              board.apis.splice(i, 1);
              this.cdr.markForCheck();
              break;
            }
          }
        } else {
          //todo notice
        }
      }
      //
    });
  }

  getConnectedList(): any[] {
    return this.boards.map((x) => `${x.info.id}`);
  }

  dropGroup(event: CdkDragDrop<BoardElement>) {
    if (event.previousIndex == event.currentIndex) {
      return;
    }
    moveItemInArray(this.boards, event.previousIndex, event.currentIndex);

    var currentId = "";
    var params = {};
    var afterId = "";
    var beforeId = "";

    var boardlist = this.boards;
    var currentIndex = event.currentIndex;

    var prev = currentIndex - 1;
    var next = currentIndex + 1;

    if (prev >= 0 && prev < boardlist.length) {
      afterId = boardlist[prev].info.id;
      params["after_id"] = afterId;
    }
    if (next >= 0 && next < boardlist.length) {
      beforeId = boardlist[next].info.id;
      params["before_id"] = beforeId;
    }

    var listId = boardlist[currentIndex].info.id;
    params["group_id"] = listId;

    this.sharedService.moveGroup(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);
    });
  }

  drop(event: CdkDragDrop<{ id: string; name: string }[]>) {
    var currentId = "";
    var params = {};
    var afterId = "";
    var beforeId = "";
    let newGroupId = event.container.id;
    if (event.previousContainer === event.container) {
      if (event.previousIndex == event.currentIndex) {
        return;
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      //
    }

    var apis = event.container.data;
    var currentIndex = event.currentIndex;

    var prev = currentIndex - 1;
    var next = currentIndex + 1;

    if (prev >= 0 && prev < apis.length) {
      afterId = apis[prev].id;
      params["after_id"] = afterId;
    }
    if (next >= 0 && next < apis.length) {
      beforeId = apis[next].id;
      params["before_id"] = beforeId;
    }

    var cardId = apis[currentIndex].id;
    params["card_id"] = cardId;

    if (apis.length == 1) {
      params["new_group_id"] = newGroupId;
    }

    this.sharedService.moveAPI(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (data && data.code == 0) {
        // notice compose
        if (cardId == this.composeId) {
          var info = {
            changes: { action: "changelist", id: cardId, group_id: newGroupId },
          };
          var body = JSON.stringify(info);
          this.sidebarService.newCompose(body);
        }
      }
    });
    this.cdr.markForCheck();
  }

  getProjectInfo(data: any) {
    try {
      this.currentLabel = data["name"];
      this.currentProjectId = data["id"];
      if (this.currentProjectId == "0") {
        this.listMode = false;
      } else {
        this.listMode = true;
      }

    } catch {

    }

  }

  getCurrentState(data: string) {
      var projectId = "0";
      const tree = this.router.parseUrl(data);
      let children = tree.root.children["primary"];
      if (children) {
        let segments = children.segments;
        for (var i = 0; i < segments.length; i++) {
          if (i == 1) {
            projectId = segments[i].path;
            this.listMode = true;
            if (this.currentProjectId != projectId) {
              this.currentProjectId = projectId;
              this.selectedRequestIndex = 0;
              this.requests = [];
            }
            break;
          }
        }
        if (projectId == "0") {
          this.listMode = false;
        }
      }

      let view = tree.queryParams["view"];
      switch (view) {
        case "overview":
          this.viewType = view;
          break;
        case "list":
          this.viewType = view;
          break;
      }
  }

  initUserInfo() {}

  enterProject(project: ProjectElement) {
    let id = project.id;
    var lb = "/project/" + id;
    this.listMode = false;
    this.router.navigate([lb]);
    let data = JSON.stringify({
      name: project.name,
      id: project.id,
      color: project.color,
      icon: project.icon,
      icon_color: project.icon_color,
      name_color: project.name_color,
    });
    this.headerService.searchData(data);
  }

  trackByIndex(row) {
    return row.id;
  }

  getData() {
    if (this.listMode) {
      this.apisSubscription = this.sharedService
        .getAPIs(new Map([["project_id", this.currentProjectId]]))
        .subscribe((data: any) => {
          this.sharedService.checkResponse(location, data);
          console.log(data);
          if (!data || data.code != 0) {
            return
          }
          this.boards = data.data.groups;
          if (data.data && data.data.endpoints) {
            let projectEndpoints = data.data.endpoints;
            //localStorage.setItem( environment.projectsKey, JSON.stringify(projectEndpoints)
            this.projectEndpoints = projectEndpoints;
            this.getCurrentEndpoint();
            //this.headerService.setEndpoints(JSON.stringify(projectEndpoints));
          }

          this.cdr.markForCheck();
        });
    } else {
      this.projectsSubscription = this.sharedService
        .getProjects()
        .subscribe((data: any) => {
          this.projects = data.data.list;
          this.cdr.markForCheck();
        });
    }
  }

  getCurrentEndpoint() {
    //if get from localstorage 
    if (this.projectEndpoints && this.projectEndpoints.length > 0) {
      this.currentEndpoint = this.projectEndpoints[0];
    }
  }


  changes() {
    this.cdr.markForCheck();
  }

  createLabel() {
    const dialogRef = this.dialog.open(DetailsComponent, {
      width: "500px",
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  manageLabel() {
    this.router.navigate(["/settings/label"]);
  }

  isNumeric(str): boolean {
    if (typeof str != "string") {
      return false; // we only process strings!
    }
    return !isNaN(str as any);
  }

  trackLabel(index: number, el: any): number {
    return el.id;
  }

  backToMailBox() {
    this.detailId = "";
    this.listMode = false;
    this.router.navigate(["../"], { relativeTo: this.route });
  }

  updateAPIContextMenu(show: boolean) {
    let id = "contextmenu-list";
    let item = this.document.getElementById(id);
    if (show) {
      if (item) {
        this.renderer.removeClass(item, "contextmenu-hide");
        this.renderer.addClass(item, "contextmenu-show");
        this.renderer.setStyle(item, "left", this.menuX + "px");
        this.renderer.setStyle(item, "top", this.menuY - 65 + "px");
        //this.contextMenuTrigger.openMenu();
      }
    } else {
      if (item) {
        this.renderer.addClass(item, "contextmenu-hide");
        this.renderer.removeClass(item, "contextmenu-show");
        this.menuRow = "";
        //this.contextMenuTrigger.closeMenu();
      }
    }
  }

  updateLeftRightStates(board: BoardElement) {
    if (!board) {
      return;
    }
    this.leftHasFolded = false;
    this.leftHasExpanded = false;
    this.rightHasFolded = false;
    this.rightHasExpanded = false;

    var left = true;
    for (var i = 0; i < this.boards.length; i++) {
      let b = this.boards[i];

      if (b.info.id == board.info.id) {
        left = false;
        continue;
      }

      if (left) {
        if (this.boardFoldedList.has(b.info.id)) {
          this.leftHasFolded = true;
        } else {
          this.leftHasExpanded = true;
        }
      } else {
        if (this.boardFoldedList.has(b.info.id)) {
          this.rightHasFolded = true;
        } else {
          this.rightHasExpanded = true;
        }
      }
    }
  }

  updateTopBottomStates(board: BoardElement) {
    if (!board) {
      return;
    }
    this.topHasFolded = false;
    this.topHasExpanded = false;
    this.bottomHasFolded = false;
    this.bottomHasExpanded = false;

    var top = true;
    for (var i = 0; i < this.boards.length; i++) {
      let b = this.boards[i];

      if (b.info.id == board.info.id) {
        top = false;
        continue;
      }

      if (top) {
        if (this.tableFoldedList.has(b.info.id)) {
          this.topHasFolded = true;
        } else {
          this.topHasExpanded = true;
        }
      } else {
        if (this.tableFoldedList.has(b.info.id)) {
          this.bottomHasFolded = true;
        } else {
          this.bottomHasExpanded = true;
        }
      }
    }
  }

  updateBoardContextMenu(show: boolean) {
    var id = "boardcontextmenu";

    switch (this.viewType) {
      case "overview":
        break;
      case "list":
        id = "boardcontextmenu-list";
        this.updateTopBottomStates(this.contextBoard);
        break;
      default:
    }

    let item = this.document.getElementById(id);
    if (show) {
      if (item) {
        this.renderer.removeClass(item, "contextmenu-hide");
        this.renderer.addClass(item, "contextmenu-show");
        this.renderer.setStyle(item, "left", this.menuX + "px");
        this.renderer.setStyle(item, "top", this.menuY - 65 + "px");
      }
    } else {
      if (item) {
        this.renderer.addClass(item, "contextmenu-hide");
        this.renderer.removeClass(item, "contextmenu-show");
      }
    }
  }

  getPrevBoard(boardId: string): BoardElement | null {
    var prevBoard: BoardElement = null;
    for (var i = this.boards.length - 1; i >= 0; i--) {
      var board = this.boards[i];
      if (board.info.id == boardId) {
        while (i > 0) {
          prevBoard = this.boards[i - 1];
          if (prevBoard.apis.length > 0) {
            return prevBoard;
          }
          i -= 1;
        }
      }
    }
    return prevBoard;
  }

  getPrevAPIId(boardId: string, cardId: string) {
    console.log(boardId);
    console.log(cardId);
    var prevId = "";
    for (var i = 0; i < this.boards.length - 1; i++) {
      var board = this.boards[i];

      if (board.info.id == boardId) {
        var prevBoard: BoardElement = this.getPrevBoard(boardId);
        console.log(prevBoard);
        console.log("prevBoard");

        let length = board.apis.length;
        var isFirst = false;
        for (var j = 0; j < length; j++) {
          let card = board.apis[j];
          if (card.id == cardId) {
            if (j == 0) {
              isFirst = true;
            }
            if (isFirst) {
              if (prevBoard) {
                let apis = prevBoard.apis;
                if (apis.length > 0) {
                  prevId = apis[apis.length - 1].id;
                  return prevId;
                } else {
                  return prevId;
                }
              } else {
                return prevId;
              }
            } else {
              prevId = board.apis[j - 1].id;
              return prevId;
            }
          }
        }
        break;
      }
    }
    return prevId;
  }

  getNextBoard(boardId: string): BoardElement | null {
    var nextBoard: BoardElement = null;
    for (var i = 0; i < this.boards.length; i++) {
      var board = this.boards[i];
      if (board.info.id == boardId) {
        while (i < this.boards.length - 1) {
          nextBoard = this.boards[i + 1];
          if (nextBoard.apis.length > 0) {
            return nextBoard;
          }
          i += 1;
        }
      }
    }
    return nextBoard;
  }

  getNextAPIId(boardId: string, cardId: string) {
    console.log(boardId);
    console.log(cardId);
    var nextId = "";
    for (var i = 0; i < this.boards.length; i++) {
      var board = this.boards[i];

      if (board.info.id == boardId) {
        var nextBoard: BoardElement = this.getNextBoard(boardId);

        let length = board.apis.length;
        var isLast = false;
        for (var j = 0; j < length; j++) {
          let card = board.apis[j];
          if (card.id == cardId) {
            if (j == length - 1) {
              isLast = true;
            }
            if (isLast) {
              if (nextBoard) {
                let apis = nextBoard.apis;
                if (apis.length > 0) {
                  nextId = apis[0].id;
                  return nextId;
                } else {
                  return nextId;
                }
              } else {
                return nextId;
              }
            } else {
              nextId = board.apis[j + 1].id;
              return nextId;
            }
          }
        }
        break;
      }
    }
    return nextId;
  }
  handleChanges(data) {
    console.log('handle change data');
    console.log(data);
    let action = data["action"];
    let state = data["state"];
    let name = data["name"];
    let color = data["color"];
    let due = data["due"];
    let id = data["id"];
    let boardId = data["boardId"];
    if (!action) {
      return;
    }
    switch (action) {
      case "changecolor":
        for (var i = 0; i < this.boards.length; i++) {
          var board = this.boards[i];
          if (board.info.id == boardId) {
            for (var j = 0; j < board.apis.length; j++) {
              let card = board.apis[j];
              if (card.id == id) {
                if (color) {
                  card.color = color;
                  this.cdr.markForCheck();
                }
                break;
              }
            }
            break;
          }
        }
        break;

      case "changestatus":
        for (var i = 0; i < this.boards.length; i++) {
          var board = this.boards[i];
          if (board.info.id == boardId) {
            for (var j = 0; j < board.apis.length; j++) {
              let card = board.apis[j];
              if (card.id == id) {
                card.status = state;
                this.cdr.markForCheck();
                break;
              }
            }
            break;
          }
        }
        break;
      case "changename":
        for (var i = 0; i < this.boards.length; i++) {
          var board = this.boards[i];
          if (board.info.id == boardId) {
            for (var j = 0; j < board.apis.length; j++) {
              let card = board.apis[j];
              if (card.id == id) {
                card.name = name;
                this.cdr.markForCheck();
                break;
              }
            }
            break;
          }
        }
        break;
      case "changetonext":
        let nextId = this.getNextAPIId(boardId, id);
        console.log(nextId);
        if (nextId != "") {
          this.composeId = nextId;
          this.cdr.markForCheck();

          var info = new Map();
          //todo i18n
          info["id"] = nextId;
          info["action"] = "forward";
          var body = JSON.stringify(info);
          this.sidebarService.newCompose(body);
        }

        break;
      case "changetoprev":
        let prevId = this.getPrevAPIId(boardId, id);
        if (prevId != "") {
          this.composeId = prevId;
          this.cdr.markForCheck();

          var info = new Map();
          //todo i18n
          info["id"] = prevId;
          info["action"] = "forward";
          var body = JSON.stringify(info);
          this.sidebarService.newCompose(body);
        }

        break;
    }
  }

  changeDate(event: any, item: APIElement) {
    //event.stopPropagation();

    console.log(event);
    console.log(item);
    this.dateAPI = item;
    console.log(this.viewType);
    if (this.viewType == "list") {
      //this.cardDateTableMenuTrigger.style.left = event.clientX + 5 + "px";
      //this.cardDateTableMenuTrigger.style.top = event.clientY + 5 + "px";
      //this.cardDateTableMenuTrigger.updatePosition();
      this.cardDateTableMenuTrigger.openMenu();
    } else {
      this.cardDateMenuTrigger.openMenu();
    }
  }

  clicke() {
    console.log("click");
    this.menuopen = true;
  }

  disableMenuClose(event: any) {
    event.stopPropagation();
  }

  selectedDateChanged(event) {}

  stop(event) {
    event.stopPropagation();
  }


  toggleDefaultFormDataStatus() {
    this.defaultFormDataStatus = !this.defaultFormDataStatus;
  }



  toggleParam(param: ParamElement) {
    param.enabled = !param.enabled;
  }

  toggleDefaultParamStatus() {
    this.defaultParamStatus = !this.defaultParamStatus;
  }


  toggleHeader(header: HeaderElement) {
    header.enabled = !header.enabled;
  }

  toggleDefaultHeaderStatus() {
    this.defaultHeaderStatus = !this.defaultHeaderStatus;
  }



  hoverTab(request: APIElement, hovered: boolean) {

    if (!request) {
      return
    }

    if (hovered) {
        this.hoveredRequestId = request.id;
    } else {
        this.hoveredRequestId = "";
    }

  }

  addContentType(request: APIElement, contentType: string) {
    var hasContentType = false
    var indexes = [];

    var i = 0;
    for (var header of request.headers) {
      if (header.key.toLowerCase() == "content-type") {
        hasContentType = true;
        indexes.push(i);
      }
      i += 1;
    }

    console.log(indexes);
    if (hasContentType) {
      console.log(hasContentType)
      let first = indexes.shift();
      request.headers[first].value = contentType;
      for (var i = indexes.length - 1; i >= 0; i--) {
        let index = indexes[i];
        request.headers.splice(index);
      }
      
    } else {
        let h = { id: "", key: "Content-Type", value: contentType, desc: "", enabled: true };
        request.headers.push(h);
    }
    this.cdr.markForCheck();

  }

  showAPIGroups() {
    this.showGroups = true;
  }

  hideAPIGroups() {
    this.showGroups = false;
  }

  onPostTypeChanged(event, request: APIElement) {
    //console.log(event);
    let label = event.tab.textLabel;
    request.post_type = label;
    console.log(label);
    var h: HeaderElement
    switch (label) {
      case "x-www-form-urlencoded":
        this.addContentType(request, label);
      case "form-data":
        this.addContentType(request, label);
    case "none":
    case "raw":
    case "binary":
    case "none":
    }
  }

}
