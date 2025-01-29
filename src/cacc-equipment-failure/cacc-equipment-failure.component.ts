import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cacc-equipment-failure-report',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cacc-equipment-failure.component.html',
  styleUrl: './cacc-equipment-failure.component.css'
})
export class caccEquipmentFailureComponent {
  caccEquipmentFailureData = {
    caccEquipmentFailureType: '',
    caccEquipmentFailureDate: '',
    caccEquipmentFailureTime: '',
    caccEquipmentFailureDescription: ''
  };

  onSubmit(): void {
    console.log('Form submitted:', this.caccEquipmentFailureData);
  }

  reloadPage(): void {
    window.location.reload();
  }

  saveChanges(): void {
    console.log('Changes saved');
  }

  saveAndExit(): void {
    console.log('Changes saved and exited');
  }
}
