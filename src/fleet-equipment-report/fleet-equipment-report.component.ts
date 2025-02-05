import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-fleet-equipment-report',
  imports: [FormsModule, RouterModule],
  templateUrl: './fleet-equipment-report.component.html',
  styleUrl: './fleet-equipment-report.component.css'
})
export class FleetEquipmentReportComponent {
  constructor(private titleService:Title) {
    this.titleService.setTitle("CORTS - COR Entry (New)");
  }
}
