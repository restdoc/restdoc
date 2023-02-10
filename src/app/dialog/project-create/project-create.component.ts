import { Component, OnInit, Inject,ChangeDetectorRef  } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UntypedFormArray, UntypedFormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { Subscription } from "rxjs";

import { ToastrService } from "ngx-toastr";

import { SharedService } from "../../shared/shared.service";
import { SidebarService } from "../../sidebar/sidebar.service";
import { environment } from "src/environments/environment";

import { Team, Host } from "../../main/main.component";
import { I } from "@angular/cdk/keycodes";

@Component({
  selector: "app-project-create",
  templateUrl: "./project-create.component.html",
  styleUrls: ["./project-create.component.css"],
})
export class ProjectCreateComponent implements OnInit {
  labelForm: UntypedFormGroup;
  labelName = "";
  minutes = 0;
  theLabel = $localize`The label `;
  labelCreateSucceed = $localize`The project has been created successfully.`;
  labelCreateFailure = $localize`Failed to create project.`;
  failLabel = $localize`the label `;
  teams: Team[] = [];
  hosts: Host[] = [{ "name": "Prod", "value": "http://prod.example.com" }, {"name": "Test", "value": "http://test.example.com"}];
  selectedTeamId = "";
  labelCreateFailed = $localize`Failed to create the label`;
  private labelSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ProjectCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private fb: UntypedFormBuilder,
    private sharedService: SharedService,
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    
    var endpoints = this.fb.array([]);
    let prodHost = this.fb.group({
      name: "Prod",
      value: "https://prod.example.com",
    });
    endpoints.push(prodHost)

    let testHost = this.fb.group({
      name: "Test",
      value: "https://test.example.com",
    });
    endpoints.push(testHost);

    this.labelForm = this.fb.group({
      name: ["", Validators.required],
      newEndpointName: "x",
      newEndpointValue: "y",
      labelCheck: false,
      selectedLabel: "",
      endpoints: endpoints,
    });


    this.sharedService.listTeams().subscribe((data: any) => {
      this.sharedService.checkResponse(location, data);

      if (!data || data.code != 0) {
        let message = this.labelCreateFailure;
        this.toastr.success(message, "");
        return;
      }
      console.log(data);
      this.teams = data.data.list;
    });
  }


  checkbox() {
    const isCheck = this.labelForm.get("labelCheck").value;

    if (isCheck) {
      this.labelForm.get("selectedLabel").reset();
    }
  }

  select(team: Team) {
    this.selectedTeamId = team.id;
  }

  getEndpoints() : UntypedFormArray {
    return this.labelForm.get("endpoints") as UntypedFormArray
  }

  removeEndpoint(i: number) {
    var endpoints = this.labelForm.get("endpoints") as UntypedFormArray;
    endpoints.removeAt(i)
    console.log(endpoints);
    this.labelForm.controls['endpoints'] = endpoints;
  }

  addEndpoint() {
    console.log(this.labelForm);
    let name = this.labelForm.get('newEndpointName').value;
    let value = this.labelForm.get('newEndpointValue').value;

    if (name == "" || value == "") {
      return
    }

    let endPoint = this.fb.group({
        name: name,
        value: value,
    })

    let params = { name: name, value: value};
    this.labelSubscription = this.sharedService
      .createEndpoint(params)
      .subscribe((data: any) => {
        console.log(data);
        this.sharedService.checkResponse(location, data);

        if (!data || data.code != 0) {
          //let message = this.labelCreateFailure;
          let message = "add endpoint error";
          this.toastr.success(message, "");
          return;
        }
      })


    var endpoints = this.getEndpoints();  //ref 
    endpoints.push(endPoint);

    this.labelForm.patchValue({
      newEndpointName: "",
      newEndpointValue: ""
    });
    this.cdr.markForCheck();
  }

  onCreate(): void {
    var name = this.labelForm.get("name");
    var label = name.value;
    console.log(name);
    console.log(this.selectedTeamId);
    if (this.selectedTeamId == "") {
      return;
    }


    let es = this.getEndpoints();
    var endpoints = [];
    for (var ep of es.controls) {
      let name = ep.get("name").value;
      let value = ep.get("value").value;
      let item = { "name": name, "value": value };
      endpoints.push(item);
    }

    var endpointsBody =  window.btoa(JSON.stringify(endpoints));

    let params = { name: label, team_id: this.selectedTeamId, endpoints: endpointsBody, };
    this.labelSubscription = this.sharedService
      .createProject(params)
      .subscribe((data: any) => {
        console.log(data);
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
