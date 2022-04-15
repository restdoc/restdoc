import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';


import { SharedService } from './../shared/shared.service';


@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private sidebarActive = new BehaviorSubject<boolean>(false);
  searchObserable = new Subject<string>();
  styleObserable = new Subject<string>();

  constructor(private sharedService: SharedService) {

  }

  setSibarActive(active) {

    this.sidebarActive.next(active);
  }


  selectStyle(style:string){
    this.styleObserable.next(style);
  }

  searchData(data) {
    this.searchObserable.next(data);
  }

  getSidebarActive(): Observable<boolean> {
    return this.sidebarActive.asObservable();
  }


}
