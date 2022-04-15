import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRenameComponent } from './project-rename.component';

describe('ProjectRenameComponent', () => {
  let component: ProjectRenameComponent;
  let fixture: ComponentFixture<ProjectRenameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectRenameComponent ]
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
