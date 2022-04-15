import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  Output,
  LOCALE_ID,
  OnChanges,
  OnInit,
  Renderer2,
  SecurityContext,
  SimpleChanges,
  ViewChild,
  EventEmitter,
  ChangeDetectorRef,
} from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { Observable, of, Subscription, Subject } from "rxjs";
import { delay, map, startWith, tap } from "rxjs/operators";

import { ToastrService } from "ngx-toastr";
import { PickerModule } from "@ctrl/ngx-emoji-mart";

import { ParsedMailbox, parseOneAddress } from "email-addresses";

import { environment } from "src/environments/environment";
import { SidebarService } from "./../../sidebar/sidebar.service";
import { APIlistService } from "../apilist/apilist.service";
import { SharedService } from "./../../shared/shared.service";
import { ProjectCreateComponent } from "../../dialog/project-create/project-create.component";
import { LabelItem, User, EndpointElement } from "./../../main/main.component";

import { BitSet } from "../../third/BitSet/BitSet";

@Component({
  selector: "app-details",
  templateUrl: "./details.component.html",
  styleUrls: ["./details.component.css"],
})
export class DetailsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() mailId = "";

  @Output() changeEvent = new EventEmitter<string>();
  @ViewChild("auto") matAutocomplete: MatAutocomplete;

  @ViewChild("detailMoreMenuTrigger") detailMoreMenuTrigger: MatMenuTrigger;
  @ViewChild("detailMoveMenuTrigger") detailMoveMenuTrigger: MatMenuTrigger;
  @ViewChild("detailLabelMenuTrigger") detailLabelMenuTrigger: MatMenuTrigger;

  private labelChangeSubscription: Subscription;
  private sidebarSubscription: Subscription;
  private readSub: Subscription;
  private listActionsSub: Subscription;
  labelFrom: FormGroup;
  labelName = "";
  minutes = 0;
  theLabel = $localize`The label `;
  labelCreateSucceed = $localize`The project has been created successfully.`;
  labelCreateFailure = $localize`Failed to create project.`;
  failLabel = $localize`the label `;
  labelCreateFailed = $localize`Failed to create the label`;
  private labelSubscription: Subscription;

  form: FormGroup;
  id = "";
  title = "hello";
  searchForm: FormGroup;
  label: string;
  labels: LabelItem[] = [];
  labelMaps = {};


  constructor(
    public dialogRef: MatDialogRef<ProjectCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    @Inject(LOCALE_ID) public locale: string,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private http: HttpClient,
    private sidebarService: SidebarService,
    private apilistService: APIlistService,
    private sharedService: SharedService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.labelFrom = this.fb.group({
      name: ["", Validators.required],
      labelCheck: false,
      selectedLabel: "",
    });



    console.log("this.mailId");
    console.log(this.mailId);
    this.form = this.fb.group({});

    const u = this.router.url;
    const parsed = this.router.parseUrl(u);
    parsed.queryParams = {};
    const path = parsed.toString();

    const detail = this.route.snapshot.data.detail;

    if (detail && detail.data && detail.data.detail) {
      this.id = detail.data.detail.id;
    } else {
      // todo
      this.id = "";
    }

    // this.related = detail.data.related;
    this.listActionsSub = this.apilistService.changes.subscribe((val) => {
      try {
        let data = JSON.parse(val);
        let ids = data["ids"];
        let action = data["action"];
        let state = data["state"];
        let stateStatus = false;
        if (state == true) {
          stateStatus = true;
        }
        if (ids && action) {
          this.handleAction(ids, action, stateStatus);
        }
      } catch (err) {}
    });

    this.sidebarSubscription = this.sidebarService.leftMenuActive.subscribe(
      (res) => {
        if (res === "/empty-click") {
          return;
        }

        if (res.startsWith("/key/")) {
          this.handleHotKey(res);
          return;
        }
      }
    );

    this.searchForm = this.fb.group({
      search: [""],
    });

    console.log(this.mailId);

  }

  initLabelIds(ids: string) {}

  showSuccess() {
    this.toastr.success("Hello world!", "");
  }

  

  setRead() {}

  ngOnChanges(changes: SimpleChanges) {
    // changes.prop contains the old and the new value...
    this.cdr.markForCheck();
    const change = changes.mailId;
    if (change) {
      console.log("change");
      console.log(change);
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.labelChangeSubscription) {
      this.labelChangeSubscription.unsubscribe();
    }
    if (this.readSub) {
      this.readSub.unsubscribe();
    }
    if (this.listActionsSub) {
      this.listActionsSub.unsubscribe();
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  handleHotKey(res) {}

  callList(body: string): void {
    /*
        var id = this.id;
        var data = {"id": id};
        var body = JSON.stringify(data);
         */
    //this.changeEvent.next(body);
  }

  backToMailBox() {
    this.router.navigate(["../"], { relativeTo: this.route });
  }

  expandDetail(r, i) {}

  clipShow(r, i) {}

  ContentChange(event) {}

  focusSearch() {}

  handleExpandEvent(event) {}

  expandQuote(r, i) {}

  handleAction(ids: string, action: string, state: boolean) {}

  onCreate(): void {
    var name = this.labelFrom.get("name");
    var label = name.value;
    let params = { name: label };
    this.labelSubscription = this.sharedService
      .createProject(params)
      .subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (!data || data.code != 0) {
          let message = this.labelCreateFailure;
          this.toastr.success(message, "");
          return;
        }

        const detail = data.data.detail;
        if (detail) {
          this.sidebarService.refresh.next("/refresh");
          this.labelName = label;
          let message = this.labelCreateSucceed;
          this.toastr.success(message, "");
          this.dialogRef.close();
        } else {
          let message = this.labelCreateFailure;
          this.toastr.success(message, "");
        }
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
