import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetEquipmentReportComponent } from './fleet-equipment-report.component';

describe('FleetEquipmentReportComponent', () => {
  let component: FleetEquipmentReportComponent;
  let fixture: ComponentFixture<FleetEquipmentReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FleetEquipmentReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetEquipmentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
