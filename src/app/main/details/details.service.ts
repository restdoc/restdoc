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

import { SidebarService } from "./../../sidebar/sidebar.service";
import { SharedService } from "./../../shared/shared.service";

@Injectable({
  providedIn: "root",
})
export class DetailsService {
  allLabel = new BehaviorSubject<any>(null);
  tableSnackbar = new BehaviorSubject<boolean>(false);
  snackbar = new BehaviorSubject<string>(null);

  constructor(private sharedService: SharedService) {}
}

@Injectable()
export class DetailsResolver implements Resolve<any> {
  constructor(
    private http: HttpClient,
    private sidebar: SidebarService,
    private sharedService: SharedService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    var id = "";
    if (route.paramMap && route.paramMap != null) {
      var tempId = route.paramMap.get("id");
      if (tempId && tempId != "") {
        id = tempId;
      }
    }

    var u = state.url;
    if (u && u != "") {
      var arr = u.split("/");

      if (arr.length > 1) {
        var temp = arr[1];
      }
    }

    var path = "api/restdoc/api/detail/" + id;

    return this.sharedService.getAPIDetail(path).pipe(
      map((dataFromApi) => dataFromApi),
      catchError((err) => Observable.throw(err.json().error))
    );
  }
}
