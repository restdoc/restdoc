import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';

import { ProjectRenameComponent } from './project-rename.component';

describe('ProjectRenameComponent', () => {
  let component: ProjectRenameComponent;
  let fixture: ComponentFixture<ProjectRenameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectRenameComponent ],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ToastrService, useValue: { success: () => {}, warning: () => {}, error: () => {} } },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectRenameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
