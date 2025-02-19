import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-cacc-equipment-failure-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './cacc-equipment-failure.component.html',
  styleUrl: './cacc-equipment-failure.component.css'
})

export class caccEquipmentFailureComponent {
  constructor(private titleService: Title, private router:Router) {
      this.titleService.setTitle('CORTS - COR Entry (New)');
    }

  //Variables
  isDelaySelected = false;

  caccEquipmentFailureData = {
    caccEquipmentFailureType: '',
    caccEquipmentFailureDate: '',
    caccEquipmentFailureTime: '',
    caccEquipmentFailureDescription: ''
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
    console.log('Form submitted:', this.caccEquipmentFailureData);
  }

  reloadPage(): void {
    window.location.reload();
  }

  saveChanges(): void {
    if (this.validateReqFields()) {
      console.log('Changes Saved', this.caccEquipmentFailureData);
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
