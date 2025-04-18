import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../app/services/auth.service';
import { LookupService } from '../app/services/lookup.service';
import { ReportService } from '../app/services/report.service';

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
  private reportService = inject(ReportService);

  userName: string = ''; // user name for the mainpage
  cortsTypeList: any[] = [];

  loginMessage: string = '';
  corCount: number = 0;

  ngOnInit() {
    // set user name for mainpage
    this.userName = this.authService.getUserName();

    const cortsTypeData = this.lookupService.getLookupData('cort-type');
    if (cortsTypeData && cortsTypeData.data) {
      this.cortsTypeList = cortsTypeData.data;
    }

    this.loginMessage = localStorage.getItem('mainpage-message') || '';

    const raw = localStorage.getItem('search-results');
    if (raw) {
      const corList = JSON.parse(raw);
      this.corCount = corList.length;
    }

    const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
    this.userName = userData?.personnel?.name || '';
  } // =<<<<<<<<<<<<<<<<<<<<end of ngOnInit()

  onProceed(): void {
    const selectedValue = (
      document.getElementById('create-new') as HTMLSelectElement
    ).value;

    const radioValue = (
      document.querySelector('input[name="R1"]:checked') as HTMLInputElement
    ).value;

    if (radioValue === 'NewCOR') {
      let path = '';
      switch (selectedValue) {
        case '1':
          path = '/incident-report';
          break;
        case '2':
          path = '/vsa-report';
          break;
        case '3':
          path = '/complaint-inquiry';
          break;
        case '4':
          path = '/cacc-equipment-failure';
          break;
        case '5':
          path = '/fleet-equipment-failure-vehicle-breakdown';
          break;
        default:
          alert('Please select the correct option to proceed.');
          return;
      }

      this.router.navigate([path], {
        queryParams: { corTypeKey: selectedValue },
      });
    } else if (radioValue === 'FindCOR') {
      this.router.navigate(['/query']);
    } else if (radioValue === 'Logout') {
      this.router.navigate(['/logout']);
    } else {
      alert('Please select the correct option to proceed.');
    }
  }
}
