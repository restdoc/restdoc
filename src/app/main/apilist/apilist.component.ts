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
import { EndpointElement, APIElement, ParamElement, AuthElement } from "../main.component";
import { HeaderElement, ResponseElement, PostType, SanitizeHtmlPipe } from "../main.component";
import { UtilsService  } from "../main.service";
import { RestClientService } from "../rest-client.service";
import { consoleTestResultsHandler } from "tslint/lib/test";
import { TemplateService } from "../template.service";
import { HistoryService } from "../history.service";
import { ScriptRunnerService } from "../script-runner.service";
import { CodegenService } from "../codegen.service";
import { EnvService } from "../env.service";

function stripQuotes(x: string): string {
  const t = (x ?? "").trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

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
  defaultRequestVariableStatus = false;
  defaultHeaderKey = "";
  defaultHeaderValue = "";
  defaultHeaderDesc = "";
  defaultHeaderStatus = false;
  editorOptions = { theme: "vs-dark", language: "javascript" };
  code: string = 'function x() {\nconsole.log("Hello world!");\n}';
  originalCode: string = "function x() { // TODO }";
  projectEndpoints: EndpointElement[] = [];
  showGroups = true
  authTypes = ["none", "basic", "bearer"];
  authTypeLabels = {
    "none": "No Auth",
    "basic": "Basic Auth",
    "bearer": "Bearer Token"
  };
  methods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];

  /** Hoppscotch-style primary pane height (% of column), 22–78. */
  primaryPanePercent = 45;
  private paneResizeActive = false;
  private paneResizeStartY = 0;
  private paneResizeStartPct = 45;
  private readonly panePctStorageKey = "restdoc.hopp.primaryPct";
  /** Shown in URL field; literal {{var}} is intentional. */
  readonly urlEnvPlaceholder =
    "Path — use {{var}} (Variables tab overrides project env for same key)";
  readonly variablesTabSubtitle =
    "Request variables: same keys override project env when resolving {{var}} in this tab.";
  private readonly extensionIgnoreResponse = new Set<string>();
  private fetchAbortByRequestId = new Map<string, AbortController>();
  private requestBaselineJson = new Map<string, string>();

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

        if (request && this.extensionIgnoreResponse.has(request.id)) {
          this.extensionIgnoreResponse.delete(request.id);
          request.sending = false;
          this.cdr.markForCheck();
          return;
        }

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
        
        // Add status code and response time
        if (event.data.response.status) {
          resp.statusCode = event.data.response.status;
        }
        if (event.data.response.statusText) {
          resp.statusText = event.data.response.statusText;
        }
        if (event.data.response.responseTime) {
          resp.responseTime = event.data.response.responseTime;
        }
        if (event.data.response.size) {
          resp.size = event.data.response.size;
        }
        
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
        if (request) {
          request.sending = false;
        }
        this.cdr.markForCheck();
      }

      if (event.data.type == "__RESTDOC_EXTENSION_ERROR__") {

        console.log(event.data);

        let index = this.selectedRequestIndex;
        let request = this.requests[index];
        console.log("current request");
        console.log(request);

        if (request && this.extensionIgnoreResponse.has(request.id)) {
          this.extensionIgnoreResponse.delete(request.id);
          request.sending = false;
          this.cdr.markForCheck();
          return;
        }

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
        if (request) {
          request.sending = false;
        }

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
    private restClient: RestClientService,
    private templateService: TemplateService,
    private historyService: HistoryService,
    private scriptRunner: ScriptRunnerService,
    private codegen: CodegenService,
    private datepipe: DatePipe,
    private toastr: ToastrService,
    private envService: EnvService
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

    this.loadTabsFromStorage();

    try {
      const v = sessionStorage.getItem(this.panePctStorageKey);
      if (v) {
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n >= 22 && n <= 78) {
          this.primaryPanePercent = n;
        }
      }
    } catch {
      /* ignore */
    }

    // Restore request from share link (?share=base64json)
    try {
      const urlTree = this.router.parseUrl(this.router.url);
      const share = urlTree.queryParams["share"];
      if (share) {
        const json = decodeURIComponent(escape(atob(String(share))));
        const snapshot = JSON.parse(json);
        if (snapshot) {
          // open as new tab
          this.requests = [...this.requests, snapshot];
          this.selectedRequestIndex = this.requests.length - 1;
          this.composeId = snapshot.id || "";
          this.cdr.markForCheck();
        }
      }
    } catch {}


    this.searchForm = this.fb.group({
      search: [""],
    });

    this.initUserInfo();

    // Replay from History if present
    try {
      const raw = sessionStorage.getItem("restdoc.history.replay");
      if (raw) {
        sessionStorage.removeItem("restdoc.history.replay");
        const entry = JSON.parse(raw);
        const snapshot = entry?.requestSnapshot;
        if (snapshot && snapshot.id) {
          // open request by id; details() will fetch latest params from backend,
          // but we also want to restore client-only fields
          const req = snapshot as any;
          this.detail(null, null as any, req);
        }
      }
    } catch {}

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

  private tabsStorageKey(): string {
    return `restdoc.tabs.v1.${this.currentProjectId || "0"}`;
  }

  private saveTabsToStorage() {
    try {
      const snapshot = {
        selectedRequestIndex: this.selectedRequestIndex,
        requests: (this.requests ?? []).map((r) => {
          const copy: any = { ...r };
          delete copy.response;
          delete copy.binaryFile;
          return copy;
        }),
      };
      localStorage.setItem(this.tabsStorageKey(), JSON.stringify(snapshot));
    } catch {}
  }

  private loadTabsFromStorage() {
    try {
      const raw = localStorage.getItem(this.tabsStorageKey());
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.requests)) {
        this.requests = parsed.requests;
        this.selectedRequestIndex = Math.max(
          0,
          Math.min(Number(parsed.selectedRequestIndex || 0), this.requests.length - 1)
        );
        const sel = this.requests[this.selectedRequestIndex];
        if (sel?.id) this.composeId = sel.id;
        for (const r of this.requests) {
          this.initAuth(r);
          this.initRequestSettings(r);
          this.refreshRequestBaseline(r);
        }
        this.cdr.markForCheck();
      }
    } catch {}
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

  /** Focus the field on the row that just received the first typed character (Hoppscotch KV UI). */
  private focusHoppLastDataRowInput(
    originInput: HTMLInputElement | null,
    field: "key" | "value" | "desc"
  ) {
    setTimeout(() => {
      const rowsRoot = originInput?.closest(".hopp-kv-rows");
      if (!rowsRoot) {
        return;
      }
      const dataRows = rowsRoot.querySelectorAll(".hopp-kv-row:not(.hopp-kv-row-new)");
      if (!dataRows.length) {
        return;
      }
      const lastRow = dataRows[dataRows.length - 1];
      const inputs = lastRow.querySelectorAll("input.hopp-kv-input");
      const index = field === "key" ? 0 : field === "value" ? 1 : 2;
      const input = inputs[index] as HTMLInputElement | undefined;
      if (!input) {
        return;
      }
      input.focus();
      const len = input.value?.length ?? 0;
      input.setSelectionRange(len, len);
    }, 0);
  }

  /** Focus the matching field on the last data row in legacy `.param-item` / `.header-item` lists. */
  private focusLegacyKvLastRow(
    originInput: HTMLInputElement | null,
    field: "key" | "value" | "desc",
    containerSelector: string,
    rowClass: string
  ) {
    setTimeout(() => {
      const container = originInput?.closest(containerSelector);
      if (!container) {
        return;
      }
      const rows = container.querySelectorAll("." + rowClass);
      if (!rows.length) {
        return;
      }
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const input = lastRow.querySelector(
        ".field-" + field + "-input"
      ) as HTMLInputElement | null;
      if (!input) {
        return;
      }
      input.focus();
      const len = input.value?.length ?? 0;
      input.setSelectionRange(len, len);
    }, 0);
  }


  inputParam(event, request, type, page) {
    if (!event) {
      return
    }
    const addRowInput = event.target as HTMLInputElement | null;
    console.log('input');
    const data = event.data;

    event.target.value = ""

      //this.defaultParamKey = "";
      let param = { key: "", value: "", desc: "", disabled: false };

      switch (type) {
        case "key":
          param[type] = data;
          break;
        case "value":
          param[type] = data;
          this.defaultParamValue = "";
          break;
        case "desc":
          param[type] = data;
          this.defaultParamDesc = "";
          break;
        default:
          return;
      }
      param["enabled"] = true;

      //
      if (page == "document") {

        if (type == "key") {
          request.params.push(param);
          this.cdr.markForCheck();
          this.focusHoppLastDataRowInput(addRowInput, type);
        }
      } else if (page == "reqvars") {
        this.ensureRequestVariables(request);
        if (type == "key") {
          const row: ParamElement = {
            id: "",
            key: param.key,
            value: param.value,
            desc: "",
            enabled: true,
            required: false,
          };
          request.requestVariables.push(row);
          this.cdr.markForCheck();
          this.focusHoppLastDataRowInput(addRowInput, type);
        }
      } else {
        request.params.push(param);
        this.cdr.markForCheck();
        this.focusLegacyKvLastRow(
          addRowInput,
          type,
          ".params",
          "normal-param-item"
        );
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
    const addRowInput = event.target as HTMLInputElement | null;
    const data = event.data;

    event.target.value = ""

    let header = { key: "", value: "", desc: "", enabled: false };

    switch (type) {
      case "key":
        header[type] = data;
        this.defaultHeaderKey = "";
        break;
      case "value":
        header[type] = data;
        this.defaultHeaderValue = "";
        break;
      case "desc":
        header[type] = data;
        this.defaultHeaderDesc = "";
        break;
      default:
        return;
    }
    header.enabled = true;
    request.headers.push(header);
    this.cdr.markForCheck();
    if (addRowInput?.closest(".hopp-kv-rows")) {
      this.focusHoppLastDataRowInput(addRowInput, type);
    } else {
      this.focusLegacyKvLastRow(
        addRowInput,
        type,
        ".headers",
        "normal-header-item"
      );
    }
  }

  inputFormData(event, request, type, page) {

    if (!event) {
      return
    }
    const addRowInput = event.target as HTMLInputElement | null;
    const data = event.data;

    event.target.value = ""

    var param = { id: "", key: "", value: "", desc: "", disabled: false };

    switch (type) {
      case "key":
        param[type] = data;
        this.defaultFormDataKey = "";
        break;
      case "value":
        param[type] = data;
        this.defaultFormDataValue = "";
        break;
      case "desc":
        param[type] = data;
        this.defaultFormDataDesc = "";
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
            this.focusHoppLastDataRowInput(addRowInput, type);
          }
        })
        */
        request.form_data.push(param);
        this.cdr.markForCheck();
        this.focusHoppLastDataRowInput(addRowInput, type);

      }

    } else {
      request.form_data.push(param);
      this.cdr.markForCheck();
      this.focusLegacyKvLastRow(
        addRowInput,
        type,
        ".form-data",
        "normal-param-item"
      );
    }
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
        
        // Initialize auth and settings if not present
        this.initAuth(request);
        this.initRequestSettings(request);
        this.refreshRequestBaseline(request);

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
    this.initAuth(request);
    this.initRequestSettings(request);
    this.refreshRequestBaseline(request);
    this.saveTabsToStorage();

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
        
        // Initialize auth and settings if not present
        this.initAuth(request);
        this.initRequestSettings(request);
        this.refreshRequestBaseline(request);

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
    this.initAuth(request);
    this.initRequestSettings(request);
    this.refreshRequestBaseline(request);

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
    if (this.selectedRequestIndex >= this.requests.length) {
      this.selectedRequestIndex = Math.max(0, this.requests.length - 1);
    }
    this.saveTabsToStorage();
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


  async Send(request: APIElement) {

    if (!this.currentEndpoint || this.currentEndpoint.value == "") {
      let message = this.noEndpointFailure;
      this.toastr.success(message)
      return
    }

    const projectId = this.currentProjectId || "0";

    // Run pre-request script (can patch headers/params)
    try {
      const pre = await this.scriptRunner.runPreRequest(projectId, request);
      request.scriptLogs = pre.logs ?? [];
      if (pre.requestPatch?.headers?.length) {
        request.headers = [...(request.headers ?? []), ...(pre.requestPatch.headers as any)];
      }
      if (pre.requestPatch?.params?.length) {
        request.params = [...(request.params ?? []), ...(pre.requestPatch.params as any)];
      }
      this.cdr.markForCheck();
    } catch (e: any) {
      request.testResults = [{ ok: false, name: "pre-request", message: e?.message || String(e) }];
      this.cdr.markForCheck();
    }

    // Apply template rendering before sending ({{var}}, {{$uuid}}, etc.)
    const missingKeys = new Set<string>();
    const render = (s: string) => {
      const r = this.templateService.renderString(s ?? "", projectId, request.requestVariables);
      r.missing.forEach((k) => missingKeys.add(k));
      return r.output;
    };

    const rendered = {
      path: render(request.path),
      params: (request.params ?? []).map((p) => ({
        ...p,
        key: render(p.key),
        value: render(p.value),
      })),
      headers: (request.headers ?? []).map((h) => ({
        ...h,
        key: render(h.key),
        value: render(h.value),
      })),
      raw: render(request.raw ?? ""),
      auth: request.auth
        ? {
            ...request.auth,
            username: request.auth.username != null ? render(request.auth.username) : request.auth.username,
            password: request.auth.password != null ? render(request.auth.password) : request.auth.password,
            token: request.auth.token != null ? render(request.auth.token) : request.auth.token,
            prefix: request.auth.prefix != null ? render(request.auth.prefix) : request.auth.prefix,
          }
        : request.auth,
      form_data: (request.form_data ?? []).map((p) => ({
        ...p,
        key: render(p.key),
        value: render(p.value),
      })),
    };

    if (missingKeys.size > 0) {
      this.toastr.warning(`Missing env vars: ${Array.from(missingKeys).join(", ")}`);
    }

    // If the extension is available, keep existing flow.
    // Otherwise fall back to the built-in fetch sender.
    if (!this.hasExtensionInstalled) {
      this.abortInflightFetch(request);
      const reqForSend: APIElement = {
        ...request,
        path: rendered.path,
        params: rendered.params as any,
        headers: rendered.headers as any,
        raw: rendered.raw,
        auth: rendered.auth as any,
        form_data: rendered.form_data as any,
      };

      const ac = new AbortController();
      this.fetchAbortByRequestId.set(request.id, ac);
      request.sending = true;
      request.response = null;
      this.cdr.markForCheck();

      try {
        const resp = await this.restClient.send(reqForSend, this.currentEndpoint, {
          signal: ac.signal,
        });
        if (this.fetchAbortByRequestId.get(request.id) !== ac) {
          return;
        }
        request.response = resp;
        const fullUrl = (this.currentEndpoint?.value ?? "") + rendered.path;
        this.historyService.add(projectId, reqForSend, this.currentEndpoint, fullUrl, resp);
        try {
          const t = await this.scriptRunner.runTests(projectId, reqForSend, resp);
          request.scriptLogs = [...(request.scriptLogs ?? []), ...(t.logs ?? [])];
          request.testResults = t.tests ?? [];
        } catch (e: any) {
          request.testResults = [{ ok: false, name: "tests", message: e?.message || String(e) }];
        }
      } finally {
        if (this.fetchAbortByRequestId.get(request.id) === ac) {
          this.fetchAbortByRequestId.delete(request.id);
        }
        request.sending = false;
        this.cdr.markForCheck();
      }
      return;
    }

    // url = endpoint + path
    let url = this.currentEndpoint.value + rendered.path;
    console.log(url);

    let params = rendered.params as any;
    var ps = {};
    for (let param of params) {
      if (!param || param.enabled === false) {
        continue;
      }
      let k = param.key;
      let v = param.value;
      if (!k || ("" + k).trim() === "") {
        continue;
      }
      ps[k] = v;
    }

    var form = [];
    var headers = [];

    // Collect enabled headers first
    for (let header of (rendered.headers as any)) {
      if (header.enabled) {
        let k = header.key;
        let v = header.value;
        headers.push({ key: k, value: v });
      }
    }

    var config: any = { method: request.method, url: url, params: ps, formData: form, headers: headers };

    console.log(request);
    if (request.method == "POST" || request.method == "PUT" || request.method == "PATCH") {
     
      console.log(request.post_type);

      switch (request.post_type) {
        case PostType.FormData:
          for (let param of (rendered.form_data as any)) {
            if (param.enabled) {
              let k = param.key;
              let v = param.value;
              form.push({ key: k, value: v });
            }
          }
          config.formData = form;
          // Only add Content-Type if not already present
          let hasContentType = headers.some(h => h.key.toLowerCase() === "content-type");
          if (!hasContentType) {
            headers.push({ key: "Content-Type", value: "multipart/form-data"});
          }
          break;
        case PostType.FormUrlencoded:
          for (let param of (rendered.form_data as any)) {
            if (param.enabled) {
              let k = param.key;
              let v = param.value;
              form.push({ key: k, value: v });
            }
          }
          let hasContentType2 = headers.some(h => h.key.toLowerCase() === "content-type");
          if (!hasContentType2) {
            headers.push({ key: "Content-Type", value: "application/x-www-form-urlencoded"});
          }
          config.formData = form;
          break;
        case PostType.Raw:
          if (rendered.raw) {
            (config as any).body = rendered.raw;
          }
          break;
        case PostType.Binary:
          // Extension sender may not support binary; keep placeholder.
          if (request.binary) {
            (config as any).body = request.binary;
          }
          break;
        default:
      }

    }

    // Handle authentication
    const auth = rendered.auth as any;
    if (auth && auth.type !== "none") {
      if (auth.type === "basic" && auth.username && auth.password) {
        const credentials = btoa(`${auth.username}:${auth.password}`);
        headers.push({ key: "Authorization", value: `Basic ${credentials}` });
      } else if (auth.type === "bearer" && auth.token) {
        const prefix = auth.prefix || "Bearer";
        headers.push({ key: "Authorization", value: `${prefix} ${auth.token}` });
      }
    }

    config.headers = headers;

    // Add timeout and other settings
    if (request.timeout) {
      (config as any).timeout = request.timeout;
    }
    if (request.followRedirects !== undefined) {
      (config as any).followRedirects = request.followRedirects;
    }
    if (request.withCredentials !== undefined) {
      (config as any).withCredentials = request.withCredentials;
    }

    this.extensionIgnoreResponse.delete(request.id);
    request.sending = true;
    request.response = null;
    this.cdr.markForCheck();

    window.postMessage(
      {
        type: "__RESTDOC_EXTENSION_REQUEST__",
        config: config,
        text: "Hello from the webpage!",
      },
      "*"
    );
  }

  cancelSend(request: APIElement) {
    const ac = this.fetchAbortByRequestId.get(request.id);
    if (ac) {
      ac.abort();
      this.fetchAbortByRequestId.delete(request.id);
    }
    this.extensionIgnoreResponse.add(request.id);
    request.sending = false;
    this.cdr.markForCheck();
  }

  private abortInflightFetch(request: APIElement) {
    const prev = this.fetchAbortByRequestId.get(request.id);
    if (prev) {
      prev.abort();
    }
    this.fetchAbortByRequestId.delete(request.id);
  }

  onPaneResizeStart(event: MouseEvent) {
    event.preventDefault();
    this.paneResizeActive = true;
    this.paneResizeStartY = event.clientY;
    this.paneResizeStartPct = this.primaryPanePercent;
  }

  @HostListener("document:mousemove", ["$event"])
  onPaneResizeMove(event: MouseEvent) {
    if (!this.paneResizeActive) {
      return;
    }
    const layout = (event.target as Node)?.ownerDocument?.getElementById("restdoc-hopp-pane-root");
    const el =
      layout ??
      document.querySelector(".mat-tab-body-active .hopp-pane-layout") ??
      document.querySelector(".hopp-pane-layout");
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const dy = event.clientY - this.paneResizeStartY;
    const deltaPct = rect.height > 0 ? (dy / rect.height) * 100 : 0;
    this.primaryPanePercent = Math.round(
      Math.min(78, Math.max(22, this.paneResizeStartPct + deltaPct))
    );
    this.cdr.markForCheck();
  }

  @HostListener("document:mouseup")
  onPaneResizeEnd() {
    if (!this.paneResizeActive) {
      return;
    }
    this.paneResizeActive = false;
    try {
      sessionStorage.setItem(this.panePctStorageKey, String(this.primaryPanePercent));
    } catch {
      /* ignore */
    }
    this.cdr.markForCheck();
  }

  openRequestHistory() {
    const pid = this.currentProjectId || "0";
    this.sidebarService.onSelect("_history");
    this.router.navigate(["/history"], { queryParams: { project: pid } });
    this.cdr.markForCheck();
  }

  async importCurl(request: APIElement) {
    let text = "";
    try {
      text = (await navigator.clipboard.readText()) ?? "";
    } catch {
      /* ignore */
    }
    if (!text || !/\bcurl\b/i.test(text)) {
      text = window.prompt("Paste a cURL command") ?? "";
    }
    if (!text?.trim()) {
      return;
    }
    const ok = this.applyCurlToRequest(request, text);
    if (ok) {
      this.toastr.success("Imported cURL");
      this.refreshRequestBaseline(request);
      this.cdr.markForCheck();
    } else {
      this.toastr.warning("Could not parse cURL");
    }
  }

  clearRequestEditor(request: APIElement) {
    if (!window.confirm("Clear all request fields for this tab?")) {
      return;
    }
    request.method = "GET";
    request.path = "";
    request.params = [];
    request.headers = [];
    request.form_data = [];
    request.raw = "";
    request.post_type = PostType.None;
    request.rawContentType = "json";
    request.binaryFile = null;
    request.auth = { type: "none" };
    request.preRequestScript = "";
    request.testScript = "";
    request.requestVariables = [];
    request.testResults = [];
    request.scriptLogs = [];
    this.initRequestSettings(request);
    this.refreshRequestBaseline(request);
    this.cdr.markForCheck();
  }

  /** Minimal cURL parser: method, URL, -H headers, -d / --data / --data-raw body. */
  applyCurlToRequest(request: APIElement, raw: string): boolean {
    let s = raw.replace(/\\\r?\n/g, " ").replace(/\s+/g, " ").trim();
    if (!/^\s*curl\b/i.test(s)) {
      return false;
    }
    s = s.replace(/^\s*curl\b/i, "").trim();

    let method = "GET";
    const mX = s.match(/\s-(?:X|request)\s+(\w+)/i);
    if (mX) {
      method = mX[1].toUpperCase();
    }

    let urlStr = "";
    const mUrlFlag = s.match(/\s--url\s+(\S+)/i);
    if (mUrlFlag) {
      urlStr = stripQuotes(mUrlFlag[1]);
    }
    if (!urlStr) {
      const mQ = s.match(/\s(['"])((?:https?:\/\/|\/)[^'"]+)\1/);
      if (mQ) {
        urlStr = mQ[2];
      }
    }
    if (!urlStr) {
      return false;
    }

    try {
      const u = new URL(urlStr, window.location.origin);
      request.path = u.pathname + (u.search || "") + (u.hash || "");
    } catch {
      request.path = urlStr;
    }

    request.method = method;
    const headers: HeaderElement[] = [];
    const pushHeaderLines = (re: RegExp) => {
      let m: RegExpExecArray | null;
      const r = new RegExp(re.source, "gi");
      while ((m = r.exec(s))) {
        const line = m[1].replace(/\\(.)/g, "$1");
        const idx = line.indexOf(":");
        if (idx > 0) {
          headers.push({
            id: "",
            key: line.slice(0, idx).trim(),
            value: line.slice(idx + 1).trim(),
            desc: "",
            enabled: true,
          });
        }
      }
    };
    pushHeaderLines(/-H\s+"((?:\\.|[^"\\])*)"/);
    pushHeaderLines(/-H\s+'((?:\\.|[^'\\])*)'/);
    pushHeaderLines(/--header\s+"((?:\\.|[^"\\])*)"/);
    pushHeaderLines(/--header\s+'((?:\\.|[^'\\])*)'/);
    if (headers.length) {
      request.headers = headers;
    }

    let body: string | undefined;
    const dRe =
      /\s(?:--data-raw|--data-binary|--data|-d)\s+(['"])([\s\S]*?)\1/i.exec(s) ||
      /\s(?:--data-raw|--data-binary|--data|-d)\s+(\S+)/i.exec(s);
    if (dRe) {
      body = dRe[2] != null ? dRe[2].replace(/\\(.)/g, "$1") : stripQuotes(dRe[1]);
    }

    if (body != null && body.length > 0 && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      request.post_type = PostType.Raw;
      request.raw = body;
      const low = s.toLowerCase();
      if (low.includes("application/json")) {
        request.rawContentType = "json";
      } else if (low.includes("application/xml") || low.includes("text/xml")) {
        request.rawContentType = "xml";
      } else {
        request.rawContentType = "text";
      }
    }

    this.initAuth(request);
    return true;
  }

  envKeySuggestions(): string[] {
    const pid = this.currentProjectId || "0";
    return this.envService
      .getVarsForProject(pid)
      .filter((v) => v.enabled !== false && (v.key ?? "").trim() !== "")
      .map((v) => v.key);
  }

  activeParamCount(request: APIElement): number {
    return (request.params ?? []).filter((p) => p && p.enabled !== false && (p.key ?? "").trim() !== "")
      .length;
  }

  activeHeaderCount(request: APIElement): number {
    return (request.headers ?? []).filter((p) => p && p.enabled !== false && (p.key ?? "").trim() !== "")
      .length;
  }

  activeRequestVariableCount(request: APIElement): number {
    this.ensureRequestVariables(request);
    return (request.requestVariables ?? []).filter(
      (p) => p && p.enabled !== false && (p.key ?? "").trim() !== ""
    ).length;
  }

  bodyTabHasIndicator(request: APIElement): boolean {
    if (request.post_type && request.post_type !== PostType.None && request.post_type !== ("" as any)) {
      return true;
    }
    if ((request.raw ?? "").trim().length > 0) {
      return true;
    }
    if ((request.form_data ?? []).some((p) => p && (p.key ?? "").trim() !== "")) {
      return true;
    }
    if (request.binaryFile) {
      return true;
    }
    return false;
  }

  methodTabClass(method: string): string {
    const m = (method || "get").toLowerCase();
    return "hopp-tab-method method-label method-" + m;
  }

  refreshRequestBaseline(request: APIElement) {
    this.requestBaselineJson.set(request.id, this.serializeRequestBaseline(request));
  }

  isRequestDirty(request: APIElement): boolean {
    const b = this.requestBaselineJson.get(request.id);
    if (b === undefined) {
      return false;
    }
    return b !== this.serializeRequestBaseline(request);
  }

  private serializeRequestBaseline(r: APIElement): string {
    const snap = {
      name: r.name,
      method: r.method,
      path: r.path,
      params: r.params,
      headers: r.headers,
      form_data: r.form_data,
      raw: r.raw,
      post_type: r.post_type,
      rawContentType: r.rawContentType,
      auth: r.auth,
      preRequestScript: r.preRequestScript,
      testScript: r.testScript,
      requestVariables: r.requestVariables,
      timeout: r.timeout,
      followRedirects: r.followRedirects,
      withCredentials: r.withCredentials,
    };
    return JSON.stringify(snap);
  }

  async copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toastr.success("Copied");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      this.toastr.success("Copied");
    }
  }

  copyCurl(request: APIElement) {
    const txt = this.codegen.generateCurl(this.currentEndpoint, request);
    this.copyText(txt);
  }

  copyFetch(request: APIElement) {
    const txt = this.codegen.generateFetch(this.currentEndpoint, request);
    this.copyText(txt);
  }

  copyAxios(request: APIElement) {
    const txt = this.codegen.generateAxios(this.currentEndpoint, request);
    this.copyText(txt);
  }

  copyShareLink(request: APIElement) {
    const snapshot: any = { ...request };
    delete snapshot.response;
    delete snapshot.binaryFile;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot))));
    const url = `${window.location.origin}${window.location.pathname}#/project/${this.currentProjectId}?share=${encodeURIComponent(
      encoded
    )}`;
    this.copyText(url);
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
              this.loadTabsFromStorage();
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
    switch (label) {
      case "none":
        request.post_type = PostType.None;
        break;
      case "form-data":
        request.post_type = PostType.FormData;
        break;
      case "x-www-form-urlencoded":
        request.post_type = PostType.FormUrlencoded;
        break;
      case "raw":
        request.post_type = PostType.Raw;
        break;
      case "binary":
        request.post_type = PostType.Binary;
        break;
      default:
        request.post_type = PostType.Empty;
    }
    console.log(label);
    var h: HeaderElement
    switch (label) {
      case "x-www-form-urlencoded":
        this.addContentType(request, "application/x-www-form-urlencoded");
        break;
      case "form-data":
        this.addContentType(request, "multipart/form-data");
        break;
      case "none":
      case "raw":
      case "binary":
        break;
    }
  }

  onBinaryFileSelected(event: Event, request: APIElement) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    request.binaryFile = file;
    this.cdr.markForCheck();
  }

  initAuth(request: APIElement) {
    if (!request.auth) {
      request.auth = { type: "none" };
    }
  }

  initRequestSettings(request: APIElement) {
    if (request.timeout === undefined) {
      request.timeout = 30000; // 30 seconds default
    }
    if (request.followRedirects === undefined) {
      request.followRedirects = true;
    }
    if (request.withCredentials === undefined) {
      request.withCredentials = false;
    }
    if (!request.preRequestScript) {
      request.preRequestScript = "";
    }
    if (!request.testScript) {
      request.testScript = "";
    }
    if (!request.rawContentType) {
      request.rawContentType = "json";
    }
    if (request.binaryFile === undefined) {
      request.binaryFile = null;
    }
    this.ensureRequestVariables(request);
  }

  ensureRequestVariables(request: APIElement) {
    if (!request.requestVariables) {
      request.requestVariables = [];
    }
  }

  toggleDefaultRequestVariableStatus() {
    this.defaultRequestVariableStatus = !this.defaultRequestVariableStatus;
  }

  deleteRequestVariable(request: APIElement, i: number) {
    this.ensureRequestVariables(request);
    request.requestVariables.splice(i, 1);
    this.cdr.markForCheck();
  }

  saveRequestVariable(_request: APIElement, _row: ParamElement) {
    /* Tab-local only; persist via project save if added later */
    this.cdr.markForCheck();
  }

  formatResponseSize(size: number): string {
    if (!size) return "0 B";
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
    return (size / (1024 * 1024)).toFixed(2) + " MB";
  }

  getStatusColor(statusCode: number): string {
    if (!statusCode) return "";
    if (statusCode >= 200 && statusCode < 300) return "#4caf50";
    if (statusCode >= 300 && statusCode < 400) return "#ff9800";
    if (statusCode >= 400 && statusCode < 500) return "#f44336";
    if (statusCode >= 500) return "#9c27b0";
    return "";
  }

  getAuthType(request: APIElement): string {
    if (!request.auth || !request.auth.type) {
      return "none";
    }
    return request.auth.type;
  }

  setAuthType(request: APIElement, authType: string) {
    this.initAuth(request);
    request.auth.type = authType;
  }

}
