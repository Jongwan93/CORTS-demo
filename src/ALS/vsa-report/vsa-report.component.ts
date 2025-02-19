import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-vsa-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './vsa-report.component.html',
  styleUrl: './vsa-report.component.css',
})

export class vsaReportComponent {
  constructor(private titleService: Title, private router:Router) {
    this.titleService.setTitle('CORTS - COR Entry (New)');
  }

  // Variables
  relatedCORInput: string = '';
  relatedCORs: string[] = [];
  vsaData = {
    vsaType: '',
    vsaDate: '',
    vsaTime: '',
    vsaDescription: '',
  };

  reqVSAElements = document.getElementsByClassName(
    'vsa-req-input'
  ) as HTMLCollectionOf<HTMLElement>;

  isVSASelected = false;
  isALSSelected = false;

  // Method for adding related CORs
  addRelatedCOR() {
    if (this.relatedCORInput.trim()) {
      this.relatedCORs.push(this.relatedCORInput.trim());
      this.relatedCORInput = '';
    }
  }

  // Method for removing related CORs
  removeRelatedCOR() {
    this.relatedCORs.pop();
  }

  // Method for triggering vsaReqInput if VSA type is selected
  toggleReportType(reportType: string): void {
    if (reportType === 'vsa') {
      this.isVSASelected = !this.isVSASelected;
      this.vsaReqInput();
    } else if (reportType === 'als') {
      this.isALSSelected = !this.isALSSelected;
    }
  }

  // If VSA is selected then Pronounced By and Pronounced Dates become required fields
  vsaReqInput(): void {
    if (this.isVSASelected) {
      for (let i = 0; i < this.reqVSAElements.length; i++) {
        const reqVSAElement = this.reqVSAElements[i];
        reqVSAElement.classList.add('req-input');
        reqVSAElement.setAttribute('required', '');
      }
    } else {
      for (let i = 0; i < this.reqVSAElements.length; i++) {
        const vsaElement = this.reqVSAElements[i];
        vsaElement.classList.remove('req-input');
        vsaElement.removeAttribute('required');
      }
    }
  }

  // Method verifies of the Report Type is selected
  vsaTypeCheck(): boolean {
    if (this.isALSSelected || this.isVSASelected) {
      console.log('Report type selected');
      return true;
    } else {
      console.error('You must select either ALS, VSA, or both.');
      window.alert('Error: You must select either ALS, VSA or both.');
      return false;
    }
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
    console.log('Form submitted:', this.vsaData);
  }

  reloadPage(): void {
    window.location.reload();
  }

  saveChanges(): void {
    if (this.vsaTypeCheck() && this.validateReqFields()) {
      console.log('Changes Saved', this.vsaData);
      window.alert('Changes Saved')
    } else {
      console.error('Error Submitting');
    }
  }

  saveAndExit(): void {
    if (this.vsaTypeCheck() && this.validateReqFields()) {
      console.log('Changes saved and exited');
      window.alert('Changes Saved')
      this.router.navigate(['/mainpage']);
    } else {
      console.error('Error Submitting');
    }

  }
}
