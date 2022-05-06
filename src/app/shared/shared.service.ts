import { Injectable } from "@angular/core";
import {
  HttpHeaders,
  HttpClient,
  HttpParams,
  HttpParameterCodec,
} from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { ajax } from "rxjs/ajax";
import { filter, map, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { environment } from "./../../environments/environment";

class HttpUrlPercentEncodingCodec implements HttpParameterCodec {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }

  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }

  decodeKey(key: string): string {
    return decodeURIComponent(key);
  }

  decodeValue(value: string) {
    return decodeURIComponent(value);
  }
}

@Injectable({
  providedIn: "root",
})
export class SharedService {
  baseurl = "/";
  lucidbaseurl = "";
  data = [];
  labels = [];

  httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      json: "true",
    }),
    params: new HttpParams(),
    withCredentials: true,
  };

  constructor(private http: HttpClient) {
    if (!environment.baseurl.endsWith("/")) {
      alert("invalid environment baseurl");
    }

    this.baseurl = environment.baseurl;
  }

  setup() {
    this.getProjects().subscribe((data: any) => {
      this.labels = data.data.list;
    });
  }

  formatParams(data: Object): string {
    var encoder = new HttpUrlPercentEncodingCodec();
    var params = new HttpParams({ encoder: encoder });
    for (let key in data) {
      let value = "" + data[key];
      params = params.set(key, value);
    }
    let result = params.toString();
    return result;
  }

  post(apiEndpoints, data) {
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  get(apiEndpoints) {
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  checkResponse(location: Location, data: any) {
    if (data.code == 403) {
      var url = location.protocol + "//" + location.host + "/login";
      if (!environment.production) {
        url = environment.baseurl + "login";
      }

      window.open(url, "_self");
      return;
    }
  }

  getUserInfo() {
    let apiEndpoints = "api/user/info";
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  createProject(data) {
    let apiEndpoints = "api/restdoc/project/add";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  getAPIs(params: Map<string, string>) {
    let apiEndpoints = "api/restdoc/api/list";
    var options = { ...this.httpOptions };

    var ps = new HttpParams();
    for (let [key, value] of params) {
      ps = ps.append(key, value);
    }
    options.params = ps;
    return this.http.get(this.baseurl + apiEndpoints, options);
  }

  getAPIDetail(id: String) {
    let apiEndpoints = "api/restdoc/api/detail/" + id;
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  getProjects() {
    let apiEndpoints = "api/restdoc/project/list";
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  getProjectDetail(id: String) {
    let apiEndpoints = "api/restdoc/project/detail/" + id;
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  listTeams() {
    let apiEndpoints = "api/team/list";
    return this.http.get(this.baseurl + apiEndpoints, this.httpOptions);
  }

  addAPIToGroup(data) {
    let apiEndpoints = "api/restdoc/api/add";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  moveAPI(data) {
    let apiEndpoints = "api/restdoc/api/move";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  updateAPI(data) {
    let apiEndpoints = "api/restdoc/api/update";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  addGroupToProject(data) {
    let apiEndpoints = "api/restdoc/group/add";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  moveGroup(data) {
    let apiEndpoints = "api/restdoc/group/move";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  updateGroupStatus(data) {
    let apiEndpoints = "api/restdoc/group/update";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  deleteAPI(data) {
    let apiEndpoints = "api/restdoc/api/delete";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  uploadFile(apiEndpoints, data) {
    //let params = this.formatParams(data);

    var headers = new HttpHeaders({});
    var httpOptions = {
      headers: headers,
      withCredentials: true,
    };
    var options = { ...httpOptions };
    options["reportProgress"] = true;
    options["observe"] = "events";

    //return this.http.post(this.baseurl + apiEndpoints, data, options);
    return this.http.post(this.baseurl + apiEndpoints, data, options);
    //return this.http.post(url, data, options);
  }

  deleteProject(data) {
    let apiEndpoints = "api/restdoc/project/delete";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  updateProject(data) {
    let apiEndpoints = "api/restdoc/project/update";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }

  updateEndpoint(data) {
    let apiEndpoints = "api/restdoc/endpoint/update";
    let params = this.formatParams(data);
    return this.http.post(
      this.baseurl + apiEndpoints,
      params,
      this.httpOptions
    );
  }


  patch(apiEndpoints, data) {
    return this.http.patch(this.baseurl + apiEndpoints, data);
  }

  logout() {
    var apiEndpoints = "logout";
    return this.http.post(this.baseurl + apiEndpoints, null, this.httpOptions);
  }
}
