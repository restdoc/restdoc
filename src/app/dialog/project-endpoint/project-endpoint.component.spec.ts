import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectEndpointComponent } from './project-endpoint.component';

describe('ProjectEndpointComponent', () => {
  let component: ProjectEndpointComponent;
  let fixture: ComponentFixture<ProjectEndpointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectEndpointComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
