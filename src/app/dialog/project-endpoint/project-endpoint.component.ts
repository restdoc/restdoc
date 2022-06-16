import { Component, OnInit, Inject,ChangeDetectorRef  } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormArray, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subscription } from "rxjs";

import { ToastrService } from "ngx-toastr";

import { SharedService } from "../../shared/shared.service";
import { SidebarService } from "../../sidebar/sidebar.service";
import { environment } from "src/environments/environment";
import { EndpointElement } from "../../main/main.component";

@Component({
  selector: "app-project-endpoint",
  templateUrl: "./project-endpoint.component.html",
  styleUrls: ["./project-endpoint.component.css"],
})
export class ProjectEndpointComponent implements OnInit {
  labelForm: FormGroup;
  labelName = "";
  projectId = "";
  theLabel = $localize`The label `;
  labelRenameSucceed = $localize`The project has been renamed successfully.`;
  getProjectDetailFailure = $localize`Failed to get project endpoints.`;
  projectUpdateFailure = $localize`Failed to update project endpoints.`;
  projectRemoveFailure = $localize`Failed to remove project endpoint.`;
  endpointAddFailure = $localize`Failed to add endpoint.`;
  failLabel = $localize`the label `;
  labelRenameFailed = $localize`Failed to rename the project`;
  endpoints: EndpointElement[] = [];
  newEndpointName = "";
  newEndpointValue = "";
  private labelSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ProjectEndpointComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
  
    //get endpoints
    var ends = this.fb.array([]);


    this.labelForm = this.fb.group({
          newEndpointName: "x",
          newEndpointValue: "y",
          labelCheck: false,
          selectedLabel: "",
          endpoints: ends,
    });



    let projectId = this.projectId;
    this.sharedService.getProjectDetail(projectId).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (!data || data.code != 0) {
        let message = this.getProjectDetailFailure;
        this.toastr.success(message, "");
        return;
      }

      if (data.data && data.data.detail ) {
        let detail = data.data.detail;
        console.log(detail);
        let ends = detail.endpoints;
        console.log(ends);

        var endpoints = this.getEndpoints();  //ref 
        for (var end of ends) {
          let item = this.fb.group({
            id: end.id,
            name: end.name,
            value: end.value,
          })
          endpoints.push(item)
        }
        this.cdr.markForCheck();

      }
      //this.endpoints = [];
      //this.detail = data.data.list;
    });
  }

  checkbox() {
    const isCheck = this.labelForm.get("labelCheck").value;

    if (isCheck) {
      this.labelForm.get("selectedLabel").reset();
    }
  }

  onSave(): void {
    var name = this.labelForm.get("name");
    var label = name.value;
    let params = { id: this.projectId, name: label };
    this.labelSubscription = this.sharedService
      .updateProject(params)
      .subscribe((data: any) => {
        this.sharedService.checkResponse(location, data);

        if (!data || data.code != 0) {
          let message = this.projectUpdateFailure;
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
          let message = this.projectUpdateFailure;
          this.toastr.success(message, "");
        }
      });
  }



  removeEndpoint(i: number) {
    var endpoints = this.labelForm.get("endpoints") as FormArray;
     let end = endpoints.controls[i];
    let id = end.get("id").value;
    let params = { "id": id};

    this.sharedService.removeEndpoint(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (!data || data.code != 0) {
        let message = this.projectRemoveFailure;
        this.toastr.success(message, "");
        return;
      }

      endpoints.removeAt(i)
      this.labelForm.controls['endpoints'] = endpoints;

    });
  }


  updateEndpoint(i: number) {
    var endpoints = this.labelForm.get("endpoints") as FormArray;
    let end = endpoints.controls[i];
    console.log(end);
    //end.get('name').setValue(name);
    let id = end.get("id").value;
    let name = end.get("name").value;
    let value = end.get("value").value;
    
    let params = { "id": id, "name": name, "value": value };

    this.sharedService.updateEndpoint(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (!data || data.code != 0) {
        let message = this.projectUpdateFailure;
        this.toastr.success(message, "");
        return;
      }

      const detail = data.data.detail;
      console.log(data);

    });
    this.labelForm.controls['endpoints'] = endpoints;
    //send request
  }

  onNoClick(): void {
    //this.dialogRef.close();

    //this.dialogRef.close({event:this.action,data:this.local_data});
    let items = this.labelForm.get("endpoints") as FormArray;
    var endpoints:EndpointElement[] = [];
    for (var i = 0; i < items.controls.length; i++){
      let item = items.controls[i].value;
      console.log(item);
      let endpoint: EndpointElement = { id: item.id, name: item.name, value: item.value };
      endpoints.push(endpoint);
    }
    this.dialogRef.close({ endpoints: endpoints });

  }

  getEndpoints() : FormArray {
    return this.labelForm.get("endpoints") as FormArray
  }

  addEndpoint() {
    let name = this.labelForm.get('newEndpointName').value;
    let value = this.labelForm.get('newEndpointValue').value;

    if (name == "" || value == "") {
      return
    }

    let endPoint = this.fb.group({
        name: name,
        value: value,
    })
    var endpoints = this.getEndpoints();  //ref 
    endpoints.push(endPoint);

    this.labelForm.patchValue({
      newEndpointName: "",
      newEndpointValue: ""
    });

    let params = { "project_id": this.projectId, "name": name, "value": value };

    this.sharedService.createEndpoint(params).subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (!data || data.code != 0) {
        let message = this.endpointAddFailure;
        this.toastr.success(message, "");
        return;
      }

      const detail = data.data.detail;
      console.log(data);

    });

    this.cdr.markForCheck();
  }

  clearEndpoint() {
    this.labelForm.patchValue({
      newEndpointName: "",
      newEndpointValue: ""
    });

    this.cdr.markForCheck();
  }
}
