import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-fleet-equipment-report',
  imports: [FormsModule, RouterModule],
  templateUrl: './fleet-equipment-report.component.html',
  styleUrl: './fleet-equipment-report.component.css'
})
export class FleetEquipmentReportComponent {
  constructor(private titleService:Title, private router:Router) {
    this.titleService.setTitle("CORTS - COR Entry (New)");
  }

  //Variables
  isDelaySelected = false;

  fleetEquipmentData = {
    fleetEquipmentType: '',
    fleetEquipmentDate: '',
    fleetEquipmentTime: '',
    fleetEquipmentDescription: ''
  };

  //Method toggles delayed field (To be able to input the time)
  toggleDelayTime() {
    this.isDelaySelected = !this.isDelaySelected;
  }

  // Method verifies if all Required Fields are filled in
  validateReqFields(): boolean {
    const reqFields = document.querySelectorAll('[required]');
    for (let field of reqFields) {
      const inputField = field as HTMLInputElement;
      if (!inputField.value) {
        console.error('Required field not filled:', field);
        window.alert('Error: Not all required fields are filled in.');
        return false;
      }
    }
    return true;
  }

  onSubmit(): void {
    console.log('Form submitted:', this.fleetEquipmentData);
  }

  reloadPage(): void {
    window.location.reload();
  }

  saveChanges(): void {
    if (this.validateReqFields()) {
      console.log('Changes Saved', this.fleetEquipmentData);
      window.alert('Changes Saved')
    } else {
      console.error('Error Submitting');
    }
  }

  saveAndExit(): void {
    if (this.validateReqFields()) {
      console.log('Changes saved and exited');
      window.alert('Changes Saved')
      this.router.navigate(['/mainpage']);
    } else {
      console.error('Error Submitting');
    }

  }
}
