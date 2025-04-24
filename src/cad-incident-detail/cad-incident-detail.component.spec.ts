import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CADIncidentDetailComponent } from './cad-incident-detail.component';

describe('CADIncidentDetailComponent', () => {
  let component: CADIncidentDetailComponent;
  let fixture: ComponentFixture<CADIncidentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CADIncidentDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CADIncidentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
