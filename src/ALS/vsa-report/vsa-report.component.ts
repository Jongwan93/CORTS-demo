import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-vsa-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './vsa-report.component.html',
  styleUrl: './vsa-report.component.css'
})
export class vsaReportComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle("CORTS - COR Entry (New)");
  }

  relatedCORInput: string = '';
  relatedCORs: string[] = [];

  addRelatedCOR() {
    if (this.relatedCORInput.trim()) {
      this.relatedCORs.push(this.relatedCORInput.trim());
      this.relatedCORInput = '';
    }
  }

  removeRelatedCOR() {
    this.relatedCORs.pop();
  }

  vsaData = {
    vsaType: '',
    vsaDate: '',
    vsaTime: '',
    vsaDescription: ''
  };

  vsaElements = document.getElementsByClassName('vsa-req-input') as HTMLCollectionOf<HTMLElement>;

  isVSASelected = false;

  togglePronouncedBy() {
    this.isVSASelected = !this.isVSASelected;
    this.vsaReqInput();
  }

  vsaReqInput(): void{
    if(this.isVSASelected){
      for(let i=0; i<this.vsaElements.length; i++){
        const vsaElement = this.vsaElements[i]
        vsaElement.classList.add('req-input')
      }
    }else
    {
      for(let i=0; i<this.vsaElements.length; i++){
        const vsaElement = this.vsaElements[i]
        vsaElement.classList.remove('req-input')
      }
    }
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
