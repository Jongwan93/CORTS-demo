import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [FormsModule],  // Import FormsModule to use [(ngModel)]
  templateUrl: './incident-report.component.html',
  styleUrl: './incident-report.component.css'
})
export class IncidentReportComponent {
  incidentData = {
    incidentType: '',
    incidentDate: '',
    incidentTime: '',
    incidentDescription: ''
  };

  onSubmit(): void {
    console.log('Form submitted:', this.incidentData);
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
