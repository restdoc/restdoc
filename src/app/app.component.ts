
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';


import { MainService } from './main/main.service';
import { SharedService } from './shared/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = '';

  isLogin: boolean = false;

  constructor(private mainService: MainService) {

  }

  ngOnInit() {
    // if(!this.userEmail) {
    //   const dialogRef = this.dialog.open(LoginComponent, {
    //     width: '500px',
    //   });

    //   dialogRef.afterClosed().subscribe(result => {
    //   });
    // }
  }



}
