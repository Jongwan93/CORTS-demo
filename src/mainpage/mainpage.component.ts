import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../app/services/auth.service';
import { LookupService } from '../app/services/lookup.service';

@Component({
  selector: 'app-mainpage',
  standalone: true,
  imports: [RouterModule, CommonModule, NgFor],
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.css'],
})
export class MainpageComponent {
  constructor(private router: Router, private titleService: Title) {
    this.titleService.setTitle('CORTS - Start Page');
  }

  private authService = inject(AuthService);
  private lookupService = inject(LookupService);

  userName: string = ''; // user name for the mainpage
  cortsTypeList: any[] = [];

  ngOnInit() {
    // set user name for mainpage
    this.userName = this.authService.getUserName();

    const cortsTypeData = this.lookupService.getLookupData('cort-type');
    if (cortsTypeData && cortsTypeData.data) {
      this.cortsTypeList = cortsTypeData.data;
    }
  }

  onProceed(): void {
    const selectedValue = (
      document.getElementById('create-new') as HTMLSelectElement
    ).value;

    const radioValue = (
      document.querySelector('input[name="R1"]:checked') as HTMLInputElement
    ).value;

    if (radioValue === 'NewCOR') {
      if (selectedValue === '1') {
        this.router.navigate([
          '/incident-report',
          { corTypeKey: selectedValue },
        ]);
      } else if (selectedValue === '2') {
        this.router.navigate(['/vsa-report', { corTypeKey: selectedValue }]);
      } else if (selectedValue === '3') {
        this.router.navigate([
          '/complaint-report',
          { corTypeKey: selectedValue },
        ]);
      } else if (selectedValue === '4') {
        this.router.navigate([
          '/cacc-equipment-failure',
          { corTypeKey: selectedValue },
        ]);
      } else if (selectedValue === '5') {
        this.router.navigate([
          '/fleet-equipment-report',
          { corTypeKey: selectedValue },
        ]);
      } else {
        alert('Please select the correct option to proceed.');
      }
    } else if (radioValue === 'FindCOR') {
      this.router.navigate(['/query']);
    } else if (radioValue === 'Logout') {
      this.router.navigate(['/logout']);
    } else {
      alert('Please select the correct option to proceed.');
    }
  }
}
