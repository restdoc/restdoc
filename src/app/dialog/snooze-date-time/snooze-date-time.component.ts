import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-snooze-date-time',
  templateUrl: './snooze-date-time.component.html',
  styleUrls: ['./snooze-date-time.component.css']
})
export class SnoozeDateTimeComponent implements OnInit {

  selectedDate: Date = null;
  dateString: string = null;
  timeString: string = null;
  minimunDate: Date = null;

  datePickerFrom: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<SnoozeDateTimeComponent>,
    @Inject(MAT_DIALOG_DATA) public data, private fb: UntypedFormBuilder) { }


  ngOnInit() {
    this.datePickerFrom = this.fb.group({
      date: ['', [Validators.required]],
      time: ['', [Validators.required]]
    });

    this.calenderDates();
  }

  calenderDates() {

    let dt = new Date();
    this.minimunDate = new Date();
    dt.setTime(dt.getTime() + (24 * 60 * 60 * 1000));
    const date = new Date(dt);
    const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    this.selectedDate = date;
    this.dateString = monthShortNames[dt.getMonth()] + " " + dt.getDay() + ", " + dt.getFullYear();
    this.timeString = dt.toLocaleTimeString();
  }

  selectedChange(date) {
    
  }

  yearSelected(){
  }

  monthSelected(){
  }

  userSelection(){

  }

  cdkAutofill(){
  }

  submitDate() {
    this.dialogRef.close();
  }

}
