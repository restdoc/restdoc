import { Component, OnInit, Inject } from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder } from "@angular/forms";
import { Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { MatDialogRef } from "@angular/material/dialog";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { ToastrService } from "ngx-toastr";

import { SharedService } from "../../shared/shared.service";
import { SidebarService } from "../../sidebar/sidebar.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-project-rename",
  templateUrl: "./color-custom.component.html",
  styleUrls: ["./color-custom.component.css"],
})
export class ColorCustomComponent implements OnInit {
  labelFrom: UntypedFormGroup;
  labelName = "";
  projectId = "";
  theLabel = $localize`The label `;
  customSucceed = $localize`Icon and color have been customed successfully.`;
  customFailure = $localize`Failed to custom icon and color`;
  failLabel = $localize`the label `;
  labelRenameFailed = $localize`Failed to rename the project`;
  public colors = [
    "#FFFFFF",
    "#C7C4C4",
    "#F06A6A",
    "#ED8D71",
    "#F1BD6C",
    "#F8E073",
    "#AECF55",
    "#5DA283",
    "#4ECBC5",
    "#9FE7E3",
    "#4573D2",
    "#8E84E8",
    "#B36CD4",
    "#F9AAF0",
    "#F26FB2",
    "#FC979A",
    "#6D6E6F",
    "#000000",
  ];
  public iconColors = [
    "#FFFFFF",
    "#C7C4C4",
    "#F06A6A",
    "#ED8D71",
    "#F1BD6C",
    "#F8E073",
    "#AECF55",
    "#5DA283",
    "#4ECBC5",
    "#9FE7E3",
    "#4573D2",
    "#8E84E8",
    "#B36CD4",
    "#F9AAF0",
    "#F26FB2",
    "#FC979A",
    "#6D6E6F",
    "#000000",
  ];
  public icons = [
    "list",
    "star",
    "lightbulb",
    "group",
    "language",
    "settings",
    "dashboard",
    "bar_chart",
    "pie_chart",
    "folder",
    "storage",
    "event_available",
    "flag",
    "task_alt",
    "bug_report",
    "map",
    "flight",
    "chat_bubble",
    "work",
    "cloud",
    "computer",
    "keyboard",
    "album",
    "music_note",
    "play_circle",
  ];
  selected_color = "";
  selected_name_color = "";
  selected_icon = "list";
  selected_icon_color = "";
  private labelSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ColorCustomComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private fb: UntypedFormBuilder,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private toastr: ToastrService
  ) {
    this.selected_name_color = data.name_color;
    this.selected_icon = data.icon;
    this.selected_icon_color = data.icon_color;
    this.selected_color = data.color;
  }

  ngOnInit() {
    this.labelFrom = this.fb.group({
      name: ["", Validators.required],
      labelCheck: false,
      selectedLabel: "",
    });
  }

  checkbox() {
    const isCheck = this.labelFrom.get("labelCheck").value;

    if (isCheck) {
      this.labelFrom.get("selectedLabel").reset();
    }
  }

  onSave(): void {
    var name = this.labelFrom.get("name");
    var label = name.value;

    let params = {
      id: this.projectId,
      color: this.selected_color,
      name_color: this.selected_name_color,
      icon: this.selected_icon,
      icon_color: this.selected_icon_color,
    };

    this.labelSubscription = this.sharedService
      .updateProject(params)
      .subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (!data || data.code != 0) {
          let message = this.customFailure;
          this.toastr.success(message, "");
          return;
        }

        const detail = data.data.detail;
        if (detail) {
          this.sidebarService.refresh.next("/refresh");
          this.labelName = label;
          let name = detail.name;
          let icon = detail.icon;
          let name_color = detail.name_color;
          let icon_color = detail.icon_color;
          let message = this.customSucceed;
          this.toastr.success(message, "");
          this.dialogRef.close({
            name: name,
            icon: icon,
            icon_color: icon_color,
            name_color: name_color,
          });
        } else {
          let message = this.customFailure;
          this.toastr.success(message, "");
        }
      });
  }

  selectColor(color: string) {
    this.selected_color = color;
  }

  selectIcon(icon: string) {
    this.selected_icon = icon;
  }

  selectIconColor(icon_color: string) {
    this.selected_icon_color = icon_color;
  }

  selectNameColor(name_color: string) {
    this.selected_name_color = name_color;
  }

  onNoClick(evt: Event): void {
    evt.stopPropagation();
    evt.preventDefault();
    this.dialogRef.close();
  }
}
