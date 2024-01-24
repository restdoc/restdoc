import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { LabelItem } from '../main/main.component';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  compose = new Subject<string>();
  leftMenuActive = new Subject<string>();
  labelChange = new Subject<boolean>();
  refresh = new Subject<string>();
  currentLabel = "all";
  currentLabelId = "0";
  labels: LabelItem[] = [];
  ids: string[] = [];

  constructor() {
    this.currentLabel = "/label/all";
  }

  setIds(ids: string[]) {
    this.ids = ids;
  }

  labelChanged(value: boolean) {
    this.labelChange.next(value);
  }

  newCompose(value: string) {
    if (value) {
      this.compose.next(value);
    } else {
      this.compose.next("{}");
    }
  }

  onSearch(label) {
    this.currentLabel = label;
    this.leftMenuActive.next(label);
  }

  onAdvancedSearch(label) {
    this.currentLabel = label;
    this.leftMenuActive.next(label);
  }

  onAll() {
    this.currentLabel = 'all';
    let dt = JSON.stringify({ 'cmd': 'changeproject', "name": 'all', "id": '0' });
    let encoded = encodeURIComponent(dt);
    this.leftMenuActive.next(encoded);
  }

  onLabel(label: LabelItem) {
    this.currentLabel = label.name;
    let dt = JSON.stringify({
      cmd: 'changeproject',
      name: label.name,
      id: label.id,
      icon: label.icon,
      icon_color: label.icon_color,
      name_color: label.name_color,
    });
    let encoded = encodeURIComponent(dt);
    this.leftMenuActive.next(encoded);
  }

  onCommand(command: string) {
    let encoded = encodeURIComponent(command);
    this.leftMenuActive.next(encoded);
  }

  onSelect(label: string) {
    this.currentLabel = label;
    this.leftMenuActive.next(label);
  }

  onEvent(event) {
    this.leftMenuActive.next(event);
  }

  onKey(event) {
    this.leftMenuActive.next(event);
  }
}
