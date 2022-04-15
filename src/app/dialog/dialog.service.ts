import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  link = new Subject<string>();

  constructor() { }

  saveLink(value: string) {
    this.link.next(value);
  }


}
