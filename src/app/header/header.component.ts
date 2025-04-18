import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReportService } from '../services/report.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  constructor() {}

  private router = inject(Router);
  private reportService = inject(ReportService);

  async findCorNumber() {
    const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
    const routedTo = userData?.personnel.name || '';

    const searchCorBody = {
      corNumber: '',
      cadIncidentNum: '',
      createdBy: '',
      routedTo: routedTo,
      corStatus: 0,
      corType: 0,
      dueDate: '',
      createDateFrom: '',
      createDateTo: '',
      text: '',
    };

    const corResponse: any = await firstValueFrom(
      this.reportService.getNumberOfRoutedCOR(JSON.stringify(searchCorBody))
    );
    
    localStorage.setItem('mainpage-message', corResponse.message);

    await this.router.navigate(['/mainpage']);
  }

  isLogoutPage(): boolean {
    return this.router.url === '/logout';
  }

  isQueryPage(): boolean {
    return this.router.url === '/query';
  }
}
