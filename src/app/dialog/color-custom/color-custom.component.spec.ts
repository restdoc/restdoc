import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ToastrService } from "ngx-toastr";

import { ColorCustomComponent } from "./color-custom.component";

describe("ColorCustomComponent", () => {
  let component: ColorCustomComponent;
  let fixture: ComponentFixture<ColorCustomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorCustomComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ToastrService, useValue: { success: () => {}, warning: () => {}, error: () => {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
