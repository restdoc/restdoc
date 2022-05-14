import { Injectable } from "@angular/core";
import { Subject, Observable, BehaviorSubject, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Resolve,
} from "@angular/router";
import { Router } from "@angular/router";

import {
  EndpointElement,
  APIElement,
  ParamElement,
  HeaderElement,
  ResponseElement,

} from "./main.component";
import { SidebarService } from "./../sidebar/sidebar.service";
import { SharedService } from "./../shared/shared.service";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class MainService {
  allLabel = new BehaviorSubject<any>(null);
  tableSnackbar = new BehaviorSubject<boolean>(false);
  snackbar = new BehaviorSubject<string>(null);

  constructor(private sharedService: SharedService) {}

  ngOnDestroy(): void {}
}


@Injectable({
  providedIn: "root",
})
export class UtilsService {

  formatRequest(detail: any) : APIElement {
        let id = detail.id;
        let name = detail.name;
        let status = detail.status;
        let color = detail.color;
        let path = detail.path;
        let host = detail.host;

        let principal_id = detail.principal_id;
        let desc = "";

        var method = detail.method;

        if (!method || method == "") {
          method = "GET";
        }

        console.log("method");
        console.log(method);

        var ps: ParamElement[] = [];
        ps.push({ key: "x", value: "y", desc: "", enabled: false, required: true });

        var headers: HeaderElement[] = [];
        headers.push({ key: "x", value: "y", desc: "" , enabled: true});

        let resp: ResponseElement = { body: "", headers: [] , contentType: "", responseUrl: ""};

        let card: APIElement = {
          id: id,
          principal_id: principal_id,
          name: name,
          color: color,
          status: status,
          method: method,
          path: path,
          host: host,
          desc: desc,
          disabled: false,
          params: ps,
          headers: headers,
          response: resp,
        };
        return card
  }

  formatContentType(_contentType: string) : string {
    var contentType = ""
    if (_contentType == "") {
      return contentType
    }

    var trimed = _contentType.trim().toLowerCase();
    let arr = _contentType.split(";");
    if (arr.length > 1) {
      trimed = arr[0];
    }
    switch (trimed) {
      case "application/json":
        contentType = "json";
        break;
      case "application/javascript":
        contentType = "json";
        break;
      case "application/xml":
        contentType = "xml";
        break;
      case "text/javascript":
        contentType = "json";
        break;
      case "text/html":
        contentType = "html";
        break;
      case "text/css":
        contentType = "plain";
        break;
      case "text/csv":
        contentType = "plain";
        break;
      case "text/plain":
        contentType = "plain";
        break;
      case "text/xml":
        contentType = "plain";
        break;
      default:
        break;
    }
    return contentType;
  }

  
}

@Injectable()
export class LabelsResolver implements Resolve<any> {
  constructor(private http: HttpClient, private sharedService: SharedService) {}

  resolve(): Observable<any> {
    var cachedLabels = localStorage.getItem(environment.projectsKey);
    cachedLabels = null;
    //add hash compare  send http request
    if (!cachedLabels) {
      return this.sharedService.getProjects().pipe(
        map((dataFromApi) => dataFromApi),
        //catchError((err) => Observable.throw(err))
        catchError((err) => {
          console.log(err);
          return of([]);
        })
      );
    } else {
      //todo
      return;
    }
  }
}

@Injectable()
export class SearchResolver implements Resolve<any> {
  constructor(private http: HttpClient, private sharedService: SharedService) {}

  resolve(): Observable<any> {
    return this.sharedService.getAPIs(new Map()).pipe(
      map((dataFromApi) => dataFromApi),
      catchError((err) => Observable.throw(err.json().error))
    );
  }
}
