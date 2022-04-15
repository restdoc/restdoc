import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-settings-navi',
    templateUrl: './settings-navi.component.html',
    styleUrls: ['./settings-navi.component.css']
})
export class SettingsNaviComponent implements OnInit {

    hello = "world";

    constructor() { }

    ngOnInit() {
    }

}
