import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../app/services/auth.service';
import { LookupService } from '../app/services/lookup.service';
import { firstValueFrom } from 'rxjs';
import { ReportService } from '../app/services/report.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  caccId: string = '';
  isLoading: boolean = false;

  private hasConfirmedNavigation = false;

  private titleService = inject(Title);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private lookupService = inject(LookupService);
  private reportService = inject(ReportService);

  constructor() {
    this.titleService.setTitle('CORTS - Login');
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationStart &&
        event.restoredState !== null &&
        event.navigationTrigger === 'popstate' &&
        event.url === '/login' &&
        !this.hasConfirmedNavigation
      ) {
        const confirmLeave = confirm(
          'Do you want to move to Login Page? You will be Logged out'
        );

        this.hasConfirmedNavigation = true;

        if (!confirmLeave) {
          history.forward();
        } else {
          this.router.navigate(['/logout']);
        }
      }
    });
  }

  async login() {
    this.isLoading = true;

    const loginData = {
      username: this.username,
      password: this.password,
      caccId: this.caccId,
    };

    try {
      const response = await firstValueFrom(
        this.http.post<{
          status: string;
          message: string;
          data: {
            accessToken: string;
            tokenType: string;
            userPrincipal: any;
            personnel: any;
          };
          timestamp: string;
          code: number;
        }>('api/auth/login', loginData)
      );

      localStorage.setItem('login-token', response.data.accessToken);
      localStorage.setItem(
        'loginUserName',
        response.data.userPrincipal.username
      );
      localStorage.setItem(
        'user-data',
        JSON.stringify({
          ...response.data.userPrincipal,
          personnel: response.data.personnel,
        })
      );

      this.authService.setUser(
        response.data.userPrincipal,
        response.data.personnel
      );

      await this.lookupService.fetchAndStoreLookups();

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
      localStorage.setItem('search-results', JSON.stringify(corResponse.data));

      await this.router.navigate(['/mainpage']);
    } catch (err) {
      alert('Login failed');
      console.error('Login error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  //===============================UTILITY===============================
  onCaccChange(value: string) {
    this.caccId = value.substring(0, 3);
    console.log("caccID refined: ", this.caccId);
  }
}
