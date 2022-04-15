import { Injectable } from "@angular/core";
import { Subject, Observable, BehaviorSubject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Resolve,
} from "@angular/router";
import { Router } from "@angular/router";

import { SidebarService } from "../../sidebar/sidebar.service";
import { SharedService } from "../../shared/shared.service";

@Injectable({
  providedIn: "root",
})
export class APIlistService {
  changes = new BehaviorSubject<string>(null);
  constructor(private sharedService: SharedService) {}
}
