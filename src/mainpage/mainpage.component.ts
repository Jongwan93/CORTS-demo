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
      let path = '';
      switch (selectedValue) {
        case '1':
          path = '/incident-report';
          break;
        case '2':
          path = '/vsa-report';
          break;
        case '3':
          path = '/complaint-report';
          break;
        case '4':
          path = '/cacc-equipment-failure';
          break;
        case '5':
          path = '/fleet-equipment-report';
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
