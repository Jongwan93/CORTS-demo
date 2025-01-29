import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vsa-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './vsa-report.component.html',
  styleUrl: './vsa-report.component.css'
})
export class vsaReportComponent {
  vsaData = {
    vsaType: '',
    vsaDate: '',
    vsaTime: '',
    vsaDescription: ''
  };

  isVSASelected = false;

  togglePronouncedBy() {
    this.isVSASelected = !this.isVSASelected;
  }

  onSubmit(): void {
    console.log('Form submitted:', this.vsaData);
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
