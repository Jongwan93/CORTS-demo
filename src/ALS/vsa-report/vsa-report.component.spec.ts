import { ComponentFixture, TestBed } from '@angular/core/testing';

import { vsaReportComponent } from './vsa-report.component';

describe('vsaReportComponent', () => {
  let component: vsaReportComponent;
  let fixture: ComponentFixture<vsaReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [vsaReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(vsaReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
