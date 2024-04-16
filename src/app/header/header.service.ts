import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';


import { SharedService } from './../shared/shared.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  environment = environment;
  private sidebarActive = new BehaviorSubject<boolean>(false);
  searchObserable = new Subject<string>();
  styleObserable = new Subject<string>();
  color = "#FFFFFF";
  icon = "list";
  name_color = "#000000";
  icon_color = "#000000";
  name = "";
  id = "";

  constructor(private sharedService: SharedService) {

  }

  setSibarActive(active) {
    this.sidebarActive.next(active);
  }


  getSidebarState(): boolean {
    const key = this.environment.projectName + "-sidebar";
    const status = localStorage.getItem(key);

    if (status == "true") {
      return true;
    } else {
      return false;
    }
  }

  setSidebarState(value: boolean) {
    let state = String(value);
    const key = this.environment.projectName + "-sidebar";
    localStorage.setItem(key, state);
  }

 searchData(data) {
    this.icon = data.icon;
    this.icon_color = data.icon_color;
    this.name_color = data.name_color;
    this.color = data.color;
    this.name = data.name;
    this.id = data.id;
    this.searchObserable.next(data);
  }

  getSidebarActive(): Observable<boolean> {
    return this.sidebarActive.asObservable();
  }


}
