import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UntypedFormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { Subscription } from "rxjs";

import { ToastrService } from "ngx-toastr";

import { SharedService } from "../../shared/shared.service";
import { SidebarService } from "../../sidebar/sidebar.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-project-rename",
  templateUrl: "./project-rename.component.html",
  styleUrls: ["./project-rename.component.css"],
})
export class ProjectRenameComponent implements OnInit {
  labelFrom: UntypedFormGroup;
  labelName = "";
  projectId = "";
  theLabel = $localize`The label `;
  labelRenameSucceed = $localize`The project has been renamed successfully.`;
  labelRenameFailure = $localize`Failed to rename project.`;
  failLabel = $localize`the label `;
  labelRenameFailed = $localize`Failed to rename the project`;
  private labelSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ProjectRenameComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private fb: UntypedFormBuilder,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private toastr: ToastrService
  ) {}

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
    let params = { id: this.projectId, name: label };
    this.labelSubscription = this.sharedService
      .updateProject(params)
      .subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (!data || data.code != 0) {
          let message = this.labelRenameFailure;
          this.toastr.success(message, "");
          return;
        }

        const detail = data.data.detail;
        if (detail) {
          this.sidebarService.refresh.next("/refresh");
          this.labelName = label;
          let message = this.labelRenameSucceed;
          this.toastr.success(message, "");
          this.dialogRef.close({ name: label });
        } else {
          let message = this.labelRenameFailure;
          this.toastr.success(message, "");
        }
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
