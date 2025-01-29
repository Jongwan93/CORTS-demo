import { ComponentFixture, TestBed } from '@angular/core/testing';

import { caccEquipemtnFailureComponent } from './cacc-equipment-failure.component';

describe('caccEquipmentFailureComponent', () => {
  let component: caccEquipemtnFailureComponent;
  let fixture: ComponentFixture<caccEquipemtnFailureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [caccEquipemtnFailureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(caccEquipemtnFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
